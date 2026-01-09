"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const react_1 = require("@testing-library/react");
const ConfirmationMessage_1 = require("./ConfirmationMessage");
(0, vitest_1.describe)('ConfirmationMessage', () => {
    (0, vitest_1.it)('renders confirmation message with booking code', () => {
        (0, react_1.render)(<ConfirmationMessage_1.default bookingCode="NL-A742"/>);
        (0, vitest_1.expect)(react_1.screen.getByText(/booking completed successfully/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('NL-A742')).toBeInTheDocument();
    });
    (0, vitest_1.it)('displays success icon', () => {
        (0, react_1.render)(<ConfirmationMessage_1.default bookingCode="NL-A742"/>);
        (0, vitest_1.expect)(react_1.screen.getByText('✓')).toBeInTheDocument();
    });
    (0, vitest_1.it)('displays confirmation text', () => {
        (0, react_1.render)(<ConfirmationMessage_1.default bookingCode="NL-A742"/>);
        (0, vitest_1.expect)(react_1.screen.getByText(/you will receive a confirmation email/i)).toBeInTheDocument();
    });
    (0, vitest_1.it)('displays next steps section', () => {
        (0, react_1.render)(<ConfirmationMessage_1.default bookingCode="NL-A742"/>);
        (0, vitest_1.expect)(react_1.screen.getByText(/what's next/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText(/check your email/i)).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText(/save your booking code/i)).toBeInTheDocument();
    });
    (0, vitest_1.it)('displays booking code in code format', () => {
        (0, react_1.render)(<ConfirmationMessage_1.default bookingCode="NL-TEST"/>);
        const codeElement = react_1.screen.getByText('NL-TEST');
        (0, vitest_1.expect)(codeElement).toBeInTheDocument();
        (0, vitest_1.expect)(codeElement).toHaveClass('code-value');
    });
});
