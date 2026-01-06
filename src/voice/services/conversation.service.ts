import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { ConversationSession, ConversationMessage } from '../models/conversation-session.model';
import { ConversationState } from '../models/conversation-state.enum';
import { Intent } from '../models/intent.enum';
import { Topic } from '../../domain/models/topic.enum';
import { TimePreference, Slot } from '../../domain/models/slot.model';
import { IntentRecognitionService } from './intent-recognition.service';
import { ConversationLogService } from './conversation-log.service';
import { BookingService } from '../../booking/booking.service';
import { SlotService } from '../../domain/services/slot.service';
import { MockCalendarService } from '../../domain/services/mock-calendar.service';

/**
 * Conversation Service
 * Manages the voice agent conversation flow and state
 */
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private openai: OpenAI | null = null;
  private sessions: Map<string, ConversationSession> = new Map();
  private slotService: SlotService;

  constructor(
    private readonly configService: ConfigService,
    private readonly intentRecognition: IntentRecognitionService,
    private readonly conversationLog: ConversationLogService,
    private readonly bookingService: BookingService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized for conversation');
    } else {
      this.logger.warn('OPENAI_API_KEY not found - conversation will use template responses');
    }

    // Initialize slot service
    const mockCalendar = new MockCalendarService();
    this.slotService = new SlotService(
      mockCalendar,
      async () => {
        const bookedSlots = await this.bookingService.getBookedSlots();
        return bookedSlots.map(slot => ({
          ...slot,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        }));
      },
    );
  }

  /**
   * Start a new conversation session
   */
  async startSession(): Promise<{ sessionId: string; greeting: string }> {
    const sessionId = uuidv4();
    const session: ConversationSession = {
      sessionId,
      state: ConversationState.GREETING,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      timeZone: 'IST',
    };

    this.sessions.set(sessionId, session);

    const greeting = this.getGreeting();
    await this.addMessage(session, 'assistant', greeting);
    await this.conversationLog.logAssistantResponse(sessionId, greeting, {
      state: ConversationState.GREETING,
    });

    return { sessionId, greeting };
  }

  /**
   * Process user input and return response
   */
  async processMessage(
    sessionId: string,
    userInput: string,
    options?: {
      isVoiceInput?: boolean;
      transcribedText?: string;
      isTtsResponse?: boolean;
      ttsModel?: string;
      ttsVoice?: string;
    },
  ): Promise<{ response: string; state: ConversationState; bookingCode?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Log user input with metadata
    await this.addMessage(session, 'user', userInput);
    await this.conversationLog.logUserInput(sessionId, userInput, {
      state: session.state,
      transcribedText: options?.transcribedText || userInput,
      isVoiceInput: options?.isVoiceInput || false,
    });

    this.logger.debug(`Processing message in state: ${session.state}, input: "${userInput.substring(0, 50)}..."`);

    // Recognize intent
    const { intent, confidence } = await this.intentRecognition.recognizeIntent(userInput);
    await this.conversationLog.logIntent(sessionId, intent, confidence, userInput);
    
    this.logger.debug(`Recognized intent: ${intent} (confidence: ${confidence})`);

    // Update session
    session.currentIntent = intent;
    session.updatedAt = new Date();

    // Process based on current state and intent
    const result = await this.processConversation(session, userInput, intent);
    
    this.logger.debug(`State transition: ${session.state} -> ${result.state}`);

    // Log assistant response with metadata
    await this.conversationLog.logAssistantResponse(sessionId, result.response, {
      intent,
      state: result.state,
      bookingCode: result.bookingCode,
      isTtsGenerated: options?.isTtsResponse || false,
      ttsModel: options?.ttsModel,
      ttsVoice: options?.ttsVoice,
    });

    return result;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    return session.messages;
  }

  /**
   * Get session state
   */
  getSessionState(sessionId: string): ConversationState | null {
    const session = this.sessions.get(sessionId);
    return session?.state || null;
  }

  /**
   * Get session (for debugging)
   */
  getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get session debug info
   */
  getSessionDebug(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    return {
      sessionId: session.sessionId,
      state: session.state,
      topic: session.topic,
      timePreference: session.timePreference,
      currentIntent: session.currentIntent,
      bookingCode: session.bookingCode,
      messagesCount: session.messages.length,
      lastMessages: session.messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 100),
        timestamp: msg.timestamp,
      })),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  /**
   * Get all logs (delegates to ConversationLogService)
   */
  async getAllLogs(limit?: number) {
    return await this.conversationLog.getAllLogs(limit);
  }

  /**
   * Get logs by session ID (delegates to ConversationLogService)
   */
  async getLogsBySession(sessionId: string) {
    return await this.conversationLog.getLogsBySession(sessionId);
  }

  /**
   * Process conversation based on state and intent
   */
  private async processConversation(
    session: ConversationSession,
    userInput: string,
    intent: Intent,
  ): Promise<{ response: string; state: ConversationState; bookingCode?: string }> {
    const oldState = session.state;

    switch (session.state) {
      case ConversationState.GREETING:
        return await this.handleGreeting(session, userInput, intent);

      case ConversationState.DISCLAIMER:
        return await this.handleDisclaimer(session, userInput, intent);

      case ConversationState.COLLECTING_TOPIC:
        return await this.handleTopicCollection(session, userInput, intent);

      case ConversationState.COLLECTING_TIME_PREFERENCE:
        return await this.handleTimePreferenceCollection(session, userInput, intent);

      case ConversationState.OFFERING_SLOTS:
        return await this.handleSlotSelection(session, userInput, intent);

      case ConversationState.CONFIRMING_BOOKING:
        return await this.handleBookingConfirmation(session, userInput, intent);

      default:
        // Handle other intents
        if (intent === Intent.BOOK_NEW && session.state !== ConversationState.BOOKING_CONFIRMED) {
          return await this.handleGreeting(session, userInput, intent);
        }
        if (intent === Intent.RESCHEDULE) {
          return await this.handleReschedule(session, userInput);
        }
        if (intent === Intent.CANCEL) {
          return await this.handleCancel(session, userInput);
        }
        if (intent === Intent.CHECK_AVAILABILITY) {
          return await this.handleCheckAvailability(session, userInput);
        }
        if (intent === Intent.WHAT_TO_PREPARE) {
          return await this.handleWhatToPrepare(session, userInput);
        }

        return {
          response: "I'm not sure how to help with that. Would you like to book an appointment?",
          state: session.state,
        };
    }
  }

  /**
   * Handle greeting state
   */
  private async handleGreeting(
    session: ConversationSession,
    userInput: string,
    intent: Intent,
  ): Promise<{ response: string; state: ConversationState }> {
    // Check if input is garbage/invalid (like "ԾԾԾԾԾԾԾԾԾԾԾԾԾ")
    const isValidInput = /[\w\s.,!?;:'"()-]/.test(userInput) && userInput.length > 2;
    
    if (!isValidInput) {
      this.logger.warn(`[GREETING] Invalid input detected: "${userInput}" - likely STT transcription error`);
      const response = "I'm having trouble understanding your voice input. The transcription might not be accurate. Please try:\n\n1. Speaking more clearly and slowly\n2. Using text mode instead\n3. Checking your microphone settings";
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state };
    }

    // Check for booking keywords even if intent is unknown
    const lowerInput = userInput.toLowerCase();
    const hasBookingKeywords = /\b(book|appointment|schedule|meeting|slot)\b/.test(lowerInput);
    
    if (intent === Intent.BOOK_NEW || intent === Intent.GREETING || hasBookingKeywords) {
      const oldState = session.state;
      session.state = ConversationState.DISCLAIMER;
      await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, 'User wants to book');
      
      const disclaimer = this.getDisclaimer();
      await this.addMessage(session, 'assistant', disclaimer);
      return { response: disclaimer, state: session.state };
    }

    // If intent is unknown but input seems valid, still try to progress
    if (intent === Intent.UNKNOWN && isValidInput) {
      this.logger.debug(`[GREETING] Unknown intent but valid input, checking for booking keywords`);
      if (hasBookingKeywords) {
        const oldState = session.state;
        session.state = ConversationState.DISCLAIMER;
        await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, 'User wants to book (detected from keywords)');
        
        const disclaimer = this.getDisclaimer();
        await this.addMessage(session, 'assistant', disclaimer);
        return { response: disclaimer, state: session.state };
      }
    }

    // Default: repeat greeting but with helpful message
    const response = this.getGreeting() + "\n\nYou can say 'I want to book an appointment' to get started.";
    await this.addMessage(session, 'assistant', response);
    return { response, state: session.state };
  }

  /**
   * Handle disclaimer state
   */
  private async handleDisclaimer(
    session: ConversationSession,
    userInput: string,
    intent: Intent,
  ): Promise<{ response: string; state: ConversationState }> {
    // User acknowledges disclaimer (any response)
    const oldState = session.state;
    session.state = ConversationState.COLLECTING_TOPIC;
    await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, 'Disclaimer acknowledged');

    const response = this.getTopicPrompt();
    await this.addMessage(session, 'assistant', response);
    return { response, state: session.state };
  }

  /**
   * Handle topic collection
   */
  private async handleTopicCollection(
    session: ConversationSession,
    userInput: string,
    intent: Intent,
  ): Promise<{ response: string; state: ConversationState }> {
    // Check if topic is already set (prevent repeating question)
    if (session.topic) {
      this.logger.debug(`Topic already set to ${session.topic}, moving to time preference`);
      const oldState = session.state;
      session.state = ConversationState.COLLECTING_TIME_PREFERENCE;
      await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, `Topic already set: ${session.topic}`);
      const response = this.getTimePreferencePrompt();
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state };
    }

    // Log the exact input we're trying to extract from
    this.logger.log(`[TOPIC COLLECTION] Attempting to extract topic from: "${userInput}" (state: ${session.state})`);
    this.logger.log(`[TOPIC COLLECTION] Session topic currently: ${session.topic || 'not set'}`);
    
    // Try keyword-based extraction first
    let topic = this.extractTopic(userInput);
    this.logger.log(`[TOPIC EXTRACTION] Keyword extraction result: ${topic || 'null'} from "${userInput}"`);
    
    // If keyword extraction fails, try using OpenAI to extract topic
    if (!topic && this.openai) {
      this.logger.log('[TOPIC EXTRACTION] Keyword extraction failed, trying OpenAI-based topic extraction');
      topic = await this.extractTopicWithLLM(userInput);
      this.logger.log(`[TOPIC EXTRACTION] OpenAI result: ${topic || 'null'}`);
    }
    
    // Final fallback: if still no topic, check if input is too short or unclear (likely transcription error)
    if (!topic) {
      this.logger.warn(`[TOPIC EXTRACTION] Both keyword and LLM extraction failed for: "${userInput}"`);
      
      // If input is very short (like "you", "yes", "ok"), it might be a transcription error
      // In this case, we should ask the user to repeat or try text mode
      if (userInput.length <= 5 && userInput.toLowerCase().match(/^(you|yes|ok|yeah|yep|sure|uh|um)$/)) {
        this.logger.warn(`[TOPIC EXTRACTION] Input "${userInput}" is too short/unclear - likely transcription error`);
        // Don't try to extract from context here - it causes loops
        // Instead, we'll handle this in the error message below
      }
    }
    
    if (!topic) {
      // Count how many times we've asked
      const assistantMessages = session.messages
        .filter(msg => msg.role === 'assistant')
        .slice(-10); // Check last 10 messages
      
      const askCount = assistantMessages.filter(msg => 
        msg.content.includes("I didn't catch that") || 
        msg.content.includes("Please choose one of the topics") ||
        msg.content.includes("I'm having trouble understanding")
      ).length;

      this.logger.warn(`[TOPIC COLLECTION] Topic not recognized after ${askCount} attempts. User input: "${userInput}"`);

      // After 2+ attempts, try a more aggressive fallback - accept if input contains ANY topic-related word
      if (askCount >= 2) {
        const lowerInput = userInput.toLowerCase().trim();
        this.logger.log(`[TOPIC COLLECTION] Attempting aggressive fallback for: "${userInput}"`);
        
        // Very aggressive matching - if it sounds even remotely like a topic, accept it
        if (lowerInput.includes('kyc') || lowerInput.includes('key') || lowerInput.includes('see') || 
            lowerInput.includes('onboard') || lowerInput.includes('on board') || lowerInput.includes('kay')) {
          this.logger.log(`[TOPIC COLLECTION] Aggressive fallback: Accepting KYC_ONBOARDING based on: "${userInput}"`);
          topic = Topic.KYC_ONBOARDING;
        } else if (lowerInput.includes('sip') || lowerInput.includes('mandate')) {
          this.logger.log(`[TOPIC COLLECTION] Aggressive fallback: Accepting SIP_MANDATES based on: "${userInput}"`);
          topic = Topic.SIP_MANDATES;
        } else if (lowerInput.includes('statement') || lowerInput.includes('tax') || lowerInput.includes('doc')) {
          this.logger.log(`[TOPIC COLLECTION] Aggressive fallback: Accepting STATEMENTS_TAX_DOCS based on: "${userInput}"`);
          topic = Topic.STATEMENTS_TAX_DOCS;
        } else if (lowerInput.includes('withdraw') || lowerInput.includes('timeline')) {
          this.logger.log(`[TOPIC COLLECTION] Aggressive fallback: Accepting WITHDRAWALS_TIMELINES based on: "${userInput}"`);
          topic = Topic.WITHDRAWALS_TIMELINES;
        } else if (lowerInput.includes('account') || lowerInput.includes('change') || lowerInput.includes('nominee')) {
          this.logger.log(`[TOPIC COLLECTION] Aggressive fallback: Accepting ACCOUNT_CHANGES_NOMINEE based on: "${userInput}"`);
          topic = Topic.ACCOUNT_CHANGES_NOMINEE;
        } else if (askCount >= 3 && (lowerInput === 'you' || lowerInput.length <= 3)) {
          // If we've asked 3+ times and user keeps saying short words like "you", 
          // it's likely a transcription issue - suggest using text mode or speaking more clearly
          const response = "I'm having trouble understanding your voice input. The transcription might not be accurate. Please try:\n\n1. Speaking more clearly and slowly\n2. Saying just 'KYC' or 'Onboarding'\n3. Using text mode instead\n4. Or say the number: 1, 2, 3, 4, or 5";
          await this.addMessage(session, 'assistant', response);
          return { response, state: session.state };
        }
      }

      // If still no topic after aggressive fallback
      if (!topic) {
        if (askCount >= 3) {
          // After 3 attempts, be more helpful and accept any reasonable input
          const response = "I'm having trouble understanding the topic. Let me help you:\n\nYou can say any of these:\n1. KYC or Onboarding\n2. SIP or Mandates\n3. Statements or Tax Documents\n4. Withdrawals or Timelines\n5. Account Changes or Nominee\n\nOr just say the number (1, 2, 3, 4, or 5).";
          await this.addMessage(session, 'assistant', response);
          return { response, state: session.state };
        }

        if (askCount >= 1) {
          // After 1 attempt, provide more guidance
          const response = "I didn't catch that. Please say one of these:\n- 'KYC' or 'Onboarding'\n- 'SIP' or 'Mandates'\n- 'Statements' or 'Tax Docs'\n- 'Withdrawals' or 'Timelines'\n- 'Account Changes' or 'Nominee'";
          await this.addMessage(session, 'assistant', response);
          return { response, state: session.state };
        }

        const response = "I didn't catch that. Please choose one of the topics: KYC/Onboarding, SIP/Mandates, Statements/Tax Docs, Withdrawals & Timelines, or Account Changes/Nominee.";
        await this.addMessage(session, 'assistant', response);
        return { response, state: session.state };
      }
    }

    session.topic = topic;
    const oldState = session.state;
    session.state = ConversationState.COLLECTING_TIME_PREFERENCE;
    await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, `Topic selected: ${topic}`);

    const response = this.getTimePreferencePrompt();
    await this.addMessage(session, 'assistant', response);
    return { response, state: session.state };
  }

  /**
   * Handle time preference collection
   */
  private async handleTimePreferenceCollection(
    session: ConversationSession,
    userInput: string,
    intent: Intent,
  ): Promise<{ response: string; state: ConversationState }> {
    const timePreference = this.extractTimePreference(userInput);
    if (!timePreference) {
      const response = "When would you prefer? For example: 'Monday morning', 'Tuesday afternoon', or 'next week evening'.";
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state };
    }

    session.timePreference = timePreference;
    const oldState = session.state;
    session.state = ConversationState.OFFERING_SLOTS;
    await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, 'Time preference collected');

    // Offer slots
    const slots = await this.slotService.offerTwoSlots(session.timePreference);
    session.offeredSlots = slots;

    if (slots.length === 0) {
      // No slots available - create waitlist
      const response = "I'm sorry, but there are no available slots matching your preference. I can add you to a waitlist. Would you like me to do that?";
      await this.addMessage(session, 'assistant', response);
      return { response, state: ConversationState.COMPLETED };
    }

    const response = this.formatSlotOffer(slots, session.timeZone);
    await this.addMessage(session, 'assistant', response);
    return { response, state: session.state };
  }

  /**
   * Handle slot selection
   */
  private async handleSlotSelection(
    session: ConversationSession,
    userInput: string,
    intent: Intent,
  ): Promise<{ response: string; state: ConversationState }> {
    // Check if user is providing a new time preference (e.g., "book on Tuesday", "try Tuesday")
    const newTimePreference = this.extractTimePreference(userInput);
    if (newTimePreference && (newTimePreference.day || newTimePreference.timeOfDay)) {
      // User wants to change the time preference - update and offer new slots
      session.timePreference = newTimePreference;
      const oldState = session.state;
      await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, `Time preference updated: ${newTimePreference.day || ''} ${newTimePreference.timeOfDay || ''}`);

      // Offer new slots with updated preference
      const slots = await this.slotService.offerTwoSlots(session.timePreference);
      session.offeredSlots = slots;

      if (slots.length === 0) {
        const response = "I'm sorry, but there are no available slots for that time. Would you like to try a different day or time?";
        await this.addMessage(session, 'assistant', response);
        return { response, state: session.state };
      }

      const response = this.formatSlotOffer(slots, session.timeZone);
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state };
    }

    // Check if user is declining (e.g., "no", "not that")
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('no') && (lowerInput.includes('slot') || lowerInput.includes('that') || lowerInput.includes('these'))) {
      // User doesn't like the offered slots - ask for new time preference
      const response = "I understand. When would you prefer instead? Please mention a day (like Monday, Tuesday) and time of day (morning, afternoon, or evening).";
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state };
    }

    if (!session.offeredSlots || session.offeredSlots.length === 0) {
      return {
        response: "I don't have any slots to offer. Let me start over.",
        state: ConversationState.COLLECTING_TOPIC,
      };
    }

    // Check if user mentioned a specific date that doesn't match offered slots
    const parsedDate = this.parseDateFromInput(userInput);
    if (parsedDate) {
      // Check if this date matches any offered slot
      const matchingSlot = session.offeredSlots.find(slot => {
        const slotDate = new Date(slot.startTime);
        return (
          slotDate.getFullYear() === parsedDate.getFullYear() &&
          slotDate.getMonth() === parsedDate.getMonth() &&
          slotDate.getDate() === parsedDate.getDate()
        );
      });

      if (!matchingSlot) {
        // User requested a date that's not in the offered slots
        // Offer new slots for that date
        const timePreference: TimePreference = {
          specificDate: parsedDate,
        };
        session.timePreference = timePreference;
        
        const slots = await this.slotService.offerTwoSlots(timePreference);
        session.offeredSlots = slots;

        if (slots.length === 0) {
          const response = `I'm sorry, but there are no available slots on ${this.formatDate(parsedDate)}. Would you like to try a different date?`;
          await this.addMessage(session, 'assistant', response);
          return { response, state: session.state };
        }

        const response = `Here are available slots for ${this.formatDate(parsedDate)}:\n${this.formatSlotOffer(slots, session.timeZone)}`;
        await this.addMessage(session, 'assistant', response);
        return { response, state: session.state };
      }
    }

    const selectedSlot = this.extractSlotSelection(userInput, session.offeredSlots);
    if (!selectedSlot) {
      const response = `Please choose one of the slots I offered. You can say "first slot", "second slot", or mention the date and time. Or if you'd like different times, let me know your preference.`;
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state };
    }

    session.selectedSlot = selectedSlot;
    const oldState = session.state;
    session.state = ConversationState.CONFIRMING_BOOKING;
    await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, 'Slot selected');

    const response = this.getConfirmationPrompt(selectedSlot, session.timeZone);
    await this.addMessage(session, 'assistant', response);
    return { response, state: session.state };
  }

  /**
   * Handle booking confirmation
   */
  private async handleBookingConfirmation(
    session: ConversationSession,
    userInput: string,
    intent: Intent,
  ): Promise<{ response: string; state: ConversationState; bookingCode?: string }> {
    const confirmed = this.isConfirmation(userInput);
    const cancelled = this.isCancellation(userInput);
    
    // Handle cancellation
    if (cancelled) {
      const oldState = session.state;
      session.state = ConversationState.OFFERING_SLOTS;
      session.selectedSlot = undefined;
      await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, 'User cancelled booking confirmation');
      
      if (session.offeredSlots && session.offeredSlots.length > 0) {
        const response = "No problem! Would you like to choose a different slot, or would you prefer a different time?";
        await this.addMessage(session, 'assistant', response);
        return { response, state: session.state };
      } else {
        const response = "No problem! When would you prefer your appointment? Please mention a day and time of day.";
        session.state = ConversationState.COLLECTING_TIME_PREFERENCE;
        await this.addMessage(session, 'assistant', response);
        return { response, state: session.state };
      }
    }
    
    // If not confirmed and not cancelled, ask again (but only once)
    if (!confirmed) {
      // Check if we've already asked this question (to avoid infinite loop)
      // Look at the last few assistant messages to see if we already asked
      const assistantMessages = session.messages
        .filter(msg => msg.role === 'assistant')
        .slice(-2); // Get last 2 assistant messages
      
      const alreadyAsked = assistantMessages.some(msg => 
        msg.content.includes('Would you like to proceed') || 
        msg.content.includes("I understand you're not ready")
      );
      
      if (alreadyAsked) {
        // Already asked, provide more options
        const response = "I understand you're not ready to confirm. Would you like to:\n1. Choose a different slot\n2. Change the time preference\n3. Start over with a new booking\n\nPlease let me know what you'd prefer.";
        await this.addMessage(session, 'assistant', response);
        return { response, state: session.state };
      } else {
        // First time asking
        const response = "Would you like to proceed with this booking? Please say 'yes' or 'confirm' to proceed, or 'no' to cancel.";
        await this.addMessage(session, 'assistant', response);
        return { response, state: session.state };
      }
    }

    if (!session.topic || !session.selectedSlot) {
      return {
        response: "I'm missing some information. Let me start over.",
        state: ConversationState.COLLECTING_TOPIC,
      };
    }

    // Create booking
    try {
      const booking = await this.bookingService.createBooking(
        session.topic,
        session.selectedSlot,
        session.offeredSlots?.[1], // Alternative slot
      );

      session.bookingCode = booking.bookingCode;
      const oldState = session.state;
      session.state = ConversationState.BOOKING_CONFIRMED;
      await this.conversationLog.logStateChange(session.sessionId, oldState, session.state, `Booking created: ${booking.bookingCode}`);
      await this.conversationLog.logBookingAction(session.sessionId, 'create', booking.bookingCode);

      const response = this.getBookingConfirmationMessage(booking.bookingCode, session.selectedSlot, session.timeZone);
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state, bookingCode: booking.bookingCode };
    } catch (error) {
      this.logger.error(`Failed to create booking: ${error.message}`, error.stack);
      const response = "I'm sorry, but I couldn't create the booking. Please try again or contact support.";
      await this.addMessage(session, 'assistant', response);
      return { response, state: ConversationState.ERROR };
    }
  }

  /**
   * Handle reschedule intent
   */
  private async handleReschedule(
    session: ConversationSession,
    userInput: string,
  ): Promise<{ response: string; state: ConversationState }> {
    const response = "To reschedule, I'll need your booking code. Please provide your booking code (format: NL-XXXX).";
    await this.addMessage(session, 'assistant', response);
    session.state = ConversationState.RESCHEDULING;
    return { response, state: session.state };
  }

  /**
   * Handle cancel intent
   */
  private async handleCancel(
    session: ConversationSession,
    userInput: string,
  ): Promise<{ response: string; state: ConversationState }> {
    const response = "To cancel, I'll need your booking code. Please provide your booking code (format: NL-XXXX).";
    await this.addMessage(session, 'assistant', response);
    session.state = ConversationState.CANCELLING;
    return { response, state: session.state };
  }

  /**
   * Handle check availability intent
   */
  private async handleCheckAvailability(
    session: ConversationSession,
    userInput: string,
  ): Promise<{ response: string; state: ConversationState }> {
    const timePreference = this.extractTimePreference(userInput);
    const slots = await this.slotService.offerMultipleSlots(5, timePreference || undefined);
    
    if (slots.length === 0) {
      const response = "I'm sorry, but there are no available slots at the moment. Would you like to be added to a waitlist?";
      await this.addMessage(session, 'assistant', response);
      return { response, state: session.state };
    }

    const response = `Here are the available slots:\n${this.formatSlotList(slots, session.timeZone)}`;
    await this.addMessage(session, 'assistant', response);
    return { response, state: session.state };
  }

  /**
   * Handle what to prepare intent
   */
  private async handleWhatToPrepare(
    session: ConversationSession,
    userInput: string,
  ): Promise<{ response: string; state: ConversationState }> {
    const response = `For your appointment, please prepare:
- Valid ID proof (Aadhaar, PAN, Passport, or Driving License)
- Address proof (if required)
- Any relevant documents related to your topic
- List of questions you'd like to ask

For more information, visit: https://groww.in/help`;
    await this.addMessage(session, 'assistant', response);
    return { response, state: session.state };
  }

  // Helper methods for text extraction and formatting

  private getGreeting(): string {
    return "Hello! I'm your advisor appointment scheduler. How can I help you today?";
  }

  private getDisclaimer(): string {
    return "Before we proceed, please note: This service provides informational assistance only and does not constitute investment advice. All investment decisions should be made after consulting with a qualified financial advisor.";
  }

  private getTopicPrompt(): string {
    return "What topic would you like to discuss? Please choose one:\n- KYC/Onboarding\n- SIP/Mandates\n- Statements/Tax Docs\n- Withdrawals & Timelines\n- Account Changes/Nominee";
  }

  private getTimePreferencePrompt(): string {
    return "When would you prefer your appointment? You can mention a day (like Monday, Tuesday) and time of day (morning, afternoon, or evening), or a specific date.";
  }

  private getConfirmationPrompt(slot: Slot, timeZone: string): string {
    const startTime = this.formatDateTime(slot.startTime, timeZone);
    const endTime = this.formatDateTime(slot.endTime, timeZone);
    return `Please confirm your booking:\nDate & Time: ${startTime} to ${endTime} ${timeZone}\n\nSay 'yes' or 'confirm' to proceed, or 'no' to cancel.`;
  }

  private getBookingConfirmationMessage(bookingCode: string, slot: Slot, timeZone: string): string {
    const startTime = this.formatDateTime(slot.startTime, timeZone);
    const endTime = this.formatDateTime(slot.endTime, timeZone);
    return `Great! Your booking is confirmed.\n\nBooking Code: ${bookingCode}\nDate & Time: ${startTime} to ${endTime} ${timeZone}\n\nPlease use this secure link to complete your contact details: ${this.getSecureLink(bookingCode)}\n\nYour booking code is ${bookingCode}. Please save it for future reference.`;
  }

  private formatSlotOffer(slots: Slot[], timeZone: string): string {
    if (slots.length === 0) {
      return "I'm sorry, but there are no available slots matching your preference.";
    }

    let response = "Here are the available slots:\n\n";
    slots.forEach((slot, index) => {
      const startTime = this.formatDateTime(slot.startTime, timeZone);
      const endTime = this.formatDateTime(slot.endTime, timeZone);
      response += `${index + 1}. ${startTime} to ${endTime} ${timeZone}\n`;
    });
    response += "\nPlease choose one by saying the slot number or the date and time.";
    return response;
  }

  private formatSlotList(slots: Slot[], timeZone: string): string {
    return slots.map((slot, index) => {
      const startTime = this.formatDateTime(slot.startTime, timeZone);
      const endTime = this.formatDateTime(slot.endTime, timeZone);
      return `${index + 1}. ${startTime} to ${endTime} ${timeZone}`;
    }).join('\n');
  }

  private formatDateTime(date: Date, timeZone: string): string {
    // Format as: "Monday, January 6, 2026 at 10:30 AM"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata', // IST
    };
    return new Date(date).toLocaleString('en-IN', options);
  }

  private formatDate(date: Date): string {
    // Format as: "January 7, 2026"
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(date).toLocaleDateString('en-IN', options);
  }

  private getSecureLink(bookingCode: string): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    return `${baseUrl}/complete/${bookingCode}`;
  }

  private extractTopic(input: string): Topic | null {
    if (!input || typeof input !== 'string') {
      this.logger.warn(`[TOPIC EXTRACTION] Invalid input: ${typeof input} - ${input}`);
      return null;
    }

    const originalInput = input;
    const lower = input.toLowerCase().trim();
    
    this.logger.debug(`[TOPIC EXTRACTION] Original input: "${originalInput}"`);
    this.logger.debug(`[TOPIC EXTRACTION] Lowercased: "${lower}"`);
    
    // Remove common filler words and punctuation
    const cleaned = lower.replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
    this.logger.debug(`[TOPIC EXTRACTION] Cleaned: "${cleaned}"`);
    
    // More flexible matching for KYC/Onboarding
    // Check for exact matches first, then partial matches
    const kycPatterns = [
      'kyc', 'onboarding', 'on board', 'on-board', 'keyc', 'k y c',
      'kay see', 'kay c', 'k y c', 'key see', 'on board', 'onboard'
    ];
    
    for (const pattern of kycPatterns) {
      if (cleaned === pattern || cleaned.includes(pattern)) {
        this.logger.log(`[TOPIC EXTRACTION] Matched KYC pattern: "${pattern}" in "${cleaned}"`);
        return Topic.KYC_ONBOARDING;
      }
    }
    
    // SIP/Mandates
    if (cleaned === 'sip' || 
        cleaned === 'mandate' ||
        cleaned === 'mandates' ||
        cleaned.includes('sip') || 
        cleaned.includes('mandate')) {
      this.logger.log(`[TOPIC EXTRACTION] Matched SIP pattern in "${cleaned}"`);
      return Topic.SIP_MANDATES;
    }
    
    // Statements/Tax Docs
    if (cleaned.includes('statement') || 
        cleaned.includes('tax') || 
        cleaned.includes('doc') ||
        cleaned.includes('document')) {
      this.logger.log(`[TOPIC EXTRACTION] Matched Statements pattern in "${cleaned}"`);
      return Topic.STATEMENTS_TAX_DOCS;
    }
    
    // Withdrawals & Timelines
    if (cleaned.includes('withdrawal') || 
        cleaned.includes('timeline') ||
        cleaned.includes('withdraw')) {
      this.logger.log(`[TOPIC EXTRACTION] Matched Withdrawals pattern in "${cleaned}"`);
      return Topic.WITHDRAWALS_TIMELINES;
    }
    
    // Account Changes/Nominee
    if (cleaned.includes('account') || 
        cleaned.includes('change') || 
        cleaned.includes('nominee') ||
        cleaned.includes('update')) {
      this.logger.log(`[TOPIC EXTRACTION] Matched Account Changes pattern in "${cleaned}"`);
      return Topic.ACCOUNT_CHANGES_NOMINEE;
    }
    
    // Check for number selection (1-5) - handle both words and digits
    // Handle various number formats: "one", "1", "first", "number one", etc.
    const numberPatterns = {
      '1': ['1', 'one', 'won', 'wun', 'first', 'number one', 'number 1', 'option one', 'option 1'],
      '2': ['2', 'two', 'to', 'too', 'second', 'number two', 'number 2', 'option two', 'option 2'],
      '3': ['3', 'three', 'tree', 'third', 'number three', 'number 3', 'option three', 'option 3'],
      '4': ['4', 'four', 'for', 'fore', 'fourth', 'number four', 'number 4', 'option four', 'option 4'],
      '5': ['5', 'five', 'fifth', 'number five', 'number 5', 'option five', 'option 5'],
    };

    for (const [num, patterns] of Object.entries(numberPatterns)) {
      for (const pattern of patterns) {
        // Check exact match or if cleaned contains the pattern
        if (cleaned === pattern || cleaned.includes(pattern)) {
          this.logger.log(`[TOPIC EXTRACTION] Matched number ${num} from pattern: "${pattern}" in input: "${cleaned}"`);
          switch (num) {
            case '1': return Topic.KYC_ONBOARDING;
            case '2': return Topic.SIP_MANDATES;
            case '3': return Topic.STATEMENTS_TAX_DOCS;
            case '4': return Topic.WITHDRAWALS_TIMELINES;
            case '5': return Topic.ACCOUNT_CHANGES_NOMINEE;
          }
        }
      }
    }
    
    this.logger.warn(`[TOPIC EXTRACTION] No match found for: "${originalInput}" (cleaned: "${cleaned}")`);
    return null;
  }

  /**
   * Extract topic using OpenAI LLM (fallback when keyword matching fails)
   */
  private async extractTopicWithLLM(input: string): Promise<Topic | null> {
    if (!this.openai) {
      this.logger.warn('[TOPIC EXTRACTION] OpenAI not available for LLM extraction');
      return null;
    }

    try {
      this.logger.debug(`[TOPIC EXTRACTION] Attempting LLM extraction for: "${input}"`);
      
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: `You are a topic classifier. Extract the topic from the user's input.

Available topics:
1. KYC_ONBOARDING - for "KYC", "Onboarding", "KYC onboarding", "on board", "key see", "kay see", etc.
2. SIP_MANDATES - for "SIP", "Mandates", "SIP mandates", etc.
3. STATEMENTS_TAX_DOCS - for "Statements", "Tax", "Documents", "Tax docs", etc.
4. WITHDRAWALS_TIMELINES - for "Withdrawals", "Timelines", "Withdraw", etc.
5. ACCOUNT_CHANGES_NOMINEE - for "Account", "Changes", "Nominee", "Account update", etc.

The user might say things like "KYC", "onboarding", "KYC onboarding", "key see onboarding", etc.
Be very flexible and match to the closest topic.

Respond with ONLY the topic name (e.g., "KYC_ONBOARDING") or "null" if unclear.`,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        temperature: 0.1,
        max_tokens: 20,
      });

      const topicStr = response.choices[0]?.message?.content?.trim().toUpperCase();
      this.logger.debug(`[TOPIC EXTRACTION] LLM response: "${topicStr}"`);
      
      if (!topicStr || topicStr === 'NULL' || topicStr.includes('NULL')) {
        this.logger.warn(`[TOPIC EXTRACTION] LLM returned null for: "${input}"`);
        return null;
      }

      // Map string to Topic enum
      const topicMap: { [key: string]: Topic } = {
        'KYC_ONBOARDING': Topic.KYC_ONBOARDING,
        'SIP_MANDATES': Topic.SIP_MANDATES,
        'STATEMENTS_TAX_DOCS': Topic.STATEMENTS_TAX_DOCS,
        'WITHDRAWALS_TIMELINES': Topic.WITHDRAWALS_TIMELINES,
        'ACCOUNT_CHANGES_NOMINEE': Topic.ACCOUNT_CHANGES_NOMINEE,
      };

      const topic = topicMap[topicStr] || null;
      if (topic) {
        this.logger.log(`[TOPIC EXTRACTION] LLM successfully extracted: ${topic} from "${input}"`);
      } else {
        this.logger.warn(`[TOPIC EXTRACTION] LLM returned unknown topic: "${topicStr}" for input: "${input}"`);
      }
      
      return topic;
    } catch (error) {
      this.logger.error(`[TOPIC EXTRACTION] LLM extraction failed: ${error.message}`, error.stack);
      return null;
    }
  }

  private extractTimePreference(input: string): TimePreference | null {
    const lower = input.toLowerCase();
    const timePreference: TimePreference = {};

    // First, try to extract a specific date (e.g., "8th January 2026", "7 January 2026")
    const parsedDate = this.parseDateFromInput(input);
    if (parsedDate) {
      timePreference.specificDate = parsedDate;
      this.logger.debug(`Extracted specific date: ${parsedDate.toISOString()}`);
    }

    // Extract day of week (only if no specific date was found)
    if (!parsedDate) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        if (lower.includes(day)) {
          timePreference.day = day.charAt(0).toUpperCase() + day.slice(1);
          break;
        }
      }
    }

    // Extract time of day
    if (lower.includes('morning')) timePreference.timeOfDay = 'morning';
    else if (lower.includes('afternoon')) timePreference.timeOfDay = 'afternoon';
    else if (lower.includes('evening')) timePreference.timeOfDay = 'evening';

    // If we have at least one piece of information, return it
    if (timePreference.specificDate || timePreference.day || timePreference.timeOfDay) {
      return timePreference;
    }

    return null;
  }

  private extractSlotSelection(input: string, slots: Slot[]): Slot | null {
    const lower = input.toLowerCase();
    
    // Check for slot number
    if (lower.includes('first') || lower.includes('1') || lower.includes('one')) {
      return slots[0] || null;
    }
    if (lower.includes('second') || lower.includes('2') || lower.includes('two')) {
      return slots[1] || null;
    }

    // Try to parse date from input (handles formats like "7 January 2026", "January 7, 2026", etc.)
    const parsedDate = this.parseDateFromInput(input);
    
    if (parsedDate) {
      // Match against offered slots by date
      for (const slot of slots) {
        const slotDate = new Date(slot.startTime);
        // Compare dates (ignore time)
        if (
          slotDate.getFullYear() === parsedDate.getFullYear() &&
          slotDate.getMonth() === parsedDate.getMonth() &&
          slotDate.getDate() === parsedDate.getDate()
        ) {
          return slot;
        }
      }
    }

    // Try to match by ISO date string (YYYY-MM-DD)
    for (const slot of slots) {
      const slotDateStr = slot.startTime.toISOString().split('T')[0];
      if (input.includes(slotDateStr)) {
        return slot;
      }
    }

    return null;
  }

  /**
   * Parse date from natural language input
   * Handles formats like:
   * - "7 January 2026"
   * - "January 7, 2026"
   * - "7/1/2026" or "7-1-2026"
   * - "on 7th January"
   */
  private parseDateFromInput(input: string): Date | null {
    const lower = input.toLowerCase();
    
    // Month names
    const months: { [key: string]: number } = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
      jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    // Pattern 1: "7 January 2026" or "7th January 2026" or "on 7 January 2026"
    const pattern1 = /(\d+)(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i;
    const match1 = input.match(pattern1);
    if (match1) {
      const day = parseInt(match1[1]);
      const month = months[match1[2].toLowerCase()];
      const year = parseInt(match1[3]);
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }

    // Pattern 2: "January 7, 2026" or "January 7th, 2026"
    const pattern2 = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d+)(?:st|nd|rd|th)?,?\s+(\d{4})/i;
    const match2 = input.match(pattern2);
    if (match2) {
      const month = months[match2[1].toLowerCase()];
      const day = parseInt(match2[2]);
      const year = parseInt(match2[3]);
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }

    // Pattern 3: "7/1/2026" or "7-1-2026" (DD/MM/YYYY or MM/DD/YYYY - try both)
    const pattern3 = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const match3 = input.match(pattern3);
    if (match3) {
      const part1 = parseInt(match3[1]);
      const part2 = parseInt(match3[2]);
      const year = parseInt(match3[3]);
      
      // Try DD/MM/YYYY first (more common in international format)
      if (part1 <= 31 && part2 <= 12) {
        return new Date(year, part2 - 1, part1);
      }
      // Try MM/DD/YYYY
      if (part2 <= 31 && part1 <= 12) {
        return new Date(year, part1 - 1, part2);
      }
    }

    // Pattern 4: "on 7th January" (without year - assume current or next year)
    const pattern4 = /(\d+)(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
    const match4 = input.match(pattern4);
    if (match4) {
      const day = parseInt(match4[1]);
      const month = months[match4[2].toLowerCase()];
      if (month !== undefined) {
        const now = new Date();
        const year = now.getFullYear();
        const date = new Date(year, month, day);
        // If the date is in the past, assume next year
        if (date < now) {
          return new Date(year + 1, month, day);
        }
        return date;
      }
    }

    return null;
  }

  private isConfirmation(input: string): boolean {
    const lower = input.toLowerCase().trim();
    return /^(yes|y|confirm|ok|okay|sure|proceed|book it)$/i.test(lower);
  }

  private isCancellation(input: string): boolean {
    const lower = input.toLowerCase().trim();
    return /^(no|n|cancel|don't|dont|not|stop|nevermind|never mind)$/i.test(lower);
  }

  private async addMessage(session: ConversationSession, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    session.messages.push({
      role,
      content,
      timestamp: new Date(),
    });
    session.updatedAt = new Date();
  }
}

