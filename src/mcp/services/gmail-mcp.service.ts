import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import {
  IEmailMcp,
  EmailDraftResult,
  EmailContactDetails,
} from '../interfaces/email-mcp.interface';
import { Slot } from '../../domain/models/slot.model';
import { Topic } from '../../domain/models/topic.enum';
import { GoogleOAuthService } from './google-oauth.service';

/**
 * Gmail MCP Service
 * Creates email drafts for advisor notifications (approval-gated)
 */
@Injectable()
export class GmailMcpService implements IEmailMcp {
  private readonly logger = new Logger(GmailMcpService.name);
  private gmail: any;
  private advisorEmail: string;
  private useRealApi: boolean;

  constructor(private readonly oauthService: GoogleOAuthService) {
    this.initializeGmail();
  }

  private initializeGmail() {
    this.advisorEmail = process.env.ADVISOR_EMAIL || 'advisor@example.com';
    this.useRealApi = this.oauthService.isConfigured();

    if (this.useRealApi) {
      const auth = this.oauthService.getOAuth2Client();
      this.gmail = google.gmail({ version: 'v1', auth });
      this.logger.log('Gmail MCP Service initialized with real API');
    } else {
      this.logger.log('Gmail MCP Service initialized in mock mode');
    }
  }

  async createAdvisorEmailDraft(
    topic: Topic,
    bookingCode: string,
    slot: Slot,
    contactDetails: EmailContactDetails,
  ): Promise<EmailDraftResult> {
    this.logger.log(
      `Creating advisor email draft: ${topic} - ${bookingCode} for ${contactDetails.fullName}`,
    );

    try {
      const emailContent = this.generateEmailContent(
        topic,
        bookingCode,
        slot,
        contactDetails,
      );

      // In Phase 4, we'll create a mock implementation
      // In Phase 5, this will make actual API calls to Gmail API
      const draft = await this.createDraft(emailContent);

      this.logger.log(`Email draft created: ${draft.draftId}`);

      return {
        draftId: draft.draftId,
        messageId: draft.messageId,
        subject: emailContent.subject,
        requiresApproval: true, // All drafts require human approval
      };
    } catch (error) {
      this.logger.error(`Failed to create email draft: ${error.message}`, error.stack);
      throw new Error(`Failed to create email draft: ${error.message}`);
    }
  }

