"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = exports.BookingService = void 0;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
class BookingService {
    async findByBookingCode(bookingCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingCode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                if (response.status === 410) {
                    throw new Error('This booking has been cancelled');
                }
                throw new Error(`Failed to fetch booking: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An error occurred while fetching the booking');
        }
    }
    async completeBooking(bookingCode, contactDetails) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingCode}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contactDetails,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to complete booking: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: data.success,
                message: data.message || 'Booking completed successfully!',
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An error occurred while completing the booking');
        }
    }
    validateBookingCode(code) {
        const pattern = /^NL-[A-Z0-9]{4}$/;
        return pattern.test(code);
    }
    async offerSlots(preference) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/offer-slots`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preference || {}),
            });
            if (!response.ok) {
                throw new Error(`Failed to get available slots: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                slots: data.slots || [],
                waitlist: data.waitlist || false,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An error occurred while fetching available slots');
        }
    }
    async createBooking(topic, preferredSlot, alternativeSlot) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                    preferredSlot: {
                        id: preferredSlot.id,
                        startTime: preferredSlot.startTime,
                        endTime: preferredSlot.endTime,
                        isAvailable: preferredSlot.isAvailable,
                    },
                    alternativeSlot: alternativeSlot
                        ? {
                            id: alternativeSlot.id,
                            startTime: alternativeSlot.startTime,
                            endTime: alternativeSlot.endTime,
                            isAvailable: alternativeSlot.isAvailable,
                        }
                        : undefined,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to create booking: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An error occurred while creating the booking');
        }
    }
    async cancelBooking(bookingCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingCode}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to cancel booking: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: data.success,
                message: data.message || 'Booking cancelled successfully!',
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An error occurred while cancelling the booking');
        }
    }
    async rescheduleBooking(bookingCode, newPreferredSlot, newAlternativeSlot) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingCode}/reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPreferredSlot: {
                        id: newPreferredSlot.id,
                        startTime: newPreferredSlot.startTime,
                        endTime: newPreferredSlot.endTime,
                        isAvailable: newPreferredSlot.isAvailable,
                    },
                    newAlternativeSlot: newAlternativeSlot
                        ? {
                            id: newAlternativeSlot.id,
                            startTime: newAlternativeSlot.startTime,
                            endTime: newAlternativeSlot.endTime,
                            isAvailable: newAlternativeSlot.isAvailable,
                        }
                        : undefined,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to reschedule booking: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An error occurred while rescheduling the booking');
        }
    }
}
exports.BookingService = BookingService;
exports.bookingService = new BookingService();
