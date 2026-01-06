import { useState } from 'react';
import { ContactDetails } from '../../types/booking.types';
import './ContactForm.css';

interface ContactFormProps {
  onSubmit: (details: ContactDetails) => void;
  isLoading?: boolean;
}

export default function ContactForm({ onSubmit, isLoading = false }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactDetails>({
    fullName: '',
    email: '',
    phone: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDetails, string>>>({});

  const validateEmail = (email: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const validatePhone = (phone: string) => {
    // Indian phone number format: 10 digits, optionally with +91
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
  };

  const handleChange = (field: keyof ContactDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof ContactDetails, string>> = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      additionalNotes: formData.additionalNotes?.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h3>Complete Your Booking</h3>
      <p className="form-description">
        Please provide your contact details to complete the booking process.
      </p>

      <div className="form-group">
        <label htmlFor="fullName" className="form-label">
          Full Name <span className="required">*</span>
        </label>
        <input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          className={`form-input ${errors.fullName ? 'error' : ''}`}
          placeholder="Enter your full name"
          disabled={isLoading}
        />
        {errors.fullName && <div className="error-message">{errors.fullName}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email Address <span className="required">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="your.email@example.com"
          disabled={isLoading}
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">
          Phone Number <span className="required">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className={`form-input ${errors.phone ? 'error' : ''}`}
          placeholder="10-digit phone number"
          disabled={isLoading}
        />
        {errors.phone && <div className="error-message">{errors.phone}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="additionalNotes" className="form-label">
          Additional Notes (Optional)
        </label>
        <textarea
          id="additionalNotes"
          value={formData.additionalNotes}
          onChange={(e) => handleChange('additionalNotes', e.target.value)}
          className="form-input textarea"
          placeholder="Any additional information or special requests..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={isLoading}
      >
        {isLoading ? 'Submitting...' : 'Complete Booking'}
      </button>
    </form>
  );
}

