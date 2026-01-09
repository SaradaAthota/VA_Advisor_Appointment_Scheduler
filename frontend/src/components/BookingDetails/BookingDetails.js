"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BookingDetails;
require("./BookingDetails.css");
function BookingDetails({ booking }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return '#27ae60';
            case 'TENTATIVE':
                return '#f39c12';
            case 'RESCHEDULED':
                return '#3498db';
            case 'CANCELLED':
                return '#e74c3c';
            case 'WAITLISTED':
                return '#9b59b6';
            default:
                return '#7f8c8d';
        }
    };
    return (<div className="booking-details">
      <div className="details-header">
        <h2>Booking Details</h2>
        <div className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
          {booking.status}
        </div>
      </div>

      <div className="details-content">
        <div className="detail-item">
          <span className="detail-label">Booking Code:</span>
          <span className="detail-value code">{booking.bookingCode}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Topic:</span>
          <span className="detail-value">{booking.topic}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Preferred Slot:</span>
          <span className="detail-value">
            {formatDate(booking.preferredSlot.startTime)} IST
          </span>
        </div>

        {booking.alternativeSlot && (<div className="detail-item">
            <span className="detail-label">Alternative Slot:</span>
            <span className="detail-value">
              {formatDate(booking.alternativeSlot.startTime)} IST
            </span>
          </div>)}

        <div className="detail-item">
          <span className="detail-label">Time Zone:</span>
          <span className="detail-value">{booking.timeZone}</span>
        </div>
      </div>
    </div>);
}
