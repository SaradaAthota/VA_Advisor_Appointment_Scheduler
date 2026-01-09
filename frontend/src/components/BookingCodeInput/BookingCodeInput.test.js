"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const user_event_1 = require("@testing-library/user-event");
const BookingCodeInput_1 = require("./BookingCodeInput");
(0, vitest_1.describe)('BookingCodeInput', () => {
    (0, vitest_1.it)('renders the input field and submit button', () => {
        const onLookup = vitest_1.vi.fn();
        (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup}/>);
        (0, vitest_1.expect)(react_1.screen.getByLabelText(/enter your booking code/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByRole('button', { name: /lookup/i })).toBeInTheDocument();
    });
    (0, vitest_1.it)('calls onLookup with uppercase code when form is submitted', async () => {
        const user = user_event_1.default.setup();
        const onLookup = vitest_1.vi.fn();
        (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup}/>);
        const input = react_1.screen.getByLabelText(/enter your booking code/i);
        const button = react_1.screen.getByRole('button', { name: /lookup/i });
        await user.type(input, 'nl-test');
        await user.click(button);
        (0, vitest_1.expect)(onLookup).toHaveBeenCalledWith('NL-TEST');
    });
    (0, vitest_1.it)('shows error for empty code', async () => {
        const onLookup = vitest_1.vi.fn();
        const { container } = (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup}/>);
        const form = container.querySelector('form');
        react_1.fireEvent.submit(form);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.getByText(/please enter a booking code/i)).toBeInTheDocument();
        });
        (0, vitest_1.expect)(onLookup).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('shows error for invalid format', async () => {
        const user = user_event_1.default.setup();
        const onLookup = vitest_1.vi.fn();
        (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup}/>);
        const input = react_1.screen.getByLabelText(/enter your booking code/i);
        const button = react_1.screen.getByRole('button', { name: /lookup/i });
        await user.type(input, 'INVALID');
        await user.click(button);
        (0, vitest_1.expect)(react_1.screen.getByText(/invalid format/i)).toBeInTheDocument();
        (0, vitest_1.expect)(onLookup).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('accepts valid booking code format', async () => {
        const user = user_event_1.default.setup();
        const onLookup = vitest_1.vi.fn();
        (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup}/>);
        const input = react_1.screen.getByLabelText(/enter your booking code/i);
        const button = react_1.screen.getByRole('button', { name: /lookup/i });
        await user.type(input, 'NL-A742');
        await user.click(button);
        (0, vitest_1.expect)(onLookup).toHaveBeenCalledWith('NL-A742');
    });
    (0, vitest_1.it)('displays external error message', () => {
        const onLookup = vitest_1.vi.fn();
        (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup} error="Booking not found"/>);
        (0, vitest_1.expect)(react_1.screen.getByText(/booking not found/i)).toBeInTheDocument();
    });
    (0, vitest_1.it)('disables input and button when loading', () => {
        const onLookup = vitest_1.vi.fn();
        (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup} isLoading={true}/>);
        const input = react_1.screen.getByLabelText(/enter your booking code/i);
        const button = react_1.screen.getByRole('button');
        (0, vitest_1.expect)(input).toBeDisabled();
        (0, vitest_1.expect)(button).toBeDisabled();
        (0, vitest_1.expect)(button).toHaveTextContent(/looking up/i);
    });
    (0, vitest_1.it)('clears local error when user types', async () => {
        const user = user_event_1.default.setup();
        const onLookup = vitest_1.vi.fn();
        const { container } = (0, react_1.render)(<BookingCodeInput_1.default onLookup={onLookup}/>);
        const input = react_1.screen.getByLabelText(/enter your booking code/i);
        const form = container.querySelector('form');
        react_1.fireEvent.submit(form);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.getByText(/please enter a booking code/i)).toBeInTheDocument();
        });
        await user.type(input, 'NL-');
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.queryByText(/please enter a booking code/i)).not.toBeInTheDocument();
        });
    });
});
