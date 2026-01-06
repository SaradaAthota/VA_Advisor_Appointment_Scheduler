import { IsNotEmpty, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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

export class RescheduleBookingDto {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotDto)
  newPreferredSlot: SlotDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotDto)
  newAlternativeSlot?: SlotDto;
}

