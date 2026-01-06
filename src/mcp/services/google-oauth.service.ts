import { Injectable, Logger } from '@nestjs/common';
import { google, Auth } from 'googleapis';

/**
 * Google OAuth2 Service
 * Provides authenticated OAuth2 client for Google APIs
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private oauth2Client: Auth.OAuth2Client | null = null;

  /**
   * Gets an authenticated OAuth2 client
   * Creates a new client if one doesn't exist
   */
  getOAuth2Client(): Auth.OAuth2Client {
    if (this.oauth2Client) {
      return this.oauth2Client;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn(
        'Google OAuth2 credentials not found. Using mock mode. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env for real API access.',
      );
      // Return a dummy client - services will handle this gracefully
      return new google.auth.OAuth2(clientId || '', clientSecret || '', redirectUri);
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Set the refresh token to get access tokens
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    this.logger.log('Google OAuth2 client initialized with credentials');

    return this.oauth2Client;
  }

  /**
   * Checks if real OAuth2 credentials are configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    );
  }
}

