import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { McpModule } from './mcp/mcp.module';
import { VoiceModule } from './voice/voice.module';
import { BookingEntity } from './booking/entities/booking.entity';
import { ConversationLogEntity } from './voice/services/conversation-log.service';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'bookings.db',
      entities: [BookingEntity, ConversationLogEntity],
      // Enable synchronize for Railway (ephemeral) or when DATABASE_SYNC is true
      synchronize: process.env.DATABASE_SYNC === 'true' || process.env.RAILWAY_ENVIRONMENT === 'true' || process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    BookingModule,
    McpModule,
    VoiceModule,
  ],
})
export class AppModule {}

