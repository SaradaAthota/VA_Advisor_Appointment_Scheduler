/**
 * Intent Enum
 * Represents the 5 main intents the voice agent can recognize
 */
export enum Intent {
  BOOK_NEW = 'book_new',
  RESCHEDULE = 'reschedule',
  CANCEL = 'cancel',
  CHECK_AVAILABILITY = 'check_availability',
  WHAT_TO_PREPARE = 'what_to_prepare',
  
  // Helper intents
  GREETING = 'greeting',
  UNKNOWN = 'unknown',
}

