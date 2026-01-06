import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { ContactDetailsDto } from './contact-details.dto';

export class CompleteBookingDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ContactDetailsDto)
  contactDetails: ContactDetailsDto;
}

