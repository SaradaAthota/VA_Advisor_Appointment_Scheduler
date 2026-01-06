import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { INotesMcp, NotesAppendResult } from '../interfaces/notes-mcp.interface';
import { Slot } from '../../domain/models/slot.model';
import { Topic } from '../../domain/models/topic.enum';
import { GoogleOAuthService } from './google-oauth.service';

/**
 * Google Docs MCP Service
 * Appends booking information to the "Advisor Pre-Bookings" document
 */
@Injectable()
export class GoogleDocsMcpService implements INotesMcp {
  private readonly logger = new Logger(GoogleDocsMcpService.name);
  private docs: any;
  private documentId: string;
  private useRealApi: boolean;

  constructor(private readonly oauthService: GoogleOAuthService) {
    this.initializeDocs();
  }

  private initializeDocs() {
    this.documentId =
      process.env.GOOGLE_DOCS_PRE_BOOKINGS_DOC_ID || 'pre-bookings-doc-id';
    this.useRealApi = this.oauthService.isConfigured();

    if (this.useRealApi) {
      const auth = this.oauthService.getOAuth2Client();
      this.docs = google.docs({ version: 'v1', auth });
      this.logger.log('Google Docs MCP Service initialized with real API');
    } else {
      this.logger.log('Google Docs MCP Service initialized in mock mode');
    }
  }

  async appendBookingEntry(
    date: Date,
    topic: Topic,
    slot: Slot,
    bookingCode: string,
  ): Promise<NotesAppendResult> {
    this.logger.log(
      `Appending booking entry: ${bookingCode} - ${topic} on ${date.toISOString()}`,
    );

    try {
      // Format the entry: {date, topic, slot, code}
      const entry = this.formatBookingEntry(date, topic, slot, bookingCode);

      // In Phase 4, we'll create a mock implementation
      // In Phase 5, this will make actual API calls to Google Docs
      const result = await this.appendToDocument(entry);

      this.logger.log(`Booking entry appended to document: ${this.documentId}`);

      return {
        documentId: this.documentId,
        documentUrl: result.documentUrl,
        appendedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to append booking entry: ${error.message}`, error.stack);
      throw new Error(`Failed to append booking entry: ${error.message}`);
    }
  }

  /**
   * Formats a booking entry for the document
   */
  private formatBookingEntry(
    date: Date,
    topic: Topic,
    slot: Slot,
    bookingCode: string,
  ): string {
    const dateStr = date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = slot.startTime.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `\n${dateStr} | ${timeStr} | ${topic} | ${bookingCode} | Slot: ${slot.id}`;
  }

  /**
   * Appends text to the Google Docs document
   * Uses real Google Docs API if credentials are configured, otherwise uses mock
   */
  private async appendToDocument(
    text: string,
  ): Promise<{ documentUrl?: string }> {
    if (this.useRealApi && this.docs) {
      try {
        // First, get the document to find the end index
        const document = await this.docs.documents.get({
          documentId: this.documentId,
        });

        const endIndex = document.data.body?.content?.[
          document.data.body.content.length - 1
        ]?.endIndex;

        if (!endIndex) {
          throw new Error('Could not determine document end index');
        }

        // Insert text at the end of the document
        await this.docs.documents.batchUpdate({
          documentId: this.documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: {
                    index: endIndex - 1, // Insert before the last newline
                  },
                  text: text,
                },
              },
            ],
          },
        });

        this.logger.debug(`Real document append: ${text.substring(0, 50)}...`);

        return {
          documentUrl: `https://docs.google.com/document/d/${this.documentId}`,
        };
      } catch (error) {
        this.logger.error(
          `Failed to append to real document: ${error.message}`,
          error.stack,
        );
        // Fall back to mock if real API fails
        this.logger.warn('Falling back to mock document append');
        return this.createMockAppend();
      }
    } else {
      // Mock implementation
      return this.createMockAppend();
    }
  }

  /**
   * Creates a mock document append (fallback)
   */
  private createMockAppend(): { documentUrl?: string } {
    const documentUrl = `https://docs.google.com/document/d/${this.documentId}`;

    this.logger.debug(`Mock document append`);

    return {
      documentUrl,
    };
  }

  /**
   * Updates an existing booking entry (not implemented for Docs)
   * This service is deprecated in favor of GoogleSheetsMcpService
   */
  async updateBookingEntry(
    bookingCode: string,
    newSlot: Slot,
  ): Promise<NotesAppendResult> {
    this.logger.warn('updateBookingEntry not implemented for Google Docs. Use GoogleSheetsMcpService instead.');
    // Return mock result
    return {
      documentId: this.documentId,
      documentUrl: `https://docs.google.com/document/d/${this.documentId}/edit`,
      appendedAt: new Date(),
    };
  }

  /**
   * Marks a booking entry as cancelled (not implemented for Docs)
   * This service is deprecated in favor of GoogleSheetsMcpService
   */
  async cancelBookingEntry(
    bookingCode: string,
  ): Promise<NotesAppendResult> {
    this.logger.warn('cancelBookingEntry not implemented for Google Docs. Use GoogleSheetsMcpService instead.');
    // Return mock result
    return {
      documentId: this.documentId,
      documentUrl: `https://docs.google.com/document/d/${this.documentId}/edit`,
      appendedAt: new Date(),
    };
  }
}

