import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { INotesMcp, NotesAppendResult } from '../interfaces/notes-mcp.interface';
import { Slot } from '../../domain/models/slot.model';
import { Topic } from '../../domain/models/topic.enum';
import { GoogleOAuthService } from './google-oauth.service';

/**
 * Google Sheets MCP Service
 * Appends booking information to the "Advisor Pre-Bookings" spreadsheet
 */
@Injectable()
export class GoogleSheetsMcpService implements INotesMcp {
  private readonly logger = new Logger(GoogleSheetsMcpService.name);
  private sheets: any;
  private spreadsheetId: string;
  private sheetName: string;
  private useRealApi: boolean;

  constructor(private readonly oauthService: GoogleOAuthService) {
    this.initializeSheets();
  }

  private initializeSheets() {
    // Trim whitespace from spreadsheet ID to avoid errors
    const rawSpreadsheetId =
      process.env.GOOGLE_SHEETS_PRE_BOOKINGS_SPREADSHEET_ID || 'pre-bookings-spreadsheet-id';
    this.spreadsheetId = rawSpreadsheetId.trim();
    this.sheetName = (process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1').trim();
    this.useRealApi = this.oauthService.isConfigured();

    if (this.useRealApi) {
      const auth = this.oauthService.getOAuth2Client();
      this.sheets = google.sheets({ version: 'v4', auth });
      this.logger.log('Google Sheets MCP Service initialized with real API');
    } else {
      this.logger.log('Google Sheets MCP Service initialized in mock mode');
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
      // Format the entry as a row: [date, time, topic, bookingCode, slotId]
      const row = this.formatBookingEntryAsRow(date, topic, slot, bookingCode);

      // In Phase 4, we'll create a mock implementation
      // In Phase 5, this will make actual API calls to Google Sheets
      const result = await this.appendRowToSheet(row);

      this.logger.log(`Booking entry appended to spreadsheet: ${this.spreadsheetId}`);

      return {
        documentId: this.spreadsheetId,
        documentUrl: result.documentUrl,
        appendedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to append booking entry: ${error.message}`, error.stack);
      throw new Error(`Failed to append booking entry: ${error.message}`);
    }
  }

  /**
   * Formats a booking entry as a row for the spreadsheet
   * Returns: [date, timeRange, topic, bookingCode, slotId]
   */
  private formatBookingEntryAsRow(
    date: Date,
    topic: Topic,
    slot: Slot,
    bookingCode: string,
  ): string[] {
    // Dates are in UTC but represent IST time
    // Use UTC components directly since they represent IST time values
    const dateStr = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )).toLocaleDateString('en-IN', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Format start time - use UTC components (which represent IST)
    const startHours = slot.startTime.getUTCHours();
    const startMinutes = slot.startTime.getUTCMinutes();
    const startTimeStr = `${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
    
    // Format end time - use UTC components (which represent IST)
    const endHours = slot.endTime.getUTCHours();
    const endMinutes = slot.endTime.getUTCMinutes();
    const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    
    // Combine as "Start Time - End Time"
    const timeRangeStr = `${startTimeStr} - ${endTimeStr}`;

    return [dateStr, timeRangeStr, topic, bookingCode, slot.id];
  }

  /**
   * Appends a row to the Google Sheets spreadsheet
   * Uses real Google Sheets API if credentials are configured, otherwise uses mock
   */
  private async appendRowToSheet(
    row: string[],
  ): Promise<{ documentUrl?: string }> {
    if (this.useRealApi && this.sheets) {
      try {
        // First, check if headers exist, if not, add them
        await this.ensureHeaders();

        // Append the row to the sheet
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:E`, // Columns A to E
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [row],
          },
        });

        this.logger.debug(`Real sheet append: ${row.join(' | ')}`);

        return {
          documentUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
        };
      } catch (error) {
        this.logger.error(
          `Failed to append to real spreadsheet: ${error.message}`,
          error.stack,
        );
        // Fall back to mock if real API fails
        this.logger.warn('Falling back to mock sheet append');
        return this.createMockAppend();
      }
    } else {
      // Mock implementation
      return this.createMockAppend();
    }
  }

  /**
   * Ensures the spreadsheet has headers in the first row
   */
  private async ensureHeaders(): Promise<void> {
    try {
      // Check if first row exists and has headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:E1`,
      });

      const values = response.data.values;

      // If no values or first row is empty, add headers
      if (!values || values.length === 0 || !values[0] || values[0].length === 0) {
        const headers = ['Date', 'Time (Start - End)', 'Topic', 'Booking Code', 'Slot ID'];
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1:E1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
        this.logger.debug('Headers added to spreadsheet');
      }
    } catch (error) {
      // If sheet doesn't exist or other error, log but continue
      this.logger.warn(`Could not ensure headers: ${error.message}`);
    }
  }

  /**
   * Creates a mock sheet append (fallback)
   */
  private createMockAppend(): { documentUrl?: string } {
    const documentUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`;

    this.logger.debug(`Mock sheet append`);

    return {
      documentUrl,
    };
  }

  /**
   * Updates an existing booking entry in the spreadsheet
   * Finds the row by booking code and updates the time
   */
  async updateBookingEntry(
    bookingCode: string,
    newSlot: Slot,
  ): Promise<NotesAppendResult> {
    this.logger.log(
      `Updating booking entry in spreadsheet: ${bookingCode} to ${newSlot.startTime}`,
    );

    try {
      if (this.useRealApi && this.sheets) {
        // Get all values to find the row with this booking code
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:E`,
        });

        const values = response.data.values || [];
        let rowIndex = -1;

        // Find row with matching booking code (column D, index 3)
        for (let i = 0; i < values.length; i++) {
          if (values[i][3] === bookingCode) {
            rowIndex = i + 1; // +1 because sheets are 1-indexed
            break;
          }
        }

        if (rowIndex === -1) {
          this.logger.warn(`No sheet entry found for booking ${bookingCode}, appending new one`);
          // Append new entry if not found
          return await this.appendBookingEntry(newSlot.startTime, 'RESCHEDULED' as any, newSlot, bookingCode);
        }

        // Format the updated row
        // Dates are in UTC but represent IST time - use UTC components directly
        const dateStr = new Date(Date.UTC(
          newSlot.startTime.getUTCFullYear(),
          newSlot.startTime.getUTCMonth(),
          newSlot.startTime.getUTCDate()
        )).toLocaleDateString('en-IN', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        const startHours = newSlot.startTime.getUTCHours();
        const startMinutes = newSlot.startTime.getUTCMinutes();
        const startTimeStr = `${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
        
        const endHours = newSlot.endTime.getUTCHours();
        const endMinutes = newSlot.endTime.getUTCMinutes();
        const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        
        const timeRangeStr = `${startTimeStr} - ${endTimeStr}`;

        // Get existing row to preserve topic
        const existingRow = values[rowIndex - 1];
        const topic = existingRow[2] || 'RESCHEDULED';

        // Update the row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A${rowIndex}:E${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[dateStr, timeRangeStr, topic, bookingCode, newSlot.id]],
          },
        });

        this.logger.log(`Sheet entry updated at row ${rowIndex}`);

        return {
          documentId: this.spreadsheetId,
          documentUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
          appendedAt: new Date(),
        };
      } else {
        // Mock implementation
        this.logger.debug('Mock sheet entry update');
        return {
          documentId: this.spreadsheetId,
          documentUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
          appendedAt: new Date(),
        };
      }
    } catch (error) {
      this.logger.error(`Failed to update sheet entry: ${error.message}`, error.stack);
      throw new Error(`Failed to update sheet entry: ${error.message}`);
    }
  }

  /**
   * Marks a booking entry as cancelled in the spreadsheet
   * Finds the row by booking code and adds "[CANCELLED]" to the status
   */
  async cancelBookingEntry(
    bookingCode: string,
  ): Promise<NotesAppendResult> {
    this.logger.log(
      `Marking booking entry as cancelled in spreadsheet: ${bookingCode}`,
    );

    try {
      if (this.useRealApi && this.sheets) {
        // Get all values to find the row with this booking code
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:E`,
        });

        const values = response.data.values || [];
        let rowIndex = -1;

        // Find row with matching booking code (column D, index 3)
        for (let i = 0; i < values.length; i++) {
          if (values[i][3] === bookingCode) {
            rowIndex = i + 1; // +1 because sheets are 1-indexed
            break;
          }
        }

        if (rowIndex === -1) {
          this.logger.warn(`No sheet entry found for booking ${bookingCode}`);
          return {
            documentId: this.spreadsheetId,
            documentUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
            appendedAt: new Date(),
          };
        }

        // Get existing row to preserve data
        const existingRow = values[rowIndex - 1];
        const dateStr = existingRow[0] || '';
        const timeRangeStr = existingRow[1] || '';
        const topic = existingRow[2] || '';
        const slotId = existingRow[4] || '';

        // Mark as cancelled by adding "[CANCELLED]" to the time or creating a status column
        // We'll update the time column to show "[CANCELLED]"
        const cancelledTimeRange = `[CANCELLED] ${timeRangeStr}`;

        // Update the row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!B${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[cancelledTimeRange]],
          },
        });

        this.logger.log(`Sheet entry marked as cancelled at row ${rowIndex}`);

        return {
          documentId: this.spreadsheetId,
          documentUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
          appendedAt: new Date(),
        };
      } else {
        // Mock implementation
        this.logger.debug('Mock sheet entry cancellation');
        return {
          documentId: this.spreadsheetId,
          documentUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
          appendedAt: new Date(),
        };
      }
    } catch (error) {
      this.logger.error(`Failed to cancel sheet entry: ${error.message}`, error.stack);
      throw new Error(`Failed to cancel sheet entry: ${error.message}`);
    }
  }
}

