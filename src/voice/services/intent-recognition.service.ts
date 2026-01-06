import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Intent } from '../models/intent.enum';

/**
 * Intent Recognition Service
 * Uses OpenAI to recognize user intent from text input
 */
@Injectable()
export class IntentRecognitionService {
  private readonly logger = new Logger(IntentRecognitionService.name);
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized for intent recognition');
    } else {
      this.logger.warn('OPENAI_API_KEY not found - intent recognition will use fallback logic');
    }
  }

  /**
   * Recognize intent from user input
   * Returns intent and confidence score
   */
  async recognizeIntent(userInput: string, context?: { state?: string }): Promise<{
    intent: Intent;
    confidence: number;
  }> {
    // If OpenAI is not configured, use keyword-based fallback
    if (!this.openai) {
      return this.fallbackIntentRecognition(userInput, context);
    }

    try {
      const stateContext = context?.state ? `\n\nCurrent conversation state: ${context.state}` : '';
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier for a voice agent that books advisor appointments.

Available intents:
1. book_new - User wants to book a new appointment (e.g., "book appointment", "schedule", "I want to book")
2. reschedule - User wants to reschedule an existing appointment
3. cancel - User wants to cancel an appointment
4. check_availability - User wants to check available time slots (e.g., "Monday morning", "when available", "what times")
5. what_to_prepare - User is asking what to prepare for the appointment
6. greeting - User is greeting or starting a conversation (e.g., "hello", "hi", "good morning")
7. unknown - Cannot determine intent (use for slot selections like "slot 1", "first", "10am", or confirmations like "yes", "confirm")

IMPORTANT:
- If user is selecting a slot (e.g., "slot 1", "first slot", "10am", "Wednesday 7th"), return "unknown"
- If user is confirming (e.g., "yes", "confirm", "ok"), return "unknown" 
- If user mentions a day/time preference (e.g., "Monday morning", "Wednesday afternoon"), return "check_availability"
- Single words like "yes", "one", "morning" should be classified based on context${stateContext}

Respond with ONLY a JSON object: {"intent": "intent_name", "confidence": 0.0-1.0}`,
          },
          {
            role: 'user',
            content: userInput,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      const intent = this.parseIntent(result.intent);
      const confidence = Math.min(Math.max(parseFloat(result.confidence) || 0.5, 0), 1);

      this.logger.debug(`Recognized intent: ${intent} (confidence: ${confidence})`);

      return { intent, confidence };
    } catch (error) {
      this.logger.error(`Intent recognition failed: ${error.message}`, error.stack);
      // Fallback to keyword-based recognition
      return this.fallbackIntentRecognition(userInput, context);
    }
  }

  /**
   * Fallback intent recognition using keyword matching
   */
  private fallbackIntentRecognition(userInput: string, context?: { state?: string }): {
    intent: Intent;
    confidence: number;
  } {
    const lowerInput = userInput.toLowerCase().trim();
    const state = context?.state?.toLowerCase() || '';

    // Slot selection patterns (should return unknown so slot extraction can handle it)
    if (state.includes('offering_slots') || state.includes('offering')) {
      if (/(slot\s*(no|number|#)?\s*[12]|first|second|one|two|1|2|^\d+$)/i.test(lowerInput)) {
        return { intent: Intent.UNKNOWN, confidence: 0.9 }; // Let slot extraction handle it
      }
      // Time patterns like "10am", "9:30", "morning", etc. when selecting slots
      if (/(\d+\s*(am|pm|:)|morning|afternoon|evening)/i.test(lowerInput)) {
        return { intent: Intent.UNKNOWN, confidence: 0.8 }; // Let slot extraction handle it
      }
    }

    // Confirmation patterns (should return unknown so confirmation logic can handle it)
    if (state.includes('confirming')) {
      if (/^(yes|y|confirm|ok|okay|sure|proceed|book it)$/i.test(lowerInput)) {
        return { intent: Intent.UNKNOWN, confidence: 0.9 }; // Let confirmation logic handle it
      }
      if (/^(no|n|cancel|don't|dont|not)$/i.test(lowerInput)) {
        return { intent: Intent.UNKNOWN, confidence: 0.9 }; // Let cancellation logic handle it
      }
    }

    // Greeting patterns (but not if it's a single word that could be slot/confirmation)
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)$/i.test(lowerInput) && lowerInput.length > 2) {
      return { intent: Intent.GREETING, confidence: 0.9 };
    }

    // Book new patterns
    if (/(book|schedule|appointment|meeting|new booking|want to book)/i.test(lowerInput)) {
      return { intent: Intent.BOOK_NEW, confidence: 0.85 };
    }

    // Reschedule patterns
    if (/(reschedule|change time|change date|move|postpone|shift)/i.test(lowerInput)) {
      return { intent: Intent.RESCHEDULE, confidence: 0.85 };
    }

    // Cancel patterns
    if (/(cancel|delete|remove|don't need|not needed)/i.test(lowerInput)) {
      return { intent: Intent.CANCEL, confidence: 0.85 };
    }

    // Check availability patterns (day + time preference)
    if (/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(morning|afternoon|evening)/i.test(lowerInput) ||
      /(morning|afternoon|evening)\s+(on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(lowerInput) ||
      /(available|availability|when|what time|slots|free)/i.test(lowerInput)) {
      return { intent: Intent.CHECK_AVAILABILITY, confidence: 0.8 };
    }

    // Time preference alone (morning, afternoon, evening) - check availability
    if (/^(morning|afternoon|evening)$/i.test(lowerInput) && state.includes('collecting_time')) {
      return { intent: Intent.CHECK_AVAILABILITY, confidence: 0.8 };
    }

    // What to prepare patterns
    if (/(prepare|bring|documents|what do i need|required|checklist)/i.test(lowerInput)) {
      return { intent: Intent.WHAT_TO_PREPARE, confidence: 0.85 };
    }

    // Default to unknown
    return { intent: Intent.UNKNOWN, confidence: 0.3 };
  }

  /**
   * Parse intent string to Intent enum
   */
  private parseIntent(intentString: string): Intent {
    const normalized = intentString.toLowerCase().replace(/[^a-z_]/g, '');

    switch (normalized) {
      case 'book_new':
      case 'booknew':
        return Intent.BOOK_NEW;
      case 'reschedule':
        return Intent.RESCHEDULE;
      case 'cancel':
        return Intent.CANCEL;
      case 'check_availability':
      case 'checkavailability':
        return Intent.CHECK_AVAILABILITY;
      case 'what_to_prepare':
      case 'whattoprepare':
        return Intent.WHAT_TO_PREPARE;
      case 'greeting':
        return Intent.GREETING;
      default:
        return Intent.UNKNOWN;
    }
  }
}

