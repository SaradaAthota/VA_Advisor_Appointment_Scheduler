import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { VoiceController } from './voice.controller';
import { ConversationService } from './services/conversation.service';
import { IntentRecognitionService } from './services/intent-recognition.service';
import { ConversationLogService } from './services/conversation-log.service';
import { ConversationLogEntity } from './services/conversation-log.service';
import { SttService } from './services/stt.service';
import { TtsService } from './services/tts.service';
import { BookingModule } from '../booking/booking.module';

/**
 * Voice Module
 * Handles voice agent conversation logic (Phase 6 & 7)
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ConversationLogEntity]),
    BookingModule,
  ],
  controllers: [VoiceController],
  providers: [
    ConversationService,
    IntentRecognitionService,
    ConversationLogService,
    SttService,
    TtsService,
  ],
  exports: [ConversationService, SttService, TtsService],
})
export class VoiceModule {}

