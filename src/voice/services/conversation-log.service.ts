import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ConversationSession, ConversationMessage } from '../models/conversation-session.model';
import { Intent } from '../models/intent.enum';
import { ConversationState } from '../models/conversation-state.enum';

@Entity('conversation_logs')
export class ConversationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  role: string; // 'user' | 'assistant' | 'system'

  @Column('text')
  content: string;

  @Column({ nullable: true })
  intent?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  bookingCode?: string;

  @Column('text', { nullable: true })
  metadata?: string; // JSON string

  @CreateDateColumn()
  timestamp: Date;
}

/**
 * Conversation Log Service
 * Handles logging of all text-based conversation interactions
 * 
 * Logs:
 * - User input text
 * - LLM response text
 * - Intent recognition
 * - Conversation state changes
 * - Booking actions
 * 
 * Does NOT log:
 * - Audio (user preference)
 */
@Injectable()
export class ConversationLogService {
  private readonly logger = new Logger(ConversationLogService.name);

  constructor(
    @InjectRepository(ConversationLogEntity)
    private readonly logRepository: Repository<ConversationLogEntity>,
  ) {}

  /**
   * Log a user message
   */
  async logUserInput(
    sessionId: string,
    text: string,
    metadata?: {
      intent?: Intent;
      state?: ConversationState;
      transcribedText?: string; // STT transcribed text (if from voice)
      isVoiceInput?: boolean; // Whether input was from voice (STT) or text
      [key: string]: any;
    },
  ): Promise<void> {
    await this.logMessage(sessionId, 'user', text, metadata);
  }

  /**
   * Log an assistant/LLM response
   */
  async logAssistantResponse(
    sessionId: string,
    text: string,
    metadata?: {
      intent?: Intent;
      state?: ConversationState;
      bookingCode?: string;
      isTtsGenerated?: boolean; // Whether response was converted to TTS
      ttsModel?: string; // TTS model used (if TTS generated)
      ttsVoice?: string; // TTS voice used (if TTS generated)
      [key: string]: any;
    },
  ): Promise<void> {
    await this.logMessage(sessionId, 'assistant', text, metadata);
  }

  /**
   * Log a system message
   */
  async logSystemMessage(
    sessionId: string,
    text: string,
    metadata?: {
      [key: string]: any;
    },
  ): Promise<void> {
    await this.logMessage(sessionId, 'system', text, metadata);
  }

  /**
   * Log an intent recognition
   */
  async logIntent(
    sessionId: string,
    intent: Intent,
    confidence: number,
    userInput: string,
  ): Promise<void> {
    await this.logMessage(sessionId, 'system', `Intent recognized: ${intent} (confidence: ${confidence})`, {
      intent,
      confidence,
      userInput,
    });
  }

  /**
   * Log a state change
   */
  async logStateChange(
    sessionId: string,
    oldState: ConversationState,
    newState: ConversationState,
    reason?: string,
  ): Promise<void> {
    await this.logMessage(sessionId, 'system', `State changed: ${oldState} → ${newState}${reason ? ` (${reason})` : ''}`, {
      oldState,
      newState,
      reason,
    });
  }

  /**
   * Log a booking action
   */
  async logBookingAction(
    sessionId: string,
    action: string,
    bookingCode: string,
    details?: any,
  ): Promise<void> {
    await this.logMessage(sessionId, 'system', `Booking action: ${action} (${bookingCode})`, {
      action,
      bookingCode,
      details,
    });
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    const logs = await this.logRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });

    return logs.map((log) => ({
      role: log.role as 'user' | 'assistant' | 'system',
      content: log.content,
      timestamp: log.timestamp,
      metadata: {
        intent: log.intent as Intent | undefined,
        state: log.state as ConversationState | undefined,
        bookingCode: log.bookingCode,
        ...(log.metadata ? JSON.parse(log.metadata) : {}),
      },
    }));
  }

  /**
   * Get all logs (for debugging)
   */
  async getAllLogs(limit: number = 100): Promise<any[]> {
    const logs = await this.logRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      sessionId: log.sessionId,
      role: log.role,
      content: log.content,
      intent: log.intent,
      state: log.state,
      bookingCode: log.bookingCode,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      timestamp: log.timestamp,
    }));
  }

  /**
   * Get logs by session ID (raw database format)
   */
  async getLogsBySession(sessionId: string): Promise<any[]> {
    const logs = await this.logRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });

    return logs.map((log) => ({
      id: log.id,
      sessionId: log.sessionId,
      role: log.role,
      content: log.content,
      intent: log.intent,
      state: log.state,
      bookingCode: log.bookingCode,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      timestamp: log.timestamp,
    }));
  }

  /**
   * Private method to log a message
   */
  private async logMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: any,
  ): Promise<void> {
    try {
      // Validate content - don't log empty or invalid content
      if (!content || content.trim().length === 0) {
        this.logger.warn(`Skipping log for empty content (role: ${role}, session: ${sessionId})`);
        return;
      }

      // Check for garbage characters (non-printable or invalid unicode)
      const hasValidContent = /[\w\s.,!?;:'"()-]/.test(content) || content.length > 0;
      if (!hasValidContent && content.length < 3) {
        this.logger.warn(`Skipping log for invalid content: "${content.substring(0, 50)}" (role: ${role}, session: ${sessionId})`);
        return;
      }

      const log = this.logRepository.create({
        sessionId,
        role,
        content: content.substring(0, 10000), // Limit content length
        intent: metadata?.intent,
        state: metadata?.state,
        bookingCode: metadata?.bookingCode,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      const savedLog = await this.logRepository.save(log);
      this.logger.log(`✅ Logged ${role} message for session ${sessionId} (log ID: ${savedLog.id})`);
      
      // Verify it was actually saved
      const verifyLog = await this.logRepository.findOne({ where: { id: savedLog.id } });
      if (!verifyLog) {
        this.logger.error(`❌ Log was not persisted! Log ID: ${savedLog.id}, Session: ${sessionId}`);
      } else {
        this.logger.debug(`✅ Verified log persisted: ${verifyLog.id}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to log message for session ${sessionId}: ${error.message}`, error.stack);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      this.logger.error(`Error name: ${error.name}, Error code: ${(error as any).code}`);
      // Don't throw - logging failures shouldn't break the conversation
    }
  }
}

