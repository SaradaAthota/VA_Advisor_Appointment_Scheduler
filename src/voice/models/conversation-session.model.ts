import { ConversationState } from './conversation-state.enum';
import { Intent } from './intent.enum';
import { Topic } from '../../domain/models/topic.enum';
import { TimePreference } from '../../domain/models/slot.model';
import { Slot } from '../../domain/models/slot.model';

/**
 * Conversation Session Model
 * Tracks the state and context of an ongoing conversation
 */
export interface ConversationSession {
  sessionId: string;
  state: ConversationState;
  currentIntent?: Intent;
  
  // Collected data
  topic?: Topic;
  timePreference?: TimePreference;
  offeredSlots?: Slot[];
  selectedSlot?: Slot;
  bookingCode?: string;
  
  // Conversation history
  messages: ConversationMessage[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  timeZone: string; // Default: IST
}

/**
 * Conversation Message
 * Represents a single message in the conversation
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: Intent;
    state?: ConversationState;
    bookingCode?: string;
    [key: string]: any;
  };
}

