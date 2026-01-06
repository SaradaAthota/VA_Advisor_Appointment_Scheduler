import { IsEnum, IsNotEmpty, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Topic } from '../../domain/models/topic.enum';
import { Slot } from '../../domain/models/slot.model';

class SlotDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  startTime: string; // ISO string

  @IsNotEmpty()
  endTime: string; // ISO string

  @IsNotEmpty()
  isAvailable: boolean;
}

export class CreateBookingDto {
  @IsNotEmpty()
  @IsEnum(Topic)
  topic: Topic;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotDto)
  preferredSlot: SlotDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotDto)
  alternativeSlot?: SlotDto;
}

