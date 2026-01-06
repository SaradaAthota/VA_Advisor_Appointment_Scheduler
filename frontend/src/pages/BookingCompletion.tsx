import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingDetails from '../components/BookingDetails/BookingDetails';
import ContactForm from '../components/ContactForm/ContactForm';
import ConfirmationMessage from '../components/ConfirmationMessage/ConfirmationMessage';
import { bookingService } from '../services/booking.service';
import { Booking, ContactDetails, Slot, Topic } from '../types/booking.types';
import './BookingCompletion.css';

export default function BookingCompletion() {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showRescheduleSlots, setShowRescheduleSlots] = useState(false);
  const [isRescheduled, setIsRescheduled] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<Slot | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingCode) {
        setError('Invalid booking code');
        setIsLoading(false);
        return;
      }

      // Validate format
      if (!bookingService.validateBookingCode(bookingCode)) {
        setError('Invalid booking code format');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const foundBooking = await bookingService.findByBookingCode(bookingCode);

        if (!foundBooking) {
          setError('Booking not found. Please check your booking code.');
          setIsLoading(false);
          return;
        }

        // Check if booking is already cancelled
        if (foundBooking.status === 'CANCELLED') {
          setError('This booking has been cancelled.');
          setIsLoading(false);
          return;
        }

        setBooking(foundBooking);
        setIsLoading(false);
      } catch (err) {
        setError('An error occurred while loading booking details.');
        setIsLoading(false);
      }
    };

    loadBooking();
  }, [bookingCode]);

  const handleSubmit = async (contactDetails: ContactDetails) => {
    if (!bookingCode) return;

    setIsSubmitting(true);

    try {
      const result = await bookingService.completeBooking(
        bookingCode,
        contactDetails,
      );

      if (result.success) {
        setIsCompleted(true);
      } else {
        setError(result.message || 'Failed to complete booking');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingCode || !booking) return;

    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    setIsCancelling(true);
    setError('');

    try {
      const result = await bookingService.cancelBooking(bookingCode);
      if (result.success) {
        alert('Booking cancelled successfully.');
        navigate('/');
      } else {
        setError(result.message || 'Failed to cancel booking');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while cancelling the booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!bookingCode || !booking || !selectedNewSlot) return;

    setIsRescheduling(true);
    setError('');

    try {
      const updatedBooking = await bookingService.rescheduleBooking(
        bookingCode,
        selectedNewSlot,
      );
      setBooking(updatedBooking);
      setShowRescheduleSlots(false);
      setSelectedNewSlot(null);
      setIsRescheduled(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while rescheduling the booking.');
      setIsRescheduling(false);
    }
  };

  const loadRescheduleSlots = async () => {
    if (!booking || !bookingCode) return;

    setShowRescheduleSlots(true);
    setError('');

    try {
      // Pass excludeBookingCode to exclude current booking's slot from booked list
      // This allows showing slots on the same date as current booking
      const result = await bookingService.offerSlots({
        topic: booking.topic as Topic,
        excludeBookingCode: bookingCode, // Exclude current booking for reschedule
      });
      setAvailableSlots(result.slots);
    } catch (err: any) {
      setError(err.message || 'Failed to load available slots.');
      setShowRescheduleSlots(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="booking-completion-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="booking-completion-page">
        <div className="error-container">
          <div className="error-icon">⚠</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button
            className="back-button"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted && bookingCode) {
    return (
      <div className="booking-completion-page">
        <ConfirmationMessage bookingCode={bookingCode} />
      </div>
    );
  }

  if (isRescheduled && booking) {
    return (
      <div className="booking-completion-page">
        <div className="reschedule-success-container">
          <div className="success-icon">✅</div>
          <h2>Booking Rescheduled Successfully!</h2>
          <div className="reschedule-details">
            <p><strong>Booking Code:</strong> {booking.bookingCode}</p>
            <p><strong>New Date & Time:</strong> {formatDateTime(booking.preferredSlot.startTime)}</p>
            <p><strong>Topic:</strong> {booking.topic}</p>
          </div>
          <div className="success-actions">
            <button
              className="home-button"
              onClick={() => navigate('/')}
            >
              🏠 Go to Home
            </button>
            <button
              className="view-booking-button"
              onClick={() => {
                setIsRescheduled(false);
                setShowRescheduleSlots(false);
              }}
            >
              View Updated Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="booking-completion-page">
      <div className="completion-container">
        <BookingDetails booking={booking} />
        
        {/* Action Buttons - Show for TENTATIVE, RESCHEDULED, and CONFIRMED bookings (before completion) */}
        {booking.status !== 'CANCELLED' && booking.status !== 'WAITLISTED' && !isCompleted && (
          <div className="booking-actions">
            <button
              className="cancel-button"
              onClick={handleCancel}
              disabled={isCancelling || isSubmitting}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
            <button
              className="reschedule-button"
              onClick={loadRescheduleSlots}
              disabled={isRescheduling || isSubmitting || showRescheduleSlots}
            >
              Reschedule Booking
            </button>
          </div>
        )}

        {/* Reschedule Slot Selection */}
        {showRescheduleSlots && (
          <div className="reschedule-slots-container">
            <h3>Select New Time Slot</h3>
            <p className="reschedule-note">Choose a new time slot for your appointment</p>
            <div className="slots-grid">
              {availableSlots
                .filter((slot) => slot.isAvailable === true)
                .map((slot) => (
                  <button
                    key={slot.id}
                    className={`slot-button ${
                      selectedNewSlot?.id === slot.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedNewSlot(slot)}
                  >
                    <div className="slot-time">{formatDateTime(slot.startTime)}</div>
                  </button>
                ))}
            </div>
            <div className="reschedule-actions">
              <button
                className="cancel-reschedule-button"
                onClick={() => {
                  setShowRescheduleSlots(false);
                  setSelectedNewSlot(null);
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-reschedule-button"
                onClick={handleReschedule}
                disabled={!selectedNewSlot || isRescheduling}
              >
                {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        )}

        <ContactForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        {error && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
}

