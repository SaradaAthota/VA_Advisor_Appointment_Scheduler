import { Slot } from '../../domain/models/slot.model';
import { Topic } from '../../domain/models/topic.enum';

/**
 * Result of creating a calendar event
 */
export interface CalendarEventResult {
    eventId: string;
    calendarId: string;
    htmlLink?: string;
    startTime: Date;
    endTime: Date;
}

/**
 * Interface for Calendar MCP service
 * Handles creating calendar holds/events
 */
export interface ICalendarMcp {
    /**
     * Creates a tentative calendar hold for an advisor appointment
     * @param topic The appointment topic
     * @param bookingCode The booking code (e.g., "NL-A742")
     * @param slot The time slot for the appointment
     * @returns Calendar event details
     */
    createTentativeHold(
        topic: Topic,
        bookingCode: string,
        slot: Slot,
    ): Promise<CalendarEventResult>;

    /**
     * Updates an existing calendar event with new time slot
     * @param bookingCode The booking code to find the event
     * @param newSlot The new time slot
     * @returns Updated calendar event details
     */
    updateEvent(
        bookingCode: string,
        newSlot: Slot,
    ): Promise<CalendarEventResult>;

    /**
     * Deletes an existing calendar event
     * @param bookingCode The booking code to find the event
     * @returns Success status
     */
    deleteEvent(
        bookingCode: string,
    ): Promise<{ success: boolean; message: string }>;
}

