import { useState } from 'react';
import './BookingCodeInput.css';

interface BookingCodeInputProps {
  onLookup: (code: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function BookingCodeInput({
  onLookup,
  isLoading = false,
  error,
}: BookingCodeInputProps) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setLocalError('Please enter a booking code');
      return;
    }

    // Validate format
    const pattern = /^NL-[A-Z0-9]{4}$/;
    if (!pattern.test(trimmedCode)) {
      setLocalError('Invalid format. Booking code should be in format: NL-XXXX');
      return;
    }

    onLookup(trimmedCode);
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit} className="booking-code-form">
      <div className="form-group">
        <label htmlFor="bookingCode" className="form-label">
          Enter Your Booking Code
        </label>
        <div className="input-wrapper">
          <input
            id="bookingCode"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setLocalError('');
            }}
            placeholder="NL-XXXX"
            className={`form-input ${displayError ? 'error' : ''}`}
            disabled={isLoading}
            maxLength={7}
            autoComplete="off"
            style={{ 
              minWidth: '250px',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '1.1rem',
              padding: '14px 18px'
            }}
          />
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
        {displayError && <div className="error-message">{displayError}</div>}
        <div className="help-text">
          Your booking code was provided during the call (e.g., NL-A742)
        </div>
      </div>
    </form>
  );
}

