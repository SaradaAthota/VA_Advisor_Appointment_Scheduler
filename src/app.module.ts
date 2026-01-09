import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Check multiple possible variable names Railway might use
        const databaseUrl = 
          configService.get<string>('DATABASE_URL') ||
          configService.get<string>('POSTGRES_URL') ||
          configService.get<string>('POSTGRES_PRIVATE_URL') ||
          process.env.DATABASE_URL ||
          process.env.POSTGRES_URL ||
          process.env.POSTGRES_PRIVATE_URL;

        // Debug logging
        console.log('🔍 Database Configuration Check:');
        console.log('   DATABASE_URL exists:', !!configService.get<string>('DATABASE_URL'));
        console.log('   DATABASE_URL value:', databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'NOT SET');
        console.log('   All env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')).join(', '));

        const hasPostgresUrl = databaseUrl && (
          databaseUrl.startsWith('postgresql://') ||
          databaseUrl.startsWith('postgres://')
        );
        
        if (hasPostgresUrl) {
          console.log('✅ Using PostgreSQL database');
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: configService.get<string>('DATABASE_SYNC') === 'true' || process.env.DATABASE_SYNC === 'true',
            ssl: {
              rejectUnauthorized: false,
            },
            logging: configService.get<string>('NODE_ENV') !== 'production',
          };
        } else {
          console.log('⚠️  Using SQLite database (PostgreSQL URL not found)');
          console.log('   DATABASE_URL:', databaseUrl || 'undefined');
          return {
            type: 'sqlite',
            database: configService.get<string>('DATABASE_PATH') || 'bookings.db',
            entities: [BookingEntity, ConversationLogEntity],
            synchronize: true,
            logging: configService.get<string>('NODE_ENV') !== 'production',
          };
        }
      },
      inject: [ConfigService],
    }),
    BookingModule,
    McpModule,
    VoiceModule,
  ],
})
export class AppModule {}

