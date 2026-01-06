import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class ContactDetailsDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

