import { IsEnum, IsNotEmpty } from 'class-validator';
import { Topic } from '../../domain/models/topic.enum';

export class CreateTestBookingDto {
  @IsNotEmpty()
  @IsEnum(Topic)
  topic: Topic;
}

