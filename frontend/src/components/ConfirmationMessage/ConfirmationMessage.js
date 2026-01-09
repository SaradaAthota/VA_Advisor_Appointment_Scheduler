"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfirmationMessage;
const react_router_dom_1 = require("react-router-dom");
require("./ConfirmationMessage.css");
function ConfirmationMessage({ bookingCode }) {
    const navigate = (0, react_router_dom_1.useNavigate)();
    return (<div className="confirmation-message">
      <div className="confirmation-icon">✓</div>
      <h2>Booking Completed Successfully!</h2>
      <p className="confirmation-text">
        Your booking has been completed. You will receive a confirmation email shortly.
      </p>
      <div className="booking-code-display">
        <span className="code-label">Your Booking Code:</span>
        <span className="code-value">{bookingCode}</span>
      </div>
      <div className="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Check your email for booking confirmation</li>
          <li>Save your booking code for future reference</li>
          <li>You'll receive a reminder before your appointment</li>
        </ul>
      </div>
      <div className="confirmation-actions">
        <button className="home-button" onClick={() => navigate('/')}>
          Go to Home
        </button>
      </div>
    </div>);
}
