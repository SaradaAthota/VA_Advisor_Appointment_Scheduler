import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechClient } from '@google-cloud/speech';

@Injectable()
export class GoogleSttService {
  private readonly logger = new Logger(GoogleSttService.name);
  private speechClient: SpeechClient | null = null;

  constructor(private readonly configService: ConfigService) { }

  /**
   * Initialize Google Speech client
   * Uses default credentials from environment (GOOGLE_APPLICATION_CREDENTIALS)
   */
  private async initializeSpeechClient(): Promise<SpeechClient> {
    if (this.speechClient) {
      return this.speechClient;
    }

    try {
      // Create Speech client with default credentials
      // Will use GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
      this.speechClient = new SpeechClient();

      this.logger.log('Google Speech-to-Text client initialized');
      return this.speechClient;
    } catch (error) {
      this.logger.error('Failed to initialize Google Speech client:', error);
      throw new Error('Failed to initialize Google Speech-to-Text service');
    }
  }

  /**
   * Transcribe audio using Google Speech-to-Text API
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    const audioSizeKB = (audioBuffer.length / 1024).toFixed(2);
    this.logger.log(`Transcribing audio: ${filename}, size: ${audioSizeKB} KB`);

    // Validate audio buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio buffer is empty');
    }

    // Minimum size check (1KB for Google STT)
    const MIN_AUDIO_SIZE = 1_000;
    if (audioBuffer.length < MIN_AUDIO_SIZE) {
      throw new Error(`Audio too short: ${audioBuffer.length} bytes (minimum: ${MIN_AUDIO_SIZE} bytes)`);
    }

    // Initialize client
    const speechClient = await this.initializeSpeechClient();

    // Determine audio encoding from filename
    const ext = filename.toLowerCase().split('.').pop();
    let encoding: string;
    let sampleRateHertz = 44100;

    switch (ext) {
      case 'wav':
        encoding = 'LINEAR16';
        sampleRateHertz = 44100;
        break;
      case 'webm':
        encoding = 'WEBM_OPUS';
        sampleRateHertz = 48000;
        break;
      case 'mp3':
        encoding = 'MP3';
        sampleRateHertz = 44100;
        break;
      case 'flac':
        encoding = 'FLAC';
        sampleRateHertz = 44100;
        break;
      case 'ogg':
        encoding = 'OGG_OPUS';
        sampleRateHertz = 48000;
        break;
      default:
        encoding = 'LINEAR16';
        sampleRateHertz = 44100;
    }

    this.logger.debug(`Using encoding: ${encoding}, sample rate: ${sampleRateHertz}Hz`);

    // Configure the request
    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: encoding as any,
        sampleRateHertz: sampleRateHertz,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: 'latest_long', // Use latest model for better accuracy
        useEnhanced: true, // Use enhanced model if available
        // Add speech contexts for better recognition of domain-specific terms
        speechContexts: [
          {
            phrases: [
              'KYC onboarding',
              'KYC',
              'know your customer',
              'SIP mandates',
              'SIP',
              'systematic investment plan',
              'tax documents',
              'tax docs',
              'withdrawals',
              'timelines',
              'account changes',
              'nominee',
              'book appointment',
              'schedule appointment',
              'appointment booking',
              'financial advisor',
              'investment',
              'portfolio',
              'mutual funds',
              'equity',
              'debt',
              'insurance',
            ],
          },
        ],
      },
    };

    try {
      this.logger.log('Sending to Google Speech-to-Text API...');

      // Perform the speech recognition request
      const [response] = await speechClient.recognize(request);

      if (!response.results || response.results.length === 0) {
        throw new Error('No speech detected in the audio. Please speak louder and clearer.');
      }

      // Get the transcription from the first result
      const transcription = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();

      if (!transcription || transcription.length === 0) {
        throw new Error('No speech detected in the audio. Please try recording again with clearer speech.');
      }

      // Log confidence scores for debugging
      response.results.forEach((result, index) => {
        const confidence = result.alternatives?.[0]?.confidence || 0;
        this.logger.debug(`Result ${index + 1} confidence: ${(confidence * 100).toFixed(1)}%`);
      });

      this.logger.log(`Transcription successful: "${transcription}" (${transcription.length} chars)`);
      return transcription;

    } catch (apiError: any) {
      this.logger.error('Google Speech API error:', apiError);

      if (apiError.code === 3) {
        throw new Error('Invalid audio format. Please use WAV, MP3, FLAC, or WebM format.');
      } else if (apiError.code === 7) {
        throw new Error('Google Speech API permission denied. Check your credentials.');
      } else if (apiError.code === 8) {
        throw new Error('Google Speech API quota exceeded. Please check your usage limits.');
      } else if (apiError.code === 14) {
        throw new Error('Google Speech API is temporarily unavailable. Please try again.');
      } else {
        throw new Error(`Google Speech API error: ${apiError.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Health check for Google STT service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.initializeSpeechClient();
      return true;
    } catch (error) {
      this.logger.error('Google STT health check failed:', error);
      return false;
    }
  }
}