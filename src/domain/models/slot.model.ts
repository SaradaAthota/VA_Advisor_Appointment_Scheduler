export interface Slot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

export interface TimePreference {
  day?: string; // e.g., "Monday", "Tuesday", or specific date
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  specificDate?: Date;
}

