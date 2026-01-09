"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const user_event_1 = require("@testing-library/user-event");
const ContactForm_1 = require("./ContactForm");
(0, vitest_1.describe)('ContactForm', () => {
    (0, vitest_1.it)('renders all form fields', () => {
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        (0, vitest_1.expect)(react_1.screen.getByLabelText(/full name/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByLabelText(/email address/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByRole('button', { name: /complete booking/i })).toBeInTheDocument();
    });
    (0, vitest_1.it)('validates required fields', async () => {
        const user = user_event_1.default.setup();
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        const submitButton = react_1.screen.getByRole('button', { name: /complete booking/i });
        await user.click(submitButton);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.getByText(/full name is required/i)).toBeInTheDocument();
            (0, vitest_1.expect)(react_1.screen.getByText(/email is required/i)).toBeInTheDocument();
            (0, vitest_1.expect)(react_1.screen.getByText(/phone number is required/i)).toBeInTheDocument();
        });
        (0, vitest_1.expect)(onSubmit).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('validates email format', async () => {
        const user = user_event_1.default.setup();
        const onSubmit = vitest_1.vi.fn();
        const { container } = (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        const nameInput = react_1.screen.getByLabelText(/full name/i);
        const emailInput = react_1.screen.getByLabelText(/email address/i);
        const phoneInput = react_1.screen.getByLabelText(/phone number/i);
        const form = container.querySelector('form');
        await user.type(nameInput, 'John Doe');
        await user.type(emailInput, '{selectall}notanemail');
        await user.type(phoneInput, '9876543210');
        react_1.fireEvent.submit(form);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        }, { timeout: 3000 });
        (0, vitest_1.expect)(onSubmit).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('validates phone number format', async () => {
        const user = user_event_1.default.setup();
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        const nameInput = react_1.screen.getByLabelText(/full name/i);
        const emailInput = react_1.screen.getByLabelText(/email address/i);
        const phoneInput = react_1.screen.getByLabelText(/phone number/i);
        const submitButton = react_1.screen.getByRole('button', { name: /complete booking/i });
        await user.type(nameInput, 'John Doe');
        await user.type(emailInput, 'john@example.com');
        await user.type(phoneInput, '123');
        await user.click(submitButton);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.getByText(/valid 10-digit phone number/i)).toBeInTheDocument();
        });
        (0, vitest_1.expect)(onSubmit).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('accepts valid 10-digit phone number', async () => {
        const user = user_event_1.default.setup();
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        const nameInput = react_1.screen.getByLabelText(/full name/i);
        const emailInput = react_1.screen.getByLabelText(/email address/i);
        const phoneInput = react_1.screen.getByLabelText(/phone number/i);
        const submitButton = react_1.screen.getByRole('button', { name: /complete booking/i });
        await user.type(nameInput, 'John Doe');
        await user.type(emailInput, 'john@example.com');
        await user.type(phoneInput, '9876543210');
        await user.click(submitButton);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(onSubmit).toHaveBeenCalledWith({
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '9876543210',
                additionalNotes: '',
            });
        });
    });
    (0, vitest_1.it)('submits form with all fields including optional notes', async () => {
        const user = user_event_1.default.setup();
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        const nameInput = react_1.screen.getByLabelText(/full name/i);
        const emailInput = react_1.screen.getByLabelText(/email address/i);
        const phoneInput = react_1.screen.getByLabelText(/phone number/i);
        const notesInput = react_1.screen.getByLabelText(/additional notes/i);
        const submitButton = react_1.screen.getByRole('button', { name: /complete booking/i });
        await user.type(nameInput, 'Jane Smith');
        await user.type(emailInput, 'jane@example.com');
        await user.type(phoneInput, '9876543210');
        await user.type(notesInput, 'Please call before the appointment');
        await user.click(submitButton);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(onSubmit).toHaveBeenCalledWith({
                fullName: 'Jane Smith',
                email: 'jane@example.com',
                phone: '9876543210',
                additionalNotes: 'Please call before the appointment',
            });
        });
    });
    (0, vitest_1.it)('trims whitespace from inputs', async () => {
        const user = user_event_1.default.setup();
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        const nameInput = react_1.screen.getByLabelText(/full name/i);
        const emailInput = react_1.screen.getByLabelText(/email address/i);
        const phoneInput = react_1.screen.getByLabelText(/phone number/i);
        const submitButton = react_1.screen.getByRole('button', { name: /complete booking/i });
        await user.type(nameInput, '  John Doe  ');
        await user.type(emailInput, '  JOHN@EXAMPLE.COM  ');
        await user.type(phoneInput, '  9876543210  ');
        await user.click(submitButton);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(onSubmit).toHaveBeenCalledWith({
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '9876543210',
                additionalNotes: '',
            });
        });
    });
    (0, vitest_1.it)('disables form when loading', () => {
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit} isLoading={true}/>);
        const submitButton = react_1.screen.getByRole('button');
        (0, vitest_1.expect)(submitButton).toBeDisabled();
        (0, vitest_1.expect)(submitButton).toHaveTextContent(/submitting/i);
    });
    (0, vitest_1.it)('clears error when user starts typing', async () => {
        const user = user_event_1.default.setup();
        const onSubmit = vitest_1.vi.fn();
        (0, react_1.render)(<ContactForm_1.default onSubmit={onSubmit}/>);
        const nameInput = react_1.screen.getByLabelText(/full name/i);
        const submitButton = react_1.screen.getByRole('button', { name: /complete booking/i });
        await user.click(submitButton);
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.getByText(/full name is required/i)).toBeInTheDocument();
        });
        await user.type(nameInput, 'J');
        await (0, react_1.waitFor)(() => {
            (0, vitest_1.expect)(react_1.screen.queryByText(/full name is required/i)).not.toBeInTheDocument();
        });
    });
});
