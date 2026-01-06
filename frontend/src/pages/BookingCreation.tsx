import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/booking.service';
import { Slot, Topic } from '../types/booking.types';
import './BookingCreation.css';

// Topic values matching the enum
const TOPICS: Topic[] = [
  Topic.KYC_ONBOARDING,
  Topic.SIP_MANDATES,
  Topic.STATEMENTS_TAX_DOCS,
  Topic.WITHDRAWALS_TIMELINES,
  Topic.ACCOUNT_CHANGES_NOMINEE,
];

export default function BookingCreation() {
  const [step, setStep] = useState<'topic' | 'slots' | 'confirm' | 'success'>('topic');
  const [selectedTopic, setSelectedTopic] = useState<Topic | ''>('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedPreferredSlot, setSelectedPreferredSlot] = useState<Slot | null>(null);
  const [selectedAlternativeSlot, setSelectedAlternativeSlot] = useState<Slot | null>(null);
  const [bookingCode, setBookingCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [waitlist, setWaitlist] = useState(false);
  const navigate = useNavigate();

  const topics = TOPICS;

  const handleTopicSelect = async (topic: Topic) => {
    setSelectedTopic(topic);
    setIsLoading(true);
    setError('');

    try {
      const result = await bookingService.offerSlots({ topic });
      
      if (result.waitlist || result.slots.length === 0) {
        setWaitlist(true);
        setError('No slots available. You will be added to the waitlist.');
        setIsLoading(false);
        return;
      }

      setAvailableSlots(result.slots);
      setStep('slots');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSelect = (slot: Slot, isPreferred: boolean) => {
    if (isPreferred) {
      setSelectedPreferredSlot(slot);
    } else {
      setSelectedAlternativeSlot(slot);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedPreferredSlot || !selectedTopic) {
      setError('Please select a preferred slot');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const booking = await bookingService.createBooking(
        selectedTopic,
        selectedPreferredSlot,
        selectedAlternativeSlot || undefined,
      );

      setBookingCode(booking.bookingCode);
      setStep('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
      
      // If slot is already booked, refresh available slots
      if (errorMessage.includes('already booked') && selectedTopic) {
        handleTopicSelect(selectedTopic as Topic);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteBooking = () => {
    if (bookingCode) {
      navigate(`/complete/${bookingCode}`);
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

  return (
    <div className="booking-creation-page">
      <div className="creation-container">
        {step === 'topic' && (
          <div className="creation-card">
            <h2>Select Appointment Topic</h2>
            <p className="creation-description">
              Choose the topic for your advisor appointment
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="topics-grid">
              {topics.map((topic) => (
                <button
                  key={topic}
                  className="topic-button"
                  onClick={() => handleTopicSelect(topic)}
                  disabled={isLoading}
                >
                  {topic}
                </button>
              ))}
            </div>
            
            {isLoading && <div className="loading">Loading available slots...</div>}
          </div>
        )}

        {step === 'slots' && (
          <div className="creation-card">
            <h2>Select Time Slots</h2>
            <p className="creation-description">
              Choose your preferred slot and optionally an alternative
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="slots-container">
              <div className="slot-section">
                <h3>Preferred Slot *</h3>
                <p className="slot-section-note">
                  All slots shown are available for booking
                </p>
                <div className="slots-grid">
                  {availableSlots
                    .filter((slot) => slot.isAvailable === true)
                    .map((slot) => (
                      <button
                        key={slot.id}
                        className={`slot-button ${
                          selectedPreferredSlot?.id === slot.id ? 'selected' : ''
                        }`}
                        onClick={() => handleSlotSelect(slot, true)}
                      >
                        <div className="slot-time">{formatDateTime(slot.startTime)}</div>
                        <div className="slot-duration">
                          {new Date(slot.endTime).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </button>
                    ))}
                  {availableSlots.filter((slot) => slot.isAvailable === true).length === 0 && (
                    <p className="no-alternative-slots">
                      No available slots found. Please try a different topic or time preference.
                    </p>
                  )}
                </div>
              </div>

              {selectedPreferredSlot && (
                <div className="slot-section">
                  <h3>Alternative Slot (Optional)</h3>
                  <p className="slot-section-note">
                    Select a backup time slot in case your preferred slot is not available
                  </p>
                  <div className="slots-grid">
                    {availableSlots
                      .filter((slot) => 
                        slot.id !== selectedPreferredSlot.id && 
                        slot.isAvailable === true
                      )
                      .map((slot) => (
                        <button
                          key={slot.id}
                          className={`slot-button ${
                            selectedAlternativeSlot?.id === slot.id ? 'selected' : ''
                          }`}
                          onClick={() => handleSlotSelect(slot, false)}
                        >
                          <div className="slot-time">{formatDateTime(slot.startTime)}</div>
                          <div className="slot-duration">
                            {new Date(slot.endTime).toLocaleTimeString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </button>
                      ))}
                    {availableSlots.filter((slot) => 
                      slot.id !== selectedPreferredSlot.id && 
                      slot.isAvailable === true
                    ).length === 0 && (
                      <p className="no-alternative-slots">
                        No alternative slots available. You can proceed with just the preferred slot.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button
                className="button-secondary"
                onClick={() => setStep('topic')}
              >
                Back
              </button>
              <button
                className="button-primary"
                onClick={handleConfirmBooking}
                disabled={!selectedPreferredSlot || isLoading}
              >
                {isLoading ? 'Creating...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="creation-card success-card">
            <div className="success-icon">✅</div>
            <h2>Booking Created Successfully!</h2>
            <div className="booking-code-display">
              <p className="booking-code-label">Your Booking Code:</p>
              <div className="booking-code-value">{bookingCode}</div>
              <p className="booking-code-note">
                Please save this code. You'll need it to complete your booking.
              </p>
            </div>
            
            <div className="action-buttons">
              <button
                className="button-primary"
                onClick={handleCompleteBooking}
              >
                Complete Booking Details
              </button>
              <button
                className="button-secondary"
                onClick={() => navigate('/')}
              >
                Go to Home
              </button>
            </div>
          </div>
        )}

        {waitlist && (
          <div className="creation-card waitlist-card">
            <div className="waitlist-icon">⏳</div>
            <h2>No Slots Available</h2>
            <p>All slots are currently booked. You have been added to the waitlist.</p>
            <p>We'll notify you when a slot becomes available.</p>
            <button
              className="button-primary"
              onClick={() => {
                setWaitlist(false);
                setStep('topic');
                setError('');
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