  /**
   * Generates email content for the advisor
   */
  private generateEmailContent(
    topic: Topic,
    bookingCode: string,
    slot: Slot,
    contactDetails: EmailContactDetails,
  ): { subject: string; body: string } {
    // Dates are in UTC but represent IST time
    // Use UTC components directly since they represent IST time values
    const dateStr = new Date(Date.UTC(
      slot.startTime.getUTCFullYear(),
      slot.startTime.getUTCMonth(),
      slot.startTime.getUTCDate()
    )).toLocaleDateString('en-IN', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const hours = slot.startTime.getUTCHours();
    const minutes = slot.startTime.getUTCMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const subject = `New Advisor Appointment: ${topic} - ${bookingCode}`;

    const body = `Dear Advisor,

A new appointment has been booked:

Booking Code: ${bookingCode}
Topic: ${topic}
Date: ${dateStr}
Time: ${timeStr} (IST)
Duration: 30 minutes

Contact Details:
- Name: ${contactDetails.fullName}
- Email: ${contactDetails.email}
- Phone: ${contactDetails.phone}
${contactDetails.additionalNotes ? `- Notes: ${contactDetails.additionalNotes}` : ''}

This is a tentative hold. Please review and confirm.

Best regards,
Advisor Appointment System`;

    return { subject, body };
  }

  /**
   * Creates a Gmail draft
   * Uses real Gmail API if credentials are configured, otherwise uses mock
   */
  private async createDraft(content: {
    subject: string;
    body: string;
  }): Promise<{ draftId: string; messageId?: string }> {
    if (this.useRealApi && this.gmail) {
      try {
        // Create email message in RFC 2822 format
        const message = [
          `To: ${this.advisorEmail}`,
          `Subject: ${content.subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          '',
          content.body,
        ].join('\n');

        // Encode message in base64url format (Gmail API requirement)
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        // Create draft
        const draft = await this.gmail.users.drafts.create({
          userId: 'me',
          requestBody: {
            message: {
              raw: encodedMessage,
            },
          },
        });

        const draftId = draft.data.id || '';
        const messageId = draft.data.message?.id || '';

        this.logger.debug(`Real Gmail draft created: ${draftId}`);

        return {
          draftId,
          messageId,
        };
      } catch (error) {
        this.logger.error(
          `Failed to create real Gmail draft: ${error.message}`,
          error.stack,
        );
        // Fall back to mock if real API fails
        this.logger.warn('Falling back to mock Gmail draft');
        return this.createMockDraft();
      }
    } else {
      // Mock implementation
      return this.createMockDraft();
    }
  }

  /**
   * Creates a mock Gmail draft (fallback)
   */
  private createMockDraft(): { draftId: string; messageId?: string } {
    const draftId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.logger.debug(`Mock Gmail draft created: ${draftId}`);

    return {
      draftId,
      messageId,
    };
  }

  /**
   * Updates an existing email draft with new time slot
   * Finds the draft by booking code in the subject
   */
  async updateEmailDraft(
    bookingCode: string,
    topic: Topic,
    newSlot: Slot,
    contactDetails: EmailContactDetails,
  ): Promise<EmailDraftResult> {
    this.logger.log(
      `Updating email draft for booking: ${bookingCode} to ${newSlot.startTime}`,
    );

    try {
      if (this.useRealApi && this.gmail) {
        // Find draft by searching for booking code in subject
        // Try multiple search patterns to find the draft
        let drafts = await this.gmail.users.drafts.list({
          userId: 'me',
          q: `subject:${bookingCode}`,
        });

        // If not found, try searching with "NL-" prefix
        if (!drafts.data.drafts || drafts.data.drafts.length === 0) {
          drafts = await this.gmail.users.drafts.list({
            userId: 'me',
            q: `subject:"${bookingCode}"`,
          });
        }

        // If still not found, try searching in all drafts
        if (!drafts.data.drafts || drafts.data.drafts.length === 0) {
          this.logger.debug(`Searching all drafts for booking code: ${bookingCode}`);
          const allDrafts = await this.gmail.users.drafts.list({
            userId: 'me',
            maxResults: 50,
          });
          
          // Filter drafts that contain the booking code in subject
          if (allDrafts.data.drafts) {
            const matchingDrafts = [];
            for (const draft of allDrafts.data.drafts) {
              try {
                const draftDetail = await this.gmail.users.drafts.get({
                  userId: 'me',
                  id: draft.id!,
                  format: 'metadata',
                  metadataHeaders: ['Subject'],
                });
                const subject = draftDetail.data.message?.payload?.headers?.find(
                  (h: any) => h.name === 'Subject'
                )?.value || '';
                if (subject.includes(bookingCode)) {
                  matchingDrafts.push(draft);
                }
              } catch (err) {
                // Skip if we can't read this draft
                continue;
              }
            }
            if (matchingDrafts.length > 0) {
              drafts.data.drafts = matchingDrafts;
            }
          }
        }

        if (!drafts.data.drafts || drafts.data.drafts.length === 0) {
          this.logger.warn(`No email draft found for booking ${bookingCode}, creating new one`);
          // Create new draft if not found
          return await this.createAdvisorEmailDraft(topic, bookingCode, newSlot, contactDetails);
        }

        // Get the first matching draft
        const draftId = drafts.data.drafts[0].id!;
        this.logger.debug(`Found draft ID: ${draftId} for booking ${bookingCode}`);
        
        const existingDraft = await this.gmail.users.drafts.get({
          userId: 'me',
          id: draftId,
          format: 'full',
        });

        this.logger.debug(`Retrieved existing draft. ThreadId: ${existingDraft.data.message?.threadId || 'none'}`);

        // Generate new email content with updated time
        const emailContent = this.generateEmailContent(topic, bookingCode, newSlot, contactDetails);
        this.logger.debug(`Generated new email content. Subject: ${emailContent.subject}`);
        this.logger.debug(`New slot time: ${newSlot.startTime.toISOString()}`);

        // Create updated message (same format as createDraft)
        const message = [
          `To: ${this.advisorEmail}`,
          `Subject: ${emailContent.subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          '',
          emailContent.body,
        ].join('\n');

        // Encode message properly for Gmail API
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        this.logger.debug(`Encoded message length: ${encodedMessage.length} characters`);

        // Update the draft with new content
        // Preserve threadId if it exists (for email threading)
        const threadId = existingDraft.data.message?.threadId;

        this.logger.debug(`Updating draft ${draftId} with threadId: ${threadId || 'none'}`);

        try {
          const updatedDraft = await this.gmail.users.drafts.update({
            userId: 'me',
            id: draftId,
            requestBody: {
              id: draftId,
              message: {
                threadId: threadId,
                raw: encodedMessage,
              },
            },
          });

          this.logger.log(`Email draft updated successfully: ${updatedDraft.data.id} for booking ${bookingCode}`);
          this.logger.debug(`Updated draft message ID: ${updatedDraft.data.message?.id || 'none'}`);
          
          return {
            draftId: updatedDraft.data.id || '',
            messageId: updatedDraft.data.message?.id || '',
            subject: emailContent.subject,
            requiresApproval: true,
          };
        } catch (updateError: any) {
          this.logger.error(`Gmail API update failed: ${updateError.message}`, updateError.stack);
          this.logger.error(`Draft ID: ${draftId}, ThreadId: ${threadId || 'none'}`);
          if (updateError.response?.data) {
            this.logger.error(`Gmail API error response: ${JSON.stringify(updateError.response.data, null, 2)}`);
          }
          throw updateError;
        }
      } else {
        // Mock implementation
        this.logger.debug('Mock email draft update');
        return {
          draftId: `draft-${Date.now()}`,
          subject: `New Advisor Appointment: ${topic} - ${bookingCode}`,
          requiresApproval: true,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to update email draft: ${error.message}`, error.stack);
      throw new Error(`Failed to update email draft: ${error.message}`);
    }
  }

  /**
   * Creates/updates an email draft with cancellation notification
   * Instead of deleting, updates the draft so advisor can review and send cancellation email
   * This ensures the advisor is notified of the cancellation
   */
  async createCancellationDraft(
    bookingCode: string,
    topic: Topic,
    slot: Slot,
  ): Promise<EmailDraftResult> {
    this.logger.log(
      `Creating cancellation email draft for booking: ${bookingCode}`,
    );

    try {
      const emailContent = this.generateCancellationEmailContent(
        topic,
        bookingCode,
        slot,
      );

      if (this.useRealApi && this.gmail) {
        // First, try to find existing draft
        let drafts = await this.gmail.users.drafts.list({
          userId: 'me',
          q: `subject:${bookingCode}`,
        });

        // If not found, try searching with quotes
        if (!drafts.data.drafts || drafts.data.drafts.length === 0) {
          drafts = await this.gmail.users.drafts.list({
            userId: 'me',
            q: `subject:"${bookingCode}"`,
          });
        }

        // If still not found, search all drafts
        if (!drafts.data.drafts || drafts.data.drafts.length === 0) {
          this.logger.debug(`Searching all drafts for booking code: ${bookingCode}`);
          const allDrafts = await this.gmail.users.drafts.list({
            userId: 'me',
            maxResults: 50,
          });
          
          if (allDrafts.data.drafts) {
            const matchingDrafts = [];
            for (const draft of allDrafts.data.drafts) {
              try {
                const draftDetail = await this.gmail.users.drafts.get({
                  userId: 'me',
                  id: draft.id!,
                  format: 'metadata',
                  metadataHeaders: ['Subject'],
                });
                const subject = draftDetail.data.message?.payload?.headers?.find(
                  (h: any) => h.name === 'Subject'
                )?.value || '';
                if (subject.includes(bookingCode)) {
                  matchingDrafts.push(draft);
                }
              } catch (err) {
                continue;
              }
            }
            if (matchingDrafts.length > 0) {
              drafts.data.drafts = matchingDrafts;
            }
          }
        }

        // Create email message in RFC 2822 format
        const message = [
          `To: ${this.advisorEmail}`,
          `Subject: ${emailContent.subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          '',
          emailContent.body,
        ].join('\n');

        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        if (drafts.data.drafts && drafts.data.drafts.length > 0) {
          // Update existing draft
          const draftId = drafts.data.drafts[0].id!;
          const updatedDraft = await this.gmail.users.drafts.update({
            userId: 'me',
            id: draftId,
            requestBody: {
              id: draftId,
              message: {
                raw: encodedMessage,
              },
            },
          });

          this.logger.log(`Cancellation draft updated: ${updatedDraft.data.id}`);

          return {
            draftId: updatedDraft.data.id || '',
            messageId: updatedDraft.data.message?.id || '',
            subject: emailContent.subject,
            requiresApproval: true, // Still requires approval before sending
          };
        } else {
          // Create new cancellation draft
          const draft = await this.gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
              message: {
                raw: encodedMessage,
              },
            },
          });

          this.logger.log(`Cancellation draft created: ${draft.data.id}`);

          return {
            draftId: draft.data.id || '',
            messageId: draft.data.message?.id || '',
            subject: emailContent.subject,
            requiresApproval: true, // Still requires approval before sending
          };
        }
      } else {
        // Mock implementation
        this.logger.debug('Mock cancellation draft creation');
        return {
          draftId: `draft-cancel-${Date.now()}`,
          subject: emailContent.subject,
          requiresApproval: true,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to create cancellation draft: ${error.message}`, error.stack);
      throw new Error(`Failed to create cancellation draft: ${error.message}`);
    }
  }

  /**
   * Generates cancellation email content for the advisor
   */
  private generateCancellationEmailContent(
    topic: Topic,
    bookingCode: string,
    slot: Slot,
  ): { subject: string; body: string } {
    // Dates are in UTC but represent IST time
    // Use UTC components directly since they represent IST time values
    const dateStr = new Date(Date.UTC(
      slot.startTime.getUTCFullYear(),
      slot.startTime.getUTCMonth(),
      slot.startTime.getUTCDate()
    )).toLocaleDateString('en-IN', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const hours = slot.startTime.getUTCHours();
    const minutes = slot.startTime.getUTCMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const subject = `[CANCELLED] Advisor Appointment: ${topic} - ${bookingCode}`;

    const body = `Dear Advisor,

The following appointment has been CANCELLED:

Booking Code: ${bookingCode}
Topic: ${topic}
Original Date: ${dateStr}
Original Time: ${timeStr} (IST)

This booking has been cancelled by the user. Please update your records accordingly.

Best regards,
Advisor Appointment System`;

    return { subject, body };
  }
}

