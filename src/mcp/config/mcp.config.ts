/**
 * MCP Configuration
 * Environment variables for MCP services
 */

export interface McpConfig {
  google: {
    calendar: {
      calendarId: string;
      enabled: boolean;
    };
    docs: {
      preBookingsDocId: string;
      enabled: boolean;
    };
    gmail: {
      advisorEmail: string;
      enabled: boolean;
    };
  };
}

/**
 * Gets MCP configuration from environment variables
 */
export function getMcpConfig(): McpConfig {
  return {
    google: {
      calendar: {
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        enabled: process.env.GOOGLE_CALENDAR_ENABLED !== 'false',
      },
      docs: {
        preBookingsDocId:
          process.env.GOOGLE_DOCS_PRE_BOOKINGS_DOC_ID || 'pre-bookings-doc-id',
        enabled: process.env.GOOGLE_DOCS_ENABLED !== 'false',
      },
      gmail: {
        advisorEmail: process.env.ADVISOR_EMAIL || 'advisor@example.com',
        enabled: process.env.GMAIL_ENABLED !== 'false',
      },
    },
  };
}

