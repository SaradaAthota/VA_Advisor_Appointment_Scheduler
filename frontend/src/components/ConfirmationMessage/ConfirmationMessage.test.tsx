import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfirmationMessage from './ConfirmationMessage';

describe('ConfirmationMessage', () => {
  it('renders confirmation message with booking code', () => {
    render(<ConfirmationMessage bookingCode="NL-A742" />);

    expect(screen.getByText(/booking completed successfully/i)).toBeInTheDocument();
    expect(screen.getByText('NL-A742')).toBeInTheDocument();
  });

  it('displays success icon', () => {
    render(<ConfirmationMessage bookingCode="NL-A742" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('displays confirmation text', () => {
    render(<ConfirmationMessage bookingCode="NL-A742" />);
    expect(screen.getByText(/you will receive a confirmation email/i)).toBeInTheDocument();
  });

  it('displays next steps section', () => {
    render(<ConfirmationMessage bookingCode="NL-A742" />);
    expect(screen.getByText(/what's next/i)).toBeInTheDocument();
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText(/save your booking code/i)).toBeInTheDocument();
  });

  it('displays booking code in code format', () => {
    render(<ConfirmationMessage bookingCode="NL-TEST" />);
    const codeElement = screen.getByText('NL-TEST');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement).toHaveClass('code-value');
  });
});

