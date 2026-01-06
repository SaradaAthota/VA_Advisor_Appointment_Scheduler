export enum Topic {
  KYC_ONBOARDING = 'KYC/Onboarding',
  SIP_MANDATES = 'SIP/Mandates',
  STATEMENTS_TAX_DOCS = 'Statements/Tax Docs',
  WITHDRAWALS_TIMELINES = 'Withdrawals & Timelines',
  ACCOUNT_CHANGES_NOMINEE = 'Account Changes/Nominee',
}

export enum BookingStatus {
  TENTATIVE = 'TENTATIVE',
  CONFIRMED = 'CONFIRMED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED',
}

export interface Slot {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string;
  topic: Topic;
  preferredSlot: Slot;
  alternativeSlot?: Slot;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  secureLink?: string;
  timeZone: string;
}

export interface ContactDetails {
  fullName: string;
  email: string;
  phone: string;
  additionalNotes?: string;
}

export interface BookingCompletionData {
  bookingCode: string;
  contactDetails: ContactDetails;
}

