import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearBooking } from '../redux/slices/bookingSlice';
import request from '../services/api';
import { ShieldCheck, CreditCard, Sparkles, AlertCircle, ArrowLeft, Calendar, Clock, Monitor, Lock, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentBooking } = useSelector((state) => state.booking);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(300);

  const paymentCompletedRef = useRef(false);

  // Retrieve or fallback to active booking ID
  const activeBookingId = currentBooking?._id || localStorage.getItem('cv_active_booking_id');

  // 1. Add Razorpay Script dynamically on mount & fetch populated booking details
  useEffect(() => {
    let isMounted = true;

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (isMounted) setRazorpayLoaded(true);
    };
    script.onerror = () => {
      if (isMounted) setErrorMsg('Failed to load payment gateway SDK.');
    };
    document.body.appendChild(script);

    // Fetch booking details (fully populated)
    const fetchBookingDetails = async () => {
      if (!activeBookingId) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const response = await request(`/bookings/${activeBookingId}`);
        if (isMounted && response.success && response.booking) {
          setBooking(response.booking);
          // Keep active booking ID in localStorage for page refresh persistence
          localStorage.setItem('cv_active_booking_id', response.booking._id);
        } else {
          if (isMounted) setErrorMsg('Failed to load active booking details.');
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        if (isMounted) setErrorMsg('Failed to sync booking status. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBookingDetails();

    return () => {
      isMounted = false;
      document.body.removeChild(script);
    };
  }, [activeBookingId]);

  // 2. Countdown timer for seat lock expiry
  useEffect(() => {
    if (!booking) return;

    const expiryTime = new Date(booking.bookingExpiresAt).getTime();
    const calculateTimeLeft = () => {
      const difference = expiryTime - Date.now();
      if (difference <= 0) {
        setErrorMsg('Your seat lock has expired. Please go back and select seats again.');
        setCountdown(0);
        return false;
      }
      setCountdown(Math.floor(difference / 1000));
      return true;
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      const active = calculateTimeLeft();
      if (!active) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const activeBookingIdRef = useRef(activeBookingId);

  useEffect(() => {
    activeBookingIdRef.current = activeBookingId;
  }, [activeBookingId]);

  // 3. Cleanup on unmount - auto release locks in Redis if payment not complete
  useEffect(() => {
    return () => {
      // If we are refreshing the checkout page or closing the tab, do not cancel the booking!
      if (window.location.pathname === '/checkout') {
        return;
      }

      const idToCancel = activeBookingIdRef.current;
      if (idToCancel && !paymentCompletedRef.current) {
        request(`/bookings/cancel/${idToCancel}`, { method: 'PUT' })
          .then(() => {
            dispatch(clearBooking());
            localStorage.removeItem('cv_active_booking_id');
          })
          .catch((err) => console.error('Error auto-cancelling booking:', err));
      }
    };
  }, [dispatch]);

  const handleBack = async () => {
    if (activeBookingId) {
      try {
        await request(`/bookings/cancel/${activeBookingId}`, { method: 'PUT' });
        dispatch(clearBooking());
        localStorage.removeItem('cv_active_booking_id');
      } catch (err) {
        console.error('Error cancelling booking on back action:', err);
      }
    }
    navigate(-1);
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      setErrorMsg('Payment gateway is loading. Please wait.');
      return;
    }

    if (countdown <= 0) {
      setErrorMsg('Seat lock has expired. Please select seats again.');
      return;
    }

    setPaying(true);
    setErrorMsg('');

    try {
      // 1. Create Razorpay order on backend
      const orderResponse = await request('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking?._id || activeBookingId || localStorage.getItem('cv_active_booking_id'),
        }),
      });

      if (!orderResponse.success || !orderResponse.order) {
        throw new Error(orderResponse.message || 'Order creation failed.');
      }

      const { order } = orderResponse;

      // 2. Configure Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T85EVbImw2wVIo',
        amount: order.amount,
        currency: order.currency,
        name: 'CineVerse Payments',
        description: `${booking.show?.movie?.title || 'Movie'} Tickets Booking`,
        order_id: order.id,
        handler: async (response) => {
          try {
            setPaying(true);
            // 3. Verify payment signature on backend
            const verificationResponse = await request('/payment/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verificationResponse.success) {
              paymentCompletedRef.current = true;
              localStorage.removeItem('cv_active_booking_id');
              dispatch(clearBooking());
              // Navigate to payment success screen passing details
              navigate('/payment-success', {
                state: {
                  booking: verificationResponse.booking || booking,
                },
              });
            } else {
              setErrorMsg('Payment verification failed. Please contact support.');
            }
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setErrorMsg(verifyErr.message || 'Signature verification failed.');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: '9999999999',
        },
        theme: {
          color: '#8B5CF6', // Purple theme accent color
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error('Payment init failed:', err);
      setErrorMsg(err.message || 'Payment gateway initialization failed.');
      setPaying(false);
    }
  };

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Synchronizing Booking Details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center p-8 text-white select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md p-8 bg-[#121212]/50 border border-neutral-900 rounded-3xl backdrop-blur-md"
        >
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-extrabold text-neutral-200">No Active Booking</h3>
          <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
            You don't have an active checkout session. Go back and select seats first.
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

  const movie = booking.show?.movie;
  const screen = booking.show?.screen;
  const theatre = screen?.theatre;

  // Billing breakdown parameters
  const ticketCount = booking.seats.length;
  const ticketSubtotal = booking.totalAmount;
  const convenienceFee = ticketCount * 28; // ₹28 per ticket
  const gstOnFee = Math.round(convenienceFee * 0.18); // 18% GST on handling fee
  const orderGrandTotal = ticketSubtotal; // Backend expects ticketSubtotal only

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-10 px-4 md:px-8 select-none flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary Panel (Col 7) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 space-y-6"
        >
          {/* Back header navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full border border-neutral-850 bg-[#121212]/80 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-black tracking-tight text-neutral-100 uppercase">Checkout</h2>
              <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Verify seats and details</p>
            </div>
          </div>

          {/* Booking Info Card (Glassmorphism layout) */}
          <div className="bg-[#121212]/50 border border-neutral-900 bg-gradient-to-b from-[#121212]/70 to-[#0A0A0A]/40 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-xl relative overflow-hidden">
            {/* Soft Purple Glow in Corner */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl" />

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={movie?.posterUrl}
                alt={movie?.title}
                className="w-24 object-cover rounded-2xl border border-neutral-800 shadow-lg flex-shrink-0"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-neutral-100 leading-snug">{movie?.title}</h3>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded">
                    U/A
                  </span>
                </div>
                <p className="text-purple-400 text-xs font-bold uppercase tracking-wider">{movie?.language || 'Hindi'}</p>
                <div className="space-y-1 text-xs text-neutral-400 font-semibold">
                  <p className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-neutral-500" />
                    {theatre?.name} — Screen {screen?.screenNumber} ({screen?.screenType})
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    {new Date(booking.show?.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    {booking.show?.startTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Seats */}
            <div className="border-t border-neutral-900/60 pt-6 space-y-3">
              <h4 className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                Selected Seats ({ticketCount})
              </h4>
              <div className="flex flex-wrap gap-2">
                {booking.seats.map((seat) => (
                  <span 
                    key={seat} 
                    className="px-3.5 py-1.5 bg-neutral-900/80 border border-neutral-800 text-neutral-200 text-xs font-black rounded-lg shadow-sm"
                  >
                    {seat}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Right Side: Billing Panel (Col 5) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 space-y-6"
        >
          {/* Seat expiration countdown warning */}
          {countdown > 0 ? (
            <div className="bg-purple-950/15 border border-purple-500/20 text-purple-400 rounded-2xl p-4 text-center font-bold text-xs tracking-wide animate-pulse">
              Seats locked! Complete payment in <span className="text-rose-500 font-extrabold font-mono">{formatCountdown()}</span>
            </div>
          ) : (
            <div className="bg-rose-950/20 border border-rose-800/40 text-rose-400 rounded-2xl p-4 text-center font-bold text-xs">
              Seat lock has expired! Please select seats again.
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-950/20 border border-rose-800/50 rounded-2xl text-rose-450 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pricing detail breakdown card */}
          <div className="bg-[#121212]/50 border border-neutral-900 bg-gradient-to-b from-[#121212]/80 to-[#0A0A0A]/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-neutral-450 border-b border-neutral-900 pb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              Payment Summary
            </h3>

            <div className="space-y-4 text-xs font-bold text-neutral-455 font-semibold">
              <div className="flex justify-between">
                <span>Ticket Price ({ticketCount} × ₹{booking.show?.price})</span>
                <span className="text-neutral-200">₹{ticketSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Convenience Fee</span>
                <span className="text-neutral-200">₹{convenienceFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST (18%)</span>
                <span className="text-neutral-200">₹{gstOnFee}</span>
              </div>

              {/* Cineverse Launch Promo to match backend ticket-only order creation */}
              <div className="flex justify-between text-green-500 bg-green-950/15 border border-green-500/10 px-3 py-2 rounded-xl text-[11px] items-center">
                <span className="flex items-center gap-1 font-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  Promo: Launch Offer
                </span>
                <span className="font-extrabold">-₹{convenienceFee + gstOnFee}</span>
              </div>

              <div className="border-t border-neutral-900/60 pt-4 flex justify-between items-baseline">
                <span className="text-neutral-200 font-extrabold text-sm uppercase tracking-wide">Grand Total</span>
                <span className="text-2xl font-black text-purple-500">₹{orderGrandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={paying || countdown <= 0}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-lg shadow-purple-600/10 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {paying ? 'Locking transaction...' : `Proceed to Payment`}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-neutral-600 font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Secured by Razorpay</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Checkout;
