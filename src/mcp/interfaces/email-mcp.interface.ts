import { Slot } from '../../domain/models/slot.model';
import { Topic } from '../../domain/models/topic.enum';

/**
 * Contact details for email
 */
export interface EmailContactDetails {
    fullName: string;
    email: string;
    phone: string;
    additionalNotes?: string;
}

/**
 * Result of creating an email draft
 */
export interface EmailDraftResult {
    draftId: string;
    messageId?: string;
    subject: string;
    requiresApproval: boolean;
}

/**
 * Interface for Email MCP service
 * Handles creating email drafts for advisor notifications
 */
export interface IEmailMcp {
    /**
     * Creates an email draft for the advisor with booking details
     * The draft requires human approval before sending (approval-gated)
     * @param topic The appointment topic
     * @param bookingCode The booking code
     * @param slot The confirmed time slot
     * @param contactDetails Contact information of the caller
     * @returns Email draft result
     */
    createAdvisorEmailDraft(
        topic: Topic,
        bookingCode: string,
        slot: Slot,
        contactDetails: EmailContactDetails,
    ): Promise<EmailDraftResult>;

    /**
     * Updates an existing email draft with new time slot
     * @param bookingCode The booking code to find the draft
     * @param topic The appointment topic
     * @param newSlot The new time slot
     * @param contactDetails Contact information
     * @returns Updated email draft result
     */
    updateEmailDraft(
        bookingCode: string,
        topic: Topic,
        newSlot: Slot,
        contactDetails: EmailContactDetails,
    ): Promise<EmailDraftResult>;

    /**
     * Updates an email draft to cancellation notification
     * Instead of deleting, updates the draft with cancellation information
     * The advisor can review and send the cancellation email
     * @param bookingCode The booking code to find the draft
     * @param topic The appointment topic
     * @param slot The original time slot
     * @returns Updated email draft result
     */
    createCancellationDraft(
        bookingCode: string,
        topic: Topic,
        slot: Slot,
    ): Promise<EmailDraftResult>;
}

