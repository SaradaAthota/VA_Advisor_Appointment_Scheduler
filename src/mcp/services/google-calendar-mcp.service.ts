import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ICalendarMcp, CalendarEventResult } from '../interfaces/calendar-mcp.interface';
import { Slot } from '../../domain/models/slot.model';
import { Topic } from '../../domain/models/topic.enum';
import { GoogleOAuthService } from './google-oauth.service';

/**
 * Google Calendar MCP Service
 * Creates tentative calendar holds for advisor appointments
 */
@Injectable()
export class GoogleCalendarMcpService implements ICalendarMcp {
  private readonly logger = new Logger(GoogleCalendarMcpService.name);
  private calendar: any;
  private calendarId: string;
  private useRealApi: boolean;

  constructor(private readonly oauthService: GoogleOAuthService) {
    this.initializeCalendar();
  }

  private initializeCalendar() {
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    this.useRealApi = this.oauthService.isConfigured();

    if (this.useRealApi) {
      const auth = this.oauthService.getOAuth2Client();
      this.calendar = google.calendar({ version: 'v3', auth });
      this.logger.log('Google Calendar MCP Service initialized with real API');
    } else {
      this.logger.log('Google Calendar MCP Service initialized in mock mode');
    }
  }

  async createTentativeHold(
    topic: Topic,
    bookingCode: string,
    slot: Slot,
  ): Promise<CalendarEventResult> {
    this.logger.log(
      `Creating tentative calendar hold: ${topic} - ${bookingCode} at ${slot.startTime}`,
    );

    // Event title format: "Advisor Q&A — {Topic} — {Code}"
    const eventTitle = `Advisor Q&A — ${topic} — ${bookingCode}`;

    try {
      // In Phase 4, we'll create a mock implementation
      // In Phase 5, this will make actual API calls to Google Calendar
      const event = await this.createCalendarEvent(eventTitle, slot);

      this.logger.log(`Calendar hold created: ${event.eventId}`);

      return {
        eventId: event.eventId,
        calendarId: this.calendarId,
        htmlLink: event.htmlLink,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    } catch (error) {
      this.logger.error(`Failed to create calendar hold: ${error.message}`, error.stack);
      throw new Error(`Failed to create calendar hold: ${error.message}`);
    }
  }

  /**
   * Converts a Date to IST timezone string for Google Calendar API
   * The input date is in UTC, but represents IST time
   * We need to convert UTC time to IST by subtracting 5.5 hours
   * 
   * Example: If date is 2026-01-20T10:00:00.000Z (10 AM UTC, but meant to be 10 AM IST)
   * We convert: 10 AM UTC - 5.5 hours = 4:30 AM UTC (which is 10 AM IST)
   * Format as: 2026-01-20T04:30:00+05:30
   */
  private formatDateTimeForIST(date: Date): string {
    // The date is in UTC, but represents IST time
    // Convert: subtract 5.5 hours (IST offset) to get correct UTC time
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(date.getTime() - istOffsetMs);
    
    // Get UTC components of the adjusted date
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const hours = String(istDate.getUTCHours()).padStart(2, '0');
    const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
    
    // Format as RFC3339 with IST offset: YYYY-MM-DDTHH:mm:ss+05:30
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
  }

  /**
   * Creates a calendar event
   * Uses real Google Calendar API if credentials are configured, otherwise uses mock
   */
  private async createCalendarEvent(
    title: string,
    slot: Slot,
  ): Promise<{ eventId: string; htmlLink?: string }> {
    if (this.useRealApi && this.calendar) {
      try {
        // Convert dates to IST format for Google Calendar
        // The slot times are in UTC, but represent IST times, so we format them as IST
        const startDateTime = this.formatDateTimeForIST(slot.startTime);
        const endDateTime = this.formatDateTimeForIST(slot.endTime);
        
        // Use real Google Calendar API
        const event = await this.calendar.events.insert({
          calendarId: this.calendarId,
          requestBody: {
            summary: title,
            description: `Booking code: ${title.split('—')[2]?.trim() || 'N/A'}`,
            start: {
              dateTime: startDateTime,
              timeZone: 'Asia/Kolkata',
            },
            end: {
              dateTime: endDateTime,
              timeZone: 'Asia/Kolkata',
            },
            status: 'tentative',
            transparency: 'opaque',
          },
        });

        this.logger.debug(`Real calendar event created: ${event.data.id}`);

        return {
          eventId: event.data.id || '',
          htmlLink: event.data.htmlLink || undefined,
        };
      } catch (error) {
        this.logger.error(
          `Failed to create real calendar event: ${error.message}`,
          error.stack,
        );
        // Fall back to mock if real API fails
        this.logger.warn('Falling back to mock calendar event');
        return this.createMockEvent();
      }
    } else {
      // Mock implementation
      return this.createMockEvent();
    }
  }

  /**
   * Creates a mock calendar event (fallback)
   */
  private createMockEvent(): { eventId: string; htmlLink?: string } {
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const htmlLink = `https://calendar.google.com/calendar/event?eid=${eventId}`;

    this.logger.debug(`Mock calendar event created: ${eventId}`);

    return {
      eventId,
      htmlLink,
    };
  }

  /**
   * Updates an existing calendar event with new time slot
   * Finds the event by booking code in the title
   */
  async updateEvent(
    bookingCode: string,
    newSlot: Slot,
  ): Promise<CalendarEventResult> {
    this.logger.log(
      `Updating calendar event for booking: ${bookingCode} to ${newSlot.startTime}`,
    );

    try {
      if (this.useRealApi && this.calendar) {
        // Find event by searching for booking code in title
        const searchQuery = bookingCode;
        const events = await this.calendar.events.list({
          calendarId: this.calendarId,
          q: searchQuery,
          maxResults: 10,
        });

        if (!events.data.items || events.data.items.length === 0) {
          this.logger.warn(`No calendar event found for booking ${bookingCode}, creating new one`);
          // Create new event if not found
          const topic = 'RESCHEDULED'; // We don't have topic in reschedule, use placeholder
          return await this.createTentativeHold(topic as any, bookingCode, newSlot);
        }

        // Update the first matching event
        const event = events.data.items[0];
        const startDateTime = this.formatDateTimeForIST(newSlot.startTime);
        const endDateTime = this.formatDateTimeForIST(newSlot.endTime);
        const updatedEvent = await this.calendar.events.update({
          calendarId: this.calendarId,
          eventId: event.id!,
          requestBody: {
            ...event,
            start: {
              dateTime: startDateTime,
              timeZone: 'Asia/Kolkata',
            },
            end: {
              dateTime: endDateTime,
              timeZone: 'Asia/Kolkata',
            },
          },
        });

        this.logger.log(`Calendar event updated: ${updatedEvent.data.id}`);

        return {
          eventId: updatedEvent.data.id || '',
          calendarId: this.calendarId,
          htmlLink: updatedEvent.data.htmlLink || undefined,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        };
      } else {
        // Mock implementation
        this.logger.debug('Mock calendar event update');
        return {
          eventId: `event-${Date.now()}`,
          calendarId: this.calendarId,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to update calendar event: ${error.message}`, error.stack);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  /**
   * Deletes an existing calendar event
   * Finds the event by booking code in the title
   */
  async deleteEvent(
    bookingCode: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Deleting calendar event for booking: ${bookingCode}`,
    );

    try {
      if (this.useRealApi && this.calendar) {
        // Find event by searching for booking code in title
        const searchQuery = bookingCode;
        const events = await this.calendar.events.list({
          calendarId: this.calendarId,
          q: searchQuery,
          maxResults: 10,
        });

        if (!events.data.items || events.data.items.length === 0) {
          this.logger.warn(`No calendar event found for booking ${bookingCode}`);
          return {
            success: true,
            message: `No calendar event found for booking ${bookingCode}`,
          };
        }

        // Delete all matching events (in case there are duplicates)
        let deletedCount = 0;
        for (const event of events.data.items) {
          try {
            await this.calendar.events.delete({
              calendarId: this.calendarId,
              eventId: event.id!,
            });
            deletedCount++;
            this.logger.log(`Calendar event deleted: ${event.id}`);
          } catch (error) {
            this.logger.error(`Failed to delete event ${event.id}: ${error.message}`);
          }
        }

        return {
          success: true,
          message: `Deleted ${deletedCount} calendar event(s) for booking ${bookingCode}`,
        };
      } else {
        // Mock implementation
        this.logger.debug('Mock calendar event deletion');
        return {
          success: true,
          message: `Mock: Calendar event deleted for booking ${bookingCode}`,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to delete calendar event: ${error.message}`, error.stack);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }
}

