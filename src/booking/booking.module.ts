import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { McpModule } from '../mcp/mcp.module';
import { BookingEntity } from './entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity]),
    McpModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService], // Export for use in VoiceModule
})
export class BookingModule {}

