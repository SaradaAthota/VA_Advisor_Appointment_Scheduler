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
 * Stores booking information in SQLite database
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

  @Column('datetime')
  preferredSlotStartTime: Date;

  @Column('datetime')
  preferredSlotEndTime: Date;

  @Column('boolean', { default: true })
  preferredSlotIsAvailable: boolean;

  @Column('text', { nullable: true })
  alternativeSlotId?: string;

  @Column('datetime', { nullable: true })
  alternativeSlotStartTime?: Date;

  @Column('datetime', { nullable: true })
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

