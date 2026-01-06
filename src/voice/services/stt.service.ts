import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

    let tempFilePath: string | null = null;

    try {
      // Log audio details for debugging
      const audioSizeKB = (audioBuffer.length / 1024).toFixed(2);
      this.logger.debug(`[STT] Transcribing audio: ${filename}, size: ${audioSizeKB} KB (${audioBuffer.length} bytes)`);

      // ✅ Backend validation: Reject early with clear reason
      if (!audioBuffer || audioBuffer.length === 0) {
        this.logger.error(`[STT] Audio buffer is empty`);
        throw new Error('Audio too short or invalid format: Empty audio buffer received.');
      }

      // Minimum size check (10KB = 10,000 bytes as per best practice)
      const MIN_AUDIO_SIZE = 10_000;
      if (audioBuffer.length < MIN_AUDIO_SIZE) {
        this.logger.warn(`[STT] Audio file is too small: ${audioBuffer.length} bytes (minimum: ${MIN_AUDIO_SIZE} bytes)`);
        throw new Error(`Audio too short or invalid format: Recording is ${(audioBuffer.length / 1024).toFixed(2)} KB, minimum required is ${(MIN_AUDIO_SIZE / 1024).toFixed(2)} KB. Please record for at least 1-2 seconds.`);
      }

      // Check if audio buffer looks valid (not all zeros or all same value)
      const uniqueBytes = new Set(audioBuffer.slice(0, Math.min(100, audioBuffer.length)));
      if (uniqueBytes.size < 3) {
        this.logger.warn(`[STT] Audio buffer appears to be invalid (too few unique values: ${uniqueBytes.size})`);
        throw new Error('Audio too short or invalid format: Audio appears to be silent or corrupted. Please check your microphone and try again.');
      }

      // Create a File object for OpenAI SDK
      // Use a more reliable approach: write to temp file and create File from it
      // This ensures proper file format for OpenAI API
      const uint8Array = new Uint8Array(audioBuffer);
      const mimeType = this.getMimeType(filename);
      
      let file: File | any;

      try {
        // Method 1: Try using Node.js 18+ native File API (most reliable)
        if (typeof File !== 'undefined' && File.prototype) {
          try {
            file = new File([uint8Array], filename, {
              type: mimeType,
            });
            this.logger.debug(`[STT] Using native File API`);
          } catch (e) {
            this.logger.warn(`[STT] Native File API failed: ${e.message}`);
            throw e; // Fall through to temp file method
          }
        } else {
          throw new Error('File API not available');
        }
      } catch (e) {
        // Method 2: Write to temp file and create File from it (more reliable for OpenAI)
        this.logger.debug(`[STT] Using temp file method for File creation`);
        try {
          // Create temp file
          tempFilePath = path.join(os.tmpdir(), `stt-${Date.now()}-${filename}`);
          fs.writeFileSync(tempFilePath, audioBuffer);
          
          // Read back as File using Node.js File API if available
          if (typeof File !== 'undefined') {
            const fileBuffer = fs.readFileSync(tempFilePath);
            file = new File([fileBuffer], filename, {
              type: mimeType,
            });
            this.logger.debug(`[STT] Created File from temp file`);
          } else {
            // Fallback to File-like object
            file = this.createFileLikeObject(uint8Array, filename, mimeType, audioBuffer);
          }
        } catch (tempFileError: any) {
          this.logger.error(`[STT] Temp file method failed: ${tempFileError.message}`);
          // Last resort: File-like object
          file = this.createFileLikeObject(uint8Array, filename, mimeType, audioBuffer);
        }
      }

      // Validate the file object has required methods
      if (!file || typeof file.arrayBuffer !== 'function') {
        this.logger.error(`[STT] File object creation failed - missing required methods`);
        // Clean up temp file if created
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        throw new Error('Failed to create audio file object for transcription. Please check audio format.');
      }

      // Enhanced prompt with domain terms, numbers, and common phrases
      const enhancedPrompt = `This is a financial advisor appointment booking system. 
Common topics: KYC onboarding, KYC, onboarding, on boarding, key see, key C, K Y C, SIP mandates, SIP, mandates, statements, tax documents, tax docs, withdrawals, timelines, account changes, nominee.
Numbers: one, two, three, four, five, 1, 2, 3, 4, 5.
Common phrases: "I want to book", "book an appointment", "schedule", "appointment for", "topic is", "I need help with".
The user might say topic names, numbers, or full sentences.`;

      try {
        // Log file object details for debugging
        this.logger.debug(`[STT] File object details: name=${file.name}, type=${file.type}, size=${file.size}`);
        this.logger.debug(`[STT] File object has arrayBuffer: ${typeof file.arrayBuffer === 'function'}`);
        this.logger.debug(`[STT] File object has stream: ${typeof file.stream === 'function'}`);

        // Try using the stream method if available, as it might work better with WebM
        // Otherwise fall back to File object
        let fileInput: File | Readable = file;
        if (typeof file.stream === 'function') {
          try {
            const stream = file.stream();
            if (stream && typeof stream.pipe === 'function') {
              this.logger.debug(`[STT] Using stream method for file input`);
              fileInput = stream as any;
            }
          } catch (streamError) {
            this.logger.debug(`[STT] Stream method failed, using File object: ${streamError.message}`);
            fileInput = file;
          }
        }

        // Try transcription with minimal parameters first to avoid format issues
        // Remove language parameter as it can sometimes cause issues with certain audio formats
        const transcription = await this.openai.audio.transcriptions.create({
          file: fileInput as any, // OpenAI SDK accepts both File and Readable
          model: 'whisper-1',
          // Removed language parameter - let Whisper auto-detect (can cause issues with WebM)
          response_format: 'text',
          prompt: enhancedPrompt,
          temperature: 0.0, // Lower temperature for more accurate transcription
        });

        // Handle different response formats
        let text: string;
        if (typeof transcription === 'string') {
          text = transcription;
        } else if (transcription && typeof transcription === 'object' && 'text' in transcription) {
          text = (transcription as any).text;
        } else {
          text = String(transcription);
        }
        
        // Log raw response before processing
        this.logger.debug(`[STT] Raw transcription response type: ${typeof transcription}`);
        this.logger.debug(`[STT] Raw transcription response (first 200 chars): "${String(text).substring(0, 200)}"`);
        this.logger.debug(`[STT] Raw transcription response (hex preview): ${Buffer.from(String(text).substring(0, 50)).toString('hex')}`);
        
        const trimmedText = text.trim();
        
        // Log trimmed text with character codes for debugging
        if (trimmedText.length > 0) {
          const firstChars = trimmedText.substring(0, Math.min(20, trimmedText.length));
          const charCodes = Array.from(firstChars).map(c => c.charCodeAt(0)).join(',');
          this.logger.debug(`[STT] Trimmed text: "${trimmedText.substring(0, 100)}" (length: ${trimmedText.length}, first 20 char codes: ${charCodes})`);
        }

        // Validate transcription - check for garbage characters
        // Check if the text contains mostly non-ASCII or invalid characters
        const hasValidChars = /[\w\s.,!?;:'"()-]/.test(trimmedText);
        const hasOnlyInvalidChars = trimmedText.match(/^[^\w\s.,!?;:'"()-]+$/);
        const hasRepeatedInvalidChars = trimmedText.match(/^([^\w\s.,!?;:'"()-])\1{5,}$/); // Same invalid char repeated 6+ times

        if (!trimmedText || trimmedText.length === 0) {
          this.logger.error(`[STT] Empty transcription - audio might be silent or too short`);
          throw new Error('No speech detected in the audio. Please speak clearly and try again.');
        }

        if (!hasValidChars || hasOnlyInvalidChars || hasRepeatedInvalidChars) {
          this.logger.error(`[STT] Invalid transcription detected: "${trimmedText.substring(0, 50)}" (length: ${trimmedText.length})`);
          this.logger.error(`[STT] Audio file: ${filename}, size: ${audioSizeKB} KB`);
          this.logger.error(`[STT] This usually indicates an audio format/encoding issue or corrupted audio data`);
          throw new Error(`STT transcription returned invalid text. This might be due to:\n1. Audio format/encoding issue\n2. Very short or silent audio\n3. Microphone quality issue\n4. Corrupted audio data\n\nPlease try:\n- Speaking more clearly\n- Using text mode\n- Checking microphone settings\n- Ensuring good internet connection`);
        }

        this.logger.log(`[STT] Transcription successful: "${trimmedText}" (full length: ${trimmedText.length})`);

        // Clean up temp file if created
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
            this.logger.debug(`[STT] Cleaned up temp file: ${tempFilePath}`);
          } catch (e) {
            this.logger.warn(`[STT] Failed to clean up temp file: ${e.message}`);
          }
        }

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
      // Clean up temp file if created (in case of error)
      if (typeof tempFilePath === 'string' && tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`[STT] Cleaned up temp file after error: ${tempFilePath}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      this.logger.error(`STT transcription failed: ${error.message}`, error.stack);
      // Re-throw with more context if it's not already a formatted error
      if (error.message.includes('OpenAI API') || error.message.includes('502') || error.message.includes('rate limit')) {
        throw error;
      }
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Create a File-like object compatible with OpenAI SDK
   */
  private createFileLikeObject(
    uint8Array: Uint8Array,
    filename: string,
    mimeType: string,
    audioBuffer: Buffer,
  ): any {
    // Create a proper File-like object with all required methods
    const fileLike = {
      name: filename,
      type: mimeType,
      size: audioBuffer.length,
      lastModified: Date.now(),
      
      // Required method: arrayBuffer
      arrayBuffer: async (): Promise<ArrayBuffer> => {
        // Create a new ArrayBuffer from the audio buffer to avoid SharedArrayBuffer issues
        const newBuffer = new ArrayBuffer(audioBuffer.length);
        const view = new Uint8Array(newBuffer);
        view.set(audioBuffer);
        return newBuffer;
      },
      
      // Required method: stream
      stream: (): Readable => {
        return Readable.from(audioBuffer);
      },
      
      // Required method: text
      text: async (): Promise<string> => {
        return '';
      },
      
      // Required method: slice
      slice: (start?: number, end?: number): any => {
        const sliced = audioBuffer.slice(start, end);
        const slicedUint8 = new Uint8Array(sliced);
        return this.createFileLikeObject(slicedUint8, filename, mimeType, sliced);
      },
      
      // Symbol.toStringTag for better compatibility
      [Symbol.toStringTag]: 'File',
    };

    return fileLike;
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

