"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const BookingDetails_1 = require("./BookingDetails");
const booking_types_1 = require("../../types/booking.types");
(0, vitest_1.describe)('BookingDetails', () => {
    const mockBooking = {
        id: 'booking-1',
        bookingCode: 'NL-A742',
        topic: booking_types_1.Topic.KYC_ONBOARDING,
        preferredSlot: {
            id: 'slot-1',
            startTime: new Date('2024-01-15T10:00:00Z').toISOString(),
            endTime: new Date('2024-01-15T10:30:00Z').toISOString(),
            isAvailable: true,
        },
        status: booking_types_1.BookingStatus.TENTATIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeZone: 'IST',
    };
    (0, vitest_1.it)('renders booking code', () => {
        (0, react_1.render)(<BookingDetails_1.default booking={mockBooking}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('NL-A742')).toBeInTheDocument();
    });
    (0, vitest_1.it)('renders topic', () => {
        (0, react_1.render)(<BookingDetails_1.default booking={mockBooking}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('KYC/Onboarding')).toBeInTheDocument();
    });
    (0, vitest_1.it)('renders preferred slot', () => {
        (0, react_1.render)(<BookingDetails_1.default booking={mockBooking}/>);
        (0, vitest_1.expect)(react_1.screen.getByText(/preferred slot/i)).toBeInTheDocument();
    });
    (0, vitest_1.it)('renders alternative slot when provided', () => {
        const bookingWithAlternative = {
            ...mockBooking,
            alternativeSlot: {
                id: 'slot-2',
                startTime: new Date('2024-01-15T14:00:00Z').toISOString(),
                endTime: new Date('2024-01-15T14:30:00Z').toISOString(),
                isAvailable: true,
            },
        };
        (0, react_1.render)(<BookingDetails_1.default booking={bookingWithAlternative}/>);
        (0, vitest_1.expect)(react_1.screen.getByText(/alternative slot/i)).toBeInTheDocument();
    });
    (0, vitest_1.it)('does not render alternative slot when not provided', () => {
        (0, react_1.render)(<BookingDetails_1.default booking={mockBooking}/>);
        (0, vitest_1.expect)(react_1.screen.queryByText(/alternative slot/i)).not.toBeInTheDocument();
    });
    (0, vitest_1.it)('renders time zone', () => {
        (0, react_1.render)(<BookingDetails_1.default booking={mockBooking}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('IST')).toBeInTheDocument();
    });
    (0, vitest_1.it)('displays status badge with correct color for TENTATIVE', () => {
        (0, react_1.render)(<BookingDetails_1.default booking={mockBooking}/>);
        const statusBadge = react_1.screen.getByText('TENTATIVE');
        (0, vitest_1.expect)(statusBadge).toBeInTheDocument();
        (0, vitest_1.expect)(statusBadge).toHaveStyle({ backgroundColor: vitest_1.expect.any(String) });
    });
    (0, vitest_1.it)('displays status badge for CONFIRMED', () => {
        const confirmedBooking = {
            ...mockBooking,
            status: booking_types_1.BookingStatus.CONFIRMED,
        };
        (0, react_1.render)(<BookingDetails_1.default booking={confirmedBooking}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('CONFIRMED')).toBeInTheDocument();
    });
    (0, vitest_1.it)('displays status badge for CANCELLED', () => {
        const cancelledBooking = {
            ...mockBooking,
            status: booking_types_1.BookingStatus.CANCELLED,
        };
        (0, react_1.render)(<BookingDetails_1.default booking={cancelledBooking}/>);
        (0, vitest_1.expect)(react_1.screen.getByText('CANCELLED')).toBeInTheDocument();
    });
});
