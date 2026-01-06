import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingCodeInput from './BookingCodeInput';

describe('BookingCodeInput', () => {
  it('renders the input field and submit button', () => {
    const onLookup = vi.fn();
    render(<BookingCodeInput onLookup={onLookup} />);

    expect(screen.getByLabelText(/enter your booking code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lookup/i })).toBeInTheDocument();
  });

  it('calls onLookup with uppercase code when form is submitted', async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn();
    render(<BookingCodeInput onLookup={onLookup} />);

    const input = screen.getByLabelText(/enter your booking code/i);
    const button = screen.getByRole('button', { name: /lookup/i });

    await user.type(input, 'nl-test');
    await user.click(button);

    expect(onLookup).toHaveBeenCalledWith('NL-TEST');
  });

  it('shows error for empty code', async () => {
    const onLookup = vi.fn();
    const { container } = render(<BookingCodeInput onLookup={onLookup} />);

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/please enter a booking code/i)).toBeInTheDocument();
    });
    expect(onLookup).not.toHaveBeenCalled();
  });

  it('shows error for invalid format', async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn();
    render(<BookingCodeInput onLookup={onLookup} />);

    const input = screen.getByLabelText(/enter your booking code/i);
    const button = screen.getByRole('button', { name: /lookup/i });

    await user.type(input, 'INVALID');
    await user.click(button);

    expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
    expect(onLookup).not.toHaveBeenCalled();
  });

  it('accepts valid booking code format', async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn();
    render(<BookingCodeInput onLookup={onLookup} />);

    const input = screen.getByLabelText(/enter your booking code/i);
    const button = screen.getByRole('button', { name: /lookup/i });

    await user.type(input, 'NL-A742');
    await user.click(button);

    expect(onLookup).toHaveBeenCalledWith('NL-A742');
  });

  it('displays external error message', () => {
    const onLookup = vi.fn();
    render(<BookingCodeInput onLookup={onLookup} error="Booking not found" />);

    expect(screen.getByText(/booking not found/i)).toBeInTheDocument();
  });

  it('disables input and button when loading', () => {
    const onLookup = vi.fn();
    render(<BookingCodeInput onLookup={onLookup} isLoading={true} />);

    const input = screen.getByLabelText(/enter your booking code/i);
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/looking up/i);
  });

  it('clears local error when user types', async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn();
    const { container } = render(<BookingCodeInput onLookup={onLookup} />);

    const input = screen.getByLabelText(/enter your booking code/i);
    const form = container.querySelector('form');

    // Trigger error by submitting empty form
    fireEvent.submit(form!);
    await waitFor(() => {
      expect(screen.getByText(/please enter a booking code/i)).toBeInTheDocument();
    });

    // Type something - error should clear
    await user.type(input, 'NL-');
    await waitFor(() => {
      expect(screen.queryByText(/please enter a booking code/i)).not.toBeInTheDocument();
    });
  });
});

