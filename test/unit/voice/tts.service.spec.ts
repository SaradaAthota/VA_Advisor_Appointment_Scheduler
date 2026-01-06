import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TtsService } from '../../../src/voice/services/tts.service';
import OpenAI from 'openai';

describe('TtsService', () => {
  let service: TtsService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(async () => {
    // Mock OpenAI
    mockOpenAI = {
      audio: {
        speech: {
          create: jest.fn(),
        },
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'OPENAI_API_KEY') {
                return 'test-api-key';
              }
              if (key === 'OPENAI_TTS_MODEL') {
                return 'tts-1';
              }
              if (key === 'OPENAI_TTS_VOICE') {
                return 'nova';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TtsService>(TtsService);

    // Replace OpenAI instance with mock
    (service as any).openai = mockOpenAI;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate speech successfully', async () => {
    const mockAudioBuffer = Buffer.from('fake audio data');
    const mockResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
    };
    mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse as any);

    const result = await service.textToSpeech('Hello, world');

    expect(result).toBeInstanceOf(Buffer);
    expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'tts-1',
        voice: 'nova',
        input: 'Hello, world',
        response_format: 'mp3',
      }),
    );
  });

  it('should use custom voice when provided', async () => {
    const mockAudioBuffer = Buffer.from('fake audio data');
    const mockResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
    };
    mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse as any);

    await service.textToSpeech('Hello', 'alloy');

    expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith(
      expect.objectContaining({
        voice: 'alloy',
      }),
    );
  });

  it('should use custom model when provided', async () => {
    const mockAudioBuffer = Buffer.from('fake audio data');
    const mockResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
    };
    mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse as any);

    await service.textToSpeech('Hello', undefined, 'tts-1-hd');

    expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'tts-1-hd',
      }),
    );
  });

  it('should handle invalid voice gracefully', async () => {
    const mockAudioBuffer = Buffer.from('fake audio data');
    const mockResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
    };
    mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse as any);

    const loggerSpy = jest.spyOn((service as any).logger, 'warn');

    await service.textToSpeech('Hello', 'invalid-voice');

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid voice'),
    );
    // Should fall back to default voice
    expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith(
      expect.objectContaining({
        voice: 'nova', // default
      }),
    );
  });

  it('should throw error when API key not configured', async () => {
    (service as any).openai = null;

    await expect(service.textToSpeech('Hello')).rejects.toThrow(
      'OpenAI API key not configured',
    );
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    mockOpenAI.audio.speech.create.mockRejectedValue(error);

    await expect(service.textToSpeech('Hello')).rejects.toThrow(
      'Failed to generate speech',
    );
  });
});

