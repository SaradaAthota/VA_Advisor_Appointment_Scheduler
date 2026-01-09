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
    TypeOrmModule.forRoot(
      // Use PostgreSQL if DATABASE_URL is provided (Railway), otherwise SQLite (local dev)
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            autoLoadEntities: true,
            synchronize: true, // Enable for initial setup - tables will be auto-created
            logging: process.env.NODE_ENV === 'development',
          }
        : {
            type: 'sqlite',
            database: process.env.DATABASE_PATH || 'bookings.db',
            entities: [BookingEntity, ConversationLogEntity],
            synchronize: true, // Enable for local development
            logging: process.env.NODE_ENV === 'development',
          },
    ),
    BookingModule,
    McpModule,
    VoiceModule,
  ],
})
export class AppModule {}

