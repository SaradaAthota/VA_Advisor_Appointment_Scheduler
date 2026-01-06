import { Slot } from '../../domain/models/slot.model';
import { Topic } from '../../domain/models/topic.enum';

/**
 * Result of appending to notes document
 */
export interface NotesAppendResult {
    documentId: string;
    documentUrl?: string;
    appendedAt: Date;
}

/**
 * Interface for Notes MCP service
 * Handles appending booking information to notes/document
 */
export interface INotesMcp {
    /**
     * Appends booking information to the "Advisor Pre-Bookings" document
     * @param date The booking date
     * @param topic The appointment topic
     * @param slot The time slot
     * @param bookingCode The booking code
     * @returns Notes append result
     */
    appendBookingEntry(
        date: Date,
        topic: Topic,
        slot: Slot,
        bookingCode: string,
    ): Promise<NotesAppendResult>;

    /**
     * Updates an existing booking entry in the spreadsheet
     * @param bookingCode The booking code to find the entry
     * @param newSlot The new time slot
     * @returns Updated notes result
     */
    updateBookingEntry(
        bookingCode: string,
        newSlot: Slot,
    ): Promise<NotesAppendResult>;

    /**
     * Marks a booking entry as cancelled in the spreadsheet
     * @param bookingCode The booking code to find the entry
     * @returns Updated notes result
     */
    cancelBookingEntry(
        bookingCode: string,
    ): Promise<NotesAppendResult>;
}

