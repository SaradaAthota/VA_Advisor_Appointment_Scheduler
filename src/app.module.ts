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

        // Debug logging - Use console.error to ensure it shows in Railway logs
        console.error('========================================');
        console.error('🔍 DATABASE CONFIGURATION CHECK');
        console.error('========================================');
        console.error('DATABASE_URL from ConfigService:', configService.get<string>('DATABASE_URL') || 'NOT FOUND');
        console.error('DATABASE_URL from process.env:', process.env.DATABASE_URL || 'NOT FOUND');
        console.error('POSTGRES_URL from process.env:', process.env.POSTGRES_URL || 'NOT FOUND');
        console.error('All process.env keys:', Object.keys(process.env).sort().join(', '));
        console.error('DATABASE_URL value (first 100 chars):', databaseUrl ? `${databaseUrl.substring(0, 100)}...` : 'NOT SET');
        console.error('========================================');

        // More explicit check - check for postgres in the URL
        const hasPostgresUrl = databaseUrl && (
          databaseUrl.startsWith('postgresql://') ||
          databaseUrl.startsWith('postgres://') ||
          databaseUrl.includes('postgres.railway.internal') ||
          databaseUrl.includes('@postgres')
        );

        console.error('hasPostgresUrl check result:', hasPostgresUrl);
        console.error('databaseUrl type:', typeof databaseUrl);
        console.error('databaseUrl length:', databaseUrl ? databaseUrl.length : 0);

        if (hasPostgresUrl) {
          console.error('✅✅✅ USING POSTGRESQL DATABASE ✅✅✅');
          const syncValue = configService.get<string>('DATABASE_SYNC') === 'true' || process.env.DATABASE_SYNC === 'true';
          console.error('DATABASE_SYNC value:', syncValue);
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: syncValue,
            ssl: {
              rejectUnauthorized: false,
            },
            logging: configService.get<string>('NODE_ENV') !== 'production',
          };
        } else {
          console.error('⚠️⚠️⚠️ USING SQLITE DATABASE (PostgreSQL URL NOT FOUND) ⚠️⚠️⚠️');
          console.error('DATABASE_URL value:', databaseUrl || 'undefined');
          console.error('DATABASE_URL type:', typeof databaseUrl);
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
  providers: [],
})
export class AppModule { }

