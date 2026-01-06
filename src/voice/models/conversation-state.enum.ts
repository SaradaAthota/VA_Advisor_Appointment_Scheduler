/**
 * Conversation State Enum
 * Tracks the current step in the voice agent conversation flow
 */
export enum ConversationState {
  // Initial states
  GREETING = 'greeting',
  DISCLAIMER = 'disclaimer',
  
  // Booking flow states
  COLLECTING_TOPIC = 'collecting_topic',
  COLLECTING_TIME_PREFERENCE = 'collecting_time_preference',
  OFFERING_SLOTS = 'offering_slots',
  CONFIRMING_BOOKING = 'confirming_booking',
  BOOKING_CONFIRMED = 'booking_confirmed',
  
  // Other intent states
  RESCHEDULING = 'rescheduling',
  CANCELLING = 'cancelling',
  CHECKING_AVAILABILITY = 'checking_availability',
  PROVIDING_PREPARATION_INFO = 'providing_preparation_info',
  
  // Terminal states
  COMPLETED = 'completed',
  ERROR = 'error',
}

