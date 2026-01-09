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
      (() => {
        const databaseUrl = process.env.DATABASE_URL;
        const hasPostgresUrl = databaseUrl && databaseUrl.startsWith('postgres');
        
        if (hasPostgresUrl) {
          console.log('✅ Using PostgreSQL database (DATABASE_URL detected)');
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: process.env.DATABASE_SYNC === 'true', // Disable in production, use migrations instead
            ssl: {
              rejectUnauthorized: false, // Required for Railway PostgreSQL
            },
            logging: process.env.NODE_ENV === 'development',
          };
        } else {
          console.log('⚠️  Using SQLite database (DATABASE_URL not found)');
          console.log('   To use PostgreSQL on Railway: Add PostgreSQL database service');
          return {
            type: 'sqlite',
            database: process.env.DATABASE_PATH || 'bookings.db',
            entities: [BookingEntity, ConversationLogEntity],
            synchronize: true, // Enable for local development only
            logging: process.env.NODE_ENV === 'development',
          };
        }
      })(),
    ),
    BookingModule,
    McpModule,
    VoiceModule,
  ],
})
export class AppModule {}

