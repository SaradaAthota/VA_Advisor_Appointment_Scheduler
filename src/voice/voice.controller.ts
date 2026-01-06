import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  Header,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ConversationService } from './services/conversation.service';
import { ConversationLogService } from './services/conversation-log.service';
import { SttService } from './services/stt.service';
import { TtsService } from './services/tts.service';
import { StartSessionResponseDto } from './dto/start-session.dto';
import { ProcessMessageDto, ProcessMessageResponseDto } from './dto/process-message.dto';

/**
 * Voice Agent Controller
 * Handles text-based and voice-based agent interactions (Phase 6 & 7)
 */
@Controller('voice')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly sttService: SttService,
    private readonly ttsService: TtsService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Start a new conversation session
   * POST /voice/session/start
   */
  @Post('session/start')
  @HttpCode(HttpStatus.OK)
  async startSession(): Promise<StartSessionResponseDto> {
    const result = await this.conversationService.startSession();
    return {
      sessionId: result.sessionId,
      greeting: result.greeting,
    };
  }

  /**
   * Process a user message
   * POST /voice/session/:sessionId/message
   */
  @Post('session/:sessionId/message')
  @HttpCode(HttpStatus.OK)
  async processMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: ProcessMessageDto,
  ): Promise<ProcessMessageResponseDto> {
    const result = await this.conversationService.processMessage(sessionId, dto.message);
    return {
      response: result.response,
      state: result.state,
      bookingCode: result.bookingCode,
    };
  }

  /**
   * Get conversation history
   * GET /voice/session/:sessionId/history
   */
  @Get('session/:sessionId/history')
  async getHistory(@Param('sessionId') sessionId: string) {
    const history = await this.conversationService.getConversationHistory(sessionId);
    return { messages: history };
  }

  /**
   * Get session state
   * GET /voice/session/:sessionId/state
   */
  @Get('session/:sessionId/state')
  async getState(@Param('sessionId') sessionId: string) {
    const state = this.conversationService.getSessionState(sessionId);
    const session = this.conversationService.getSession(sessionId);
    return {
      state,
      topic: session?.topic || null,
      messagesCount: session?.messages?.length || 0,
    };
  }

  /**
   * Get session debug info
   * GET /voice/session/:sessionId/debug
   */
  @Get('session/:sessionId/debug')
  async getSessionDebug(@Param('sessionId') sessionId: string) {
    return this.conversationService.getSessionDebug(sessionId);
  }

  /**
   * Get all conversation logs (Debug endpoint)
   * GET /voice/logs/all
   */
  @Get('logs/all')
  async getAllLogs() {
    return await this.conversationService.getAllLogs();
  }

  /**
   * Get logs by session ID
   * GET /voice/logs/session/:sessionId
   */
  @Get('logs/session/:sessionId')
  async getLogsBySession(@Param('sessionId') sessionId: string) {
    return await this.conversationService.getLogsBySession(sessionId);
  }

  /**
   * Speech-to-Text endpoint
   * POST /voice/stt
   * Accepts audio file and returns transcribed text
   */
  @Post('stt')
  @UseInterceptors(FileInterceptor('audio'))
  @HttpCode(HttpStatus.OK)
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ text: string }> {
    if (!file) {
      throw new Error('No audio file provided');
    }

    const text = await this.sttService.transcribeAudio(
      file.buffer,
      file.originalname || 'audio.webm',
    );

    return { text };
  }

  /**
   * Text-to-Speech endpoint
   * POST /voice/tts
   * Accepts text and returns audio file (MP3)
   */
  @Post('tts')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'audio/mpeg')
  async textToSpeech(
    @Body() body: { text: string; voice?: string; model?: string },
    @Res() res: Response,
  ): Promise<void> {
    const audioBuffer = await this.ttsService.textToSpeech(
      body.text,
      body.voice,
      body.model,
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  }

  /**
   * Combined voice message endpoint
   * POST /voice/session/:sessionId/voice-message
   * End-to-end voice processing: audio → text → process → text → audio
   */
  @Post('session/:sessionId/voice-message')
  @UseInterceptors(FileInterceptor('audio'))
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'audio/mpeg')
  async processVoiceMessage(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!file) {
        throw new Error('No audio file provided');
      }

      // Step 1: STT - Convert audio to text
      this.logger.log(`[VOICE MESSAGE] Starting transcription for session: ${sessionId}`);
      this.logger.log(`[VOICE MESSAGE] Audio file: ${file.originalname || 'audio.webm'}, size: ${(file.size / 1024).toFixed(2)} KB, mimeType: ${file.mimetype}`);

      let userText: string;
      try {
        userText = await this.sttService.transcribeAudio(
          file.buffer,
          file.originalname || 'audio.webm',
        );
        this.logger.log(`[VOICE MESSAGE] STT transcribed: "${userText}" (length: ${userText.length})`);
      } catch (sttError: any) {
        this.logger.error(`[VOICE MESSAGE] STT failed: ${sttError.message}`);
        // Return error response
        res.status(HttpStatus.BAD_REQUEST).json({
          message: sttError.message || 'Failed to transcribe audio. Please try again or use text mode.',
          error: 'STT Transcription Failed',
          statusCode: HttpStatus.BAD_REQUEST,
        });
        return;
      }

      // Step 2: Process message (existing conversation logic)
      this.logger.log(`[VOICE MESSAGE] Processing message with transcribed text: "${userText}"`);

      // Get TTS config for logging
      const ttsModel = this.configService.get<string>('OPENAI_TTS_MODEL', 'tts-1');
      const ttsVoice = this.configService.get<string>('OPENAI_TTS_VOICE', 'nova');

      // Process message with metadata indicating this is voice input and TTS output
      const result = await this.conversationService.processMessage(
        sessionId,
        userText,
        {
          isVoiceInput: true,
          transcribedText: userText,
          isTtsResponse: true,
          ttsModel,
          ttsVoice,
        },
      );
      this.logger.log(`[VOICE MESSAGE] Processed. State: ${result.state}, Response length: ${result.response.length}`);

      // Step 3: TTS - Convert response text to audio
      const audioBuffer = await this.ttsService.textToSpeech(
        result.response,
        ttsVoice,
        ttsModel,
      );

      // Set response headers with metadata
      // Note: HTTP headers cannot contain newlines or certain special characters
      // So we need to sanitize the response text before setting it as a header
      const sanitizedResponseText = result.response
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .substring(0, 200); // Limit header length

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('X-Response-Text', sanitizedResponseText);
      res.setHeader('X-State', result.state);
      if (result.bookingCode) {
        res.setHeader('X-Booking-Code', result.bookingCode);
      }

      res.send(audioBuffer);
    } catch (error: any) {
      // Log the error for debugging
      this.logger.error(`[VOICE MESSAGE] Error processing voice message: ${error.message}`, error.stack);

      // Extract more details from the error
      let errorMessage = error.message || 'Unknown error occurred';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      // Handle specific error types
      if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
        statusCode = HttpStatus.BAD_GATEWAY;
        errorMessage = 'OpenAI API is temporarily unavailable. Please try again in a moment or switch to text mode.';
      } else if (error.message?.includes('API key') || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        statusCode = HttpStatus.UNAUTHORIZED;
        errorMessage = 'OpenAI API key is invalid. Please check your OPENAI_API_KEY in .env file.';
      } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        statusCode = HttpStatus.TOO_MANY_REQUESTS;
        errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message?.includes('No audio file')) {
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'No audio file was provided. Please try recording again.';
      }

      // Return error response as JSON (not audio)
      res.status(statusCode).json({
        message: `Sorry, I encountered an error: ${errorMessage}. You can try again or switch to text mode.`,
        error: errorMessage,
        statusCode: statusCode,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

