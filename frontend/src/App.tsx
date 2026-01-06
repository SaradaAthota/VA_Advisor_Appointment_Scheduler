import { Routes, Route } from 'react-router-dom';
import BookingLookup from './pages/BookingLookup';
import BookingCompletion from './pages/BookingCompletion';
import BookingCreation from './pages/BookingCreation';
import './App.css';

function App() {
    return (
        <div className="App">
            <header className="app-header">
                <h1>Advisor Appointment Booking</h1>
                <p className="subtitle">Book or complete your appointment</p>
            </header>
            <main className="app-main">
                <Routes>
                    <Route path="/" element={<BookingLookup />} />
                    <Route path="/create" element={<BookingCreation />} />
                    <Route path="/complete/:bookingCode" element={<BookingCompletion />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;

