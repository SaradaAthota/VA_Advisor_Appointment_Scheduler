import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Text-to-Speech Service
 * Converts text to audio using OpenAI Neural TTS
 */
@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private openai: OpenAI | null = null;
  private defaultVoice: string = 'alloy';
  private defaultModel: string = 'tts-1';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.defaultVoice = this.configService.get<string>('OPENAI_TTS_VOICE', 'alloy');
      this.defaultModel = this.configService.get<string>('OPENAI_TTS_MODEL', 'tts-1');
      this.logger.log(`OpenAI Neural TTS service initialized with voice: ${this.defaultVoice}, model: ${this.defaultModel}`);
    } else {
      this.logger.warn('OPENAI_API_KEY not found - TTS service will not work');
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   * @param text - Text to convert to speech
   * @param voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
   * @param model - Model to use (tts-1 or tts-1-hd)
   * @returns Audio buffer (MP3 format)
   */
  async textToSpeech(
    text: string,
    voice: string = this.defaultVoice,
    model?: string,
  ): Promise<Buffer> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. TTS service unavailable.');
    }

    try {
      this.logger.debug(`Generating speech for text: "${text.substring(0, 50)}..."`);

      // Validate voice
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      if (!validVoices.includes(voice)) {
        this.logger.warn(`Invalid voice "${voice}", using default: ${this.defaultVoice}`);
        voice = this.defaultVoice;
      }

      // Validate model
      const ttsModel = model || this.defaultModel;
      const validModels = ['tts-1', 'tts-1-hd'];
      if (!validModels.includes(ttsModel)) {
        this.logger.warn(`Invalid model "${ttsModel}", using default: ${this.defaultModel}`);
        model = this.defaultModel;
      } else {
        model = ttsModel;
      }

      const response = await this.openai.audio.speech.create({
        model: model as 'tts-1' | 'tts-1-hd',
        voice: voice as any,
        input: text,
        response_format: 'mp3',
      });

      // Convert response to buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      this.logger.log(`TTS generation successful: ${buffer.length} bytes`);

      return buffer;
    } catch (error) {
      this.logger.error(`TTS generation failed: ${error.message}`, error.stack);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  /**
   * Check if TTS service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): string[] {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return ['tts-1', 'tts-1-hd'];
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}
