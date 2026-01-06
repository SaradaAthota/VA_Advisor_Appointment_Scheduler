import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Readable } from 'stream';

/**
 * Speech-to-Text Service
 * Converts audio to text using OpenAI Whisper API
 */
@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI Whisper STT service initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not found - STT service will not work');
    }
  }

  /**
   * Convert audio to text using Whisper API
   * @param audioBuffer - Audio file buffer (MP3, WAV, M4A, WebM, etc.)
   * @param filename - Original filename (for format detection)
   * @returns Transcribed text
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string = 'audio.webm',
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. STT service unavailable.');
    }

    try {
      // Log audio details for debugging
      const audioSizeKB = (audioBuffer.length / 1024).toFixed(2);
      this.logger.debug(`[STT] Transcribing audio: ${filename}, size: ${audioSizeKB} KB (${audioBuffer.length} bytes)`);

      // Warn if audio is too short (might be incomplete)
      if (audioBuffer.length < 1000) {
        this.logger.warn(`[STT] Audio file is very small (${audioBuffer.length} bytes) - might be incomplete or too short`);
      }

      // Create a File object for OpenAI SDK
      // Node.js 18+ has File globally, but we'll handle both cases
      const uint8Array = new Uint8Array(audioBuffer);

      let file: File | any;
      if (typeof File !== 'undefined') {
        // Node.js 18+ has File globally
        file = new File([uint8Array], filename, {
          type: this.getMimeType(filename),
        });
      } else {
        // Fallback for older Node.js versions
        // Create a File-like object that OpenAI SDK can use
        const Blob = require('buffer').Blob || global.Blob;
        if (Blob) {
          const blob = new Blob([uint8Array], { type: this.getMimeType(filename) });
          file = Object.assign(blob, { name: filename });
        } else {
          // Last resort: create a minimal File-like object
          file = {
            name: filename,
            type: this.getMimeType(filename),
            size: audioBuffer.length,
            stream: () => Readable.from(audioBuffer),
            arrayBuffer: async () => audioBuffer.buffer.slice(
              audioBuffer.byteOffset,
              audioBuffer.byteOffset + audioBuffer.byteLength
            ),
            text: async () => '',
            slice: (start?: number, end?: number) => {
              const sliced = audioBuffer.slice(start, end);
              return Object.assign(
                { name: filename, type: this.getMimeType(filename), size: sliced.length },
                { arrayBuffer: async () => sliced.buffer.slice(sliced.byteOffset, sliced.byteOffset + sliced.byteLength) }
              );
            },
          };
        }
      }

      // Enhanced prompt with domain terms, numbers, and common phrases
      const enhancedPrompt = `This is a financial advisor appointment booking system. 
Common topics: KYC onboarding, KYC, onboarding, on boarding, key see, key C, K Y C, SIP mandates, SIP, mandates, statements, tax documents, tax docs, withdrawals, timelines, account changes, nominee.
Numbers: one, two, three, four, five, 1, 2, 3, 4, 5.
Common phrases: "I want to book", "book an appointment", "schedule", "appointment for", "topic is", "I need help with".
The user might say topic names, numbers, or full sentences.`;

      try {
        const transcription = await this.openai.audio.transcriptions.create({
          file: file,
          model: 'whisper-1',
          language: 'en', // Specify language for better accuracy
          response_format: 'text',
          prompt: enhancedPrompt,
          temperature: 0.0, // Lower temperature for more accurate transcription
        });

        const text = transcription as unknown as string;
        const trimmedText = text.trim();

        // Validate transcription - check for garbage characters
        const isValidTranscription = /[\w\s.,!?;:'"()-]/.test(trimmedText) && trimmedText.length > 0;

        if (!isValidTranscription || trimmedText.match(/^[^\w\s]+$/)) {
          this.logger.error(`[STT] Invalid transcription detected: "${trimmedText}" - likely audio format/encoding issue`);
          this.logger.error(`[STT] Audio file: ${filename}, size: ${audioSizeKB} KB`);
          throw new Error(`STT transcription returned invalid text. This might be due to:\n1. Audio format/encoding issue\n2. Very short or silent audio\n3. Microphone quality issue\n\nPlease try:\n- Speaking more clearly\n- Using text mode\n- Checking microphone settings`);
        }

        this.logger.log(`[STT] Transcription successful: "${trimmedText}" (full length: ${trimmedText.length})`);

        return trimmedText;
      } catch (apiError: any) {
        // Handle OpenAI API errors more gracefully
        // Extract error details from OpenAI error object
        const statusCode = apiError.status || apiError.statusCode || apiError.response?.status;
        const errorMessage = apiError.message || '';

        this.logger.error(`[STT] OpenAI API error: Status ${statusCode}, Message: ${errorMessage.substring(0, 200)}`);

        // Check for HTML in error message (502 Bad Gateway from Cloudflare)
        if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway') || statusCode === 502) {
          this.logger.warn('[STT] OpenAI API returned 502 Bad Gateway - API is temporarily unavailable');
          throw new Error('OpenAI API is temporarily unavailable (502 Bad Gateway). This is usually temporary. Please wait a moment and try again, or switch to text mode.');
        } else if (statusCode === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          this.logger.error('[STT] OpenAI API authentication failed - check API key');
          throw new Error('OpenAI API key is invalid or missing. Please check your OPENAI_API_KEY in .env file.');
        } else if (statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          this.logger.warn('[STT] OpenAI API rate limit exceeded');
          throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
        } else if (statusCode === 503 || errorMessage.includes('503')) {
          this.logger.warn('[STT] OpenAI API service unavailable');
          throw new Error('OpenAI API service is temporarily unavailable. Please try again in a moment.');
        } else {
          // Clean up error message - remove HTML if present
          let cleanMessage = errorMessage;
          if (errorMessage.includes('<html>') || errorMessage.includes('<body>')) {
            cleanMessage = 'OpenAI API returned an error. Please try again or switch to text mode.';
          }
          this.logger.error(`[STT] OpenAI API error: ${cleanMessage}`);
          throw new Error(`Failed to transcribe audio: ${cleanMessage || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`STT transcription failed: ${error.message}`, error.stack);
      // Re-throw with more context if it's not already a formatted error
      if (error.message.includes('OpenAI API') || error.message.includes('502') || error.message.includes('rate limit')) {
        throw error;
      }
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      webm: 'audio/webm',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
    };
    return mimeTypes[ext || ''] || 'audio/webm';
  }

  /**
   * Check if STT service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }
}

