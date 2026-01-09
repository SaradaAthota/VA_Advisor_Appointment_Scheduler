import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStatus } from '../../domain/models/booking-status.enum';
import { Topic } from '../../domain/models/topic.enum';

/**
 * Booking Entity for Database Persistence
 * Stores booking information in database (SQLite or PostgreSQL)
 */
@Entity('bookings')
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 7 })
  bookingCode: string; // Format: NL-XXXX

  @Column({
    type: 'simple-enum',
    enum: Topic,
  })
  topic: Topic;

  @Column('text')
  preferredSlotId: string;

  @Column('timestamp')
  preferredSlotStartTime: Date;

  @Column('timestamp')
  preferredSlotEndTime: Date;

  @Column('boolean', { default: true })
  preferredSlotIsAvailable: boolean;

  @Column('text', { nullable: true })
  alternativeSlotId?: string;

  @Column('timestamp', { nullable: true })
  alternativeSlotStartTime?: Date;

  @Column('timestamp', { nullable: true })
  alternativeSlotEndTime?: Date;

  @Column('boolean', { nullable: true })
  alternativeSlotIsAvailable?: boolean;

  @Column({
    type: 'simple-enum',
    enum: BookingStatus,
    default: BookingStatus.TENTATIVE,
  })
  status: BookingStatus;

  @Column({ default: 'IST' })
  timeZone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

