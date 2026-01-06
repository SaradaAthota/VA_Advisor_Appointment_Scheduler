import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SttService } from '../../../src/voice/services/stt.service';
import OpenAI from 'openai';

describe('SttService', () => {
  let service: SttService;
  let configService: ConfigService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(async () => {
    // Mock OpenAI
    mockOpenAI = {
      audio: {
        transcriptions: {
          create: jest.fn(),
        },
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SttService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') {
                return 'test-api-key';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SttService>(SttService);
    configService = module.get<ConfigService>(ConfigService);

    // Replace OpenAI instance with mock
    (service as any).openai = mockOpenAI;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should transcribe audio successfully', async () => {
    const mockTranscription = 'KYC onboarding';
    mockOpenAI.audio.transcriptions.create.mockResolvedValue(
      mockTranscription as any,
    );

    const audioBuffer = Buffer.from('fake audio data');
    const result = await service.transcribeAudio(audioBuffer, 'test.webm');

    expect(result).toBe(mockTranscription);
    expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
        temperature: 0.0,
      }),
    );
  });

  it('should handle 502 Bad Gateway error', async () => {
    const error = new Error('502 Bad Gateway');
    (error as any).status = 502;
    mockOpenAI.audio.transcriptions.create.mockRejectedValue(error);

    const audioBuffer = Buffer.from('fake audio data');

    await expect(service.transcribeAudio(audioBuffer, 'test.webm')).rejects.toThrow(
      'OpenAI API is temporarily unavailable',
    );
  });

  it('should handle 401 Unauthorized error', async () => {
    const error = new Error('401 Unauthorized');
    (error as any).status = 401;
    mockOpenAI.audio.transcriptions.create.mockRejectedValue(error);

    const audioBuffer = Buffer.from('fake audio data');

    await expect(service.transcribeAudio(audioBuffer, 'test.webm')).rejects.toThrow(
      'OpenAI API key is invalid',
    );
  });

  it('should handle 429 Rate Limit error', async () => {
    const error = new Error('429 Rate Limit');
    (error as any).status = 429;
    mockOpenAI.audio.transcriptions.create.mockRejectedValue(error);

    const audioBuffer = Buffer.from('fake audio data');

    await expect(service.transcribeAudio(audioBuffer, 'test.webm')).rejects.toThrow(
      'OpenAI API rate limit exceeded',
    );
  });

  it('should throw error when API key not configured', async () => {
    (service as any).openai = null;

    const audioBuffer = Buffer.from('fake audio data');

    await expect(service.transcribeAudio(audioBuffer, 'test.webm')).rejects.toThrow(
      'OpenAI API key not configured',
    );
  });

  it('should warn on very short audio', async () => {
    const mockTranscription = 'test';
    mockOpenAI.audio.transcriptions.create.mockResolvedValue(
      mockTranscription as any,
    );

    const shortBuffer = Buffer.from('x'); // Very short
    const loggerSpy = jest.spyOn((service as any).logger, 'warn');

    await service.transcribeAudio(shortBuffer, 'test.webm');

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('very small'),
    );
  });
});

