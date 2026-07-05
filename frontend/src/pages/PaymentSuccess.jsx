import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircle2, Ticket, Home, Download, Calendar, Clock, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Retrieve booking from state
  const booking = location.state?.booking;

  // Run confetti explosion on mount
  useEffect(() => {
    if (booking) {
      // Fire confetti multiple times for maximum premium feel
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Confetti from left and right sides
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [booking]);

  const handleDownloadPdf = () => {
    if (!booking) return;
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    window.open(`${apiUrl}/bookings/${booking._id}/pdf`, '_blank');
  };

  const handleViewTickets = () => {
    if (user?._id) {
      navigate(`/profile/${user._id}`);
    } else {
      navigate('/');
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center p-8 text-white select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md p-8 bg-[#121212]/50 border border-neutral-900 rounded-3xl backdrop-blur-md"
        >
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-extrabold text-neutral-200">No Booking Record</h3>
          <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
            We couldn't retrieve any booking confirmation details.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  const show = booking.show;
  const movie = show?.movie;
  const screen = show?.screen;
  const theatre = screen?.theatre;

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8 select-none flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Animated Check & Congrats Banner */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full text-green-500 shadow-lg shadow-green-500/5"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1.5"
          >
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">Booking Confirmed!</h1>
            <p className="text-xs text-neutral-400 font-extrabold tracking-widest uppercase">Thank you for booking with CineVerse</p>
          </motion.div>
        </div>

        {/* Premium Booking Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-[#121212]/50 border border-neutral-900 bg-gradient-to-b from-[#121212]/75 to-[#0A0A0A]/40 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-6"
        >
          {/* Subtle glowing purple orb */}
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Booking Meta & ID */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neutral-900/60 text-xs font-extrabold">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Booking ID</p>
              <p className="text-neutral-200 font-mono mt-0.5 tracking-wider">{booking.bookingId}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Transaction Status</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg mt-1 font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                PAID
              </span>
            </div>
          </div>

          {/* Main Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Movie details card layout */}
            <div className="md:col-span-8 flex gap-6 items-start">
              <img
                src={movie?.posterUrl}
                alt={movie?.title}
                className="w-20 object-cover rounded-xl border border-neutral-800 shadow-md flex-shrink-0"
              />
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base text-neutral-100 leading-snug">{movie?.title}</h3>
                  <p className="text-purple-400 text-[10px] font-black uppercase tracking-wider">{movie?.language || 'Hindi'}</p>
                </div>
                <div className="space-y-2 text-xs text-neutral-400 font-semibold">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span>{theatre?.name} — Screen {screen?.screenNumber}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span>{new Date(show?.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>{show?.startTime}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Booking details layout */}
            <div className="md:col-span-4 space-y-4 md:border-l md:border-neutral-900/60 md:pl-6">
              <div>
                <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Seats Booked</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {booking.seats.map((seat) => (
                    <span 
                      key={seat} 
                      className="px-2 py-0.5 bg-neutral-900 border border-neutral-850 text-neutral-200 text-xs font-black rounded"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Amount Paid</p>
                <p className="text-2xl font-black text-purple-500 mt-1 flex items-center gap-1">
                  <CreditCard className="w-5 h-5 text-neutral-400" />
                  ₹{booking.totalAmount}
                </p>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Action Button Rails */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-lg shadow-purple-600/10 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Download className="w-4 h-4" />
            Download Ticket
          </button>

          <button
            onClick={handleViewTickets}
            className="w-full sm:w-auto px-6 py-4 bg-neutral-900 border border-neutral-850 text-neutral-300 hover:text-white hover:border-neutral-700 rounded-2xl font-black text-xs tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Ticket className="w-4 h-4" />
            View My Tickets
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-4 bg-transparent border border-transparent text-neutral-500 hover:text-neutral-300 rounded-2xl font-black text-xs tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default PaymentSuccess;
