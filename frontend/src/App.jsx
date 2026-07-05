import { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkSession } from './redux/slices/authSlice';

import Header from './components/shared/Header';
import Footer from './components/shared/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import Ticket from './pages/Ticket';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import TicketScanner from './pages/TicketScanner';

import Stream from './pages/Stream';
import Events from './pages/Events';
import Plays from './pages/Plays';
import Sports from './pages/Sports';
import Activities from './pages/Activities';
import ListYourShow from './pages/ListYourShow';
import Offers from './pages/Offers';
import GiftCards from './pages/GiftCards';
import EventBooking from './pages/EventBooking';
import StreamBooking from './pages/StreamBooking';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { TrailerProvider } from './context/TrailerContext';
import ScrollToTop from './components/shared/ScrollToTop';
import './index.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  // Initialize session exactly once at start of application
  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="bg-[#0A0A0A] text-white min-h-screen flex flex-col items-center justify-center space-y-4 select-none">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Synchronizing session state...</p>
      </div>
    );
  }

  const location = useLocation();
  const hideHeaderFooter = location.pathname.includes('/seats') || location.pathname.includes('/checkout') || location.pathname.includes('/payment-success') || location.pathname.includes('/payment-failed');

  return (
    <TrailerProvider>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-[#0A0A0A] font-sans antialiased text-white selection:bg-rose-600 selection:text-white">
        {/* Search query binding passed to header input */}
        {!hideHeaderFooter && <Header onSearchChange={setSearchQuery} />}
        
        <main className="grow">
          <Routes>
            {/* Public Routing */}
            <Route path="/" element={<Home searchQuery={searchQuery} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            
            {/* New Expanded Public Categories */}
            <Route path="/stream" element={<Stream />} />
            <Route path="/events" element={<Events />} />
            <Route path="/plays" element={<Plays />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/list-your-show" element={<ListYourShow />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/gift-cards" element={<GiftCards />} />

            {/* Protected Customer Routes */}
            <Route
              path="/show/:showId/seats"
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-failed"
              element={
                <ProtectedRoute>
                  <PaymentFailed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ticket/:id"
              element={
                <ProtectedRoute>
                  <Ticket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Dynamic Event & Stream Booking Routes */}
            <Route
              path="/book/event/:id"
              element={
                <ProtectedRoute>
                  <EventBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/stream/:id"
              element={
                <ProtectedRoute>
                  <StreamBooking />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Owner & Admin Dashboards */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scanner"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <TicketScanner />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        
        {!hideHeaderFooter && <Footer />}
      </div>
    </TrailerProvider>
  );
}

export default App;
