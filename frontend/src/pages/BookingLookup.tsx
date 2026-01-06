import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingCodeInput from '../components/BookingCodeInput/BookingCodeInput';
import VoiceAgentModal from '../components/VoiceAgentModal/VoiceAgentModal';
import { bookingService } from '../services/booking.service';
import './BookingLookup.css';

export default function BookingLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isVoiceAgentOpen, setIsVoiceAgentOpen] = useState(false);
  const navigate = useNavigate();

  const handleLookup = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      const booking = await bookingService.findByBookingCode(code);

      if (!booking) {
        setError('Booking not found. Please check your booking code and try again.');
        setIsLoading(false);
        return;
      }

      // Navigate to completion page with booking code
      navigate(`/complete/${code}`);
    } catch (err) {
      setError('An error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="booking-lookup-page">
      <div className="lookup-container">
        <div className="lookup-card">
          <h2>Welcome</h2>
          <p className="lookup-description">
            Create a new booking or complete an existing one with your booking code.
          </p>
          
          <div className="action-buttons-container">
            <button
              className="action-button primary"
              onClick={() => navigate('/create')}
            >
              Create New Booking
            </button>
            
            <button
              className="action-button voice-agent"
              onClick={() => setIsVoiceAgentOpen(true)}
            >
              🎤 Try Voice Agent
            </button>
            
            <div className="divider">
              <span>OR</span>
            </div>
            
            <div className="lookup-section">
              <h3>Complete Existing Booking</h3>
              <p className="lookup-subdescription">
                Enter the booking code you received to complete your appointment booking.
              </p>
              <BookingCodeInput
                onLookup={handleLookup}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>

      <VoiceAgentModal
        isOpen={isVoiceAgentOpen}
        onClose={() => setIsVoiceAgentOpen(false)}
      />
    </div>
  );
}

