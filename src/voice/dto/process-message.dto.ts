import { IsString, IsNotEmpty } from 'class-validator';

export class ProcessMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ProcessMessageResponseDto {
  response: string;
  state: string;
  bookingCode?: string;
}

