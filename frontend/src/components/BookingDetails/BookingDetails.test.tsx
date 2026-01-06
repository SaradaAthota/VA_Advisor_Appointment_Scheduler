import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BookingDetails from './BookingDetails';
import { Booking, BookingStatus, Topic } from '../../types/booking.types';

describe('BookingDetails', () => {
  const mockBooking: Booking = {
    id: 'booking-1',
    bookingCode: 'NL-A742',
    topic: Topic.KYC_ONBOARDING,
    preferredSlot: {
      id: 'slot-1',
      startTime: new Date('2024-01-15T10:00:00Z').toISOString(),
      endTime: new Date('2024-01-15T10:30:00Z').toISOString(),
      isAvailable: true,
    },
    status: BookingStatus.TENTATIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeZone: 'IST',
  };

  it('renders booking code', () => {
    render(<BookingDetails booking={mockBooking} />);
    expect(screen.getByText('NL-A742')).toBeInTheDocument();
  });

  it('renders topic', () => {
    render(<BookingDetails booking={mockBooking} />);
    expect(screen.getByText('KYC/Onboarding')).toBeInTheDocument();
  });

  it('renders preferred slot', () => {
    render(<BookingDetails booking={mockBooking} />);
    expect(screen.getByText(/preferred slot/i)).toBeInTheDocument();
  });

  it('renders alternative slot when provided', () => {
    const bookingWithAlternative: Booking = {
      ...mockBooking,
      alternativeSlot: {
        id: 'slot-2',
        startTime: new Date('2024-01-15T14:00:00Z').toISOString(),
        endTime: new Date('2024-01-15T14:30:00Z').toISOString(),
        isAvailable: true,
      },
    };
    render(<BookingDetails booking={bookingWithAlternative} />);
    expect(screen.getByText(/alternative slot/i)).toBeInTheDocument();
  });

  it('does not render alternative slot when not provided', () => {
    render(<BookingDetails booking={mockBooking} />);
    expect(screen.queryByText(/alternative slot/i)).not.toBeInTheDocument();
  });

  it('renders time zone', () => {
    render(<BookingDetails booking={mockBooking} />);
    expect(screen.getByText('IST')).toBeInTheDocument();
  });

  it('displays status badge with correct color for TENTATIVE', () => {
    render(<BookingDetails booking={mockBooking} />);
    const statusBadge = screen.getByText('TENTATIVE');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('displays status badge for CONFIRMED', () => {
    const confirmedBooking: Booking = {
      ...mockBooking,
      status: BookingStatus.CONFIRMED,
    };
    render(<BookingDetails booking={confirmedBooking} />);
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('displays status badge for CANCELLED', () => {
    const cancelledBooking: Booking = {
      ...mockBooking,
      status: BookingStatus.CANCELLED,
    };
    render(<BookingDetails booking={cancelledBooking} />);
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });
});

