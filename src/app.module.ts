import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { McpModule } from './mcp/mcp.module';
import { VoiceModule } from './voice/voice.module';
import { BookingEntity } from './booking/entities/booking.entity';
import { ConversationLogEntity } from './voice/services/conversation-log.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'bookings.db',
      entities: [BookingEntity, ConversationLogEntity],
      synchronize: process.env.NODE_ENV !== 'production' || process.env.DATABASE_SYNC === 'true', // Auto-create tables (disable in production)
      logging: process.env.NODE_ENV === 'development',
    }),
    BookingModule,
    McpModule,
    VoiceModule,
  ],
})
export class AppModule {}

