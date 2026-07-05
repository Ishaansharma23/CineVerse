import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import request from '../services/api';
import { Ticket, User, Calendar, MapPin, XCircle, ChevronRight, UserCircle2, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';
import gsap from 'gsap';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('bookings'); // profile, bookings
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelResult, setCancelResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const containerRef = useRef(null);

  const [hiddenBookingIds, setHiddenBookingIds] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cv_hidden_bookings');
      if (stored) {
        setHiddenBookingIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDeleteBooking = (bookingId) => {
    const updated = [...hiddenBookingIds, bookingId];
    setHiddenBookingIds(updated);
    localStorage.setItem('cv_hidden_bookings', JSON.stringify(updated));
  };

  const getShowDateTime = (show) => {
    if (!show) return new Date(0);
    const showDate = new Date(show.date);
    if (show.startTime) {
      const [hours, minutes] = show.startTime.trim().split(':');
      if (hours && minutes) {
        showDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
    }
    return showDate;
  };

  // Fetch bookings on mount
  useEffect(() => {
    let isMounted = true;
    const fetchBookings = async () => {
      if (!user || user.role !== 'user') {
        setLoadingBookings(false);
        return;
      }
      try {
        setLoadingBookings(true);
        setErrorMsg('');
        const response = await request('/bookings/my');
        if (isMounted) {
          // Sort bookings (latest first)
          const sorted = (response.bookings || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setBookings(sorted);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setErrorMsg('Failed to load your booking history.');
      } finally {
        if (isMounted) setLoadingBookings(false);
      }
    };
    fetchBookings();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Entrance animations
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const handleCancelClick = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelResult(null);
    setErrorMsg('');
    setShowConfirmModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedBookingForCancel) return;
    setCancellingId(selectedBookingForCancel._id);
    setErrorMsg('');

    try {
      const response = await request(`/bookings/cancel/${selectedBookingForCancel._id}`, {
        method: 'PUT',
      });

      if (response.success) {
        const b = response.booking || {};
        const refundAmt = b.refundAmount || 0;
        const refundPct = b.totalAmount > 0 ? Math.round((refundAmt / b.totalAmount) * 100) : 100;

        setCancelResult({
          refundAmount: refundAmt,
          refundPercentage: refundPct,
        });

        // Update local bookings state
        setBookings((prev) =>
          prev.map((item) =>
            item._id === selectedBookingForCancel._id
              ? { ...item, bookingStatus: 'cancelled', paymentStatus: 'refunded', refundAmount: refundAmt }
              : item
          )
        );

        toast.success('Booking cancelled successfully!');
        toast.success('Refund processed successfully!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ticket cancellation failed.');
      toast.error(err.message || 'Ticket cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div ref={containerRef} className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Navigation Links */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#121212] border border-neutral-850 rounded-2xl p-6 text-center">
            <UserCircle2 className="w-16 h-16 text-rose-600 mx-auto mb-3" />
            <h3 className="font-extrabold text-base tracking-tight">{user?.name}</h3>
            <p className="text-neutral-500 text-xs mt-1 capitalize font-semibold">{user?.role} Account</p>
          </div>

          <div className="bg-[#121212] border border-neutral-850 rounded-2xl p-3 flex flex-col gap-1.5 select-none font-bold text-xs uppercase tracking-wider text-neutral-400">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === 'bookings' ? 'bg-white text-black' : 'hover:bg-neutral-900 hover:text-neutral-255'
              }`}
            >
              <Ticket className="w-4 h-4" />
              My Tickets
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === 'profile' ? 'bg-white text-black' : 'hover:bg-neutral-900 hover:text-neutral-255'
              }`}
            >
              <User className="w-4 h-4" />
              Profile details
            </button>
          </div>
        </div>

        {/* Right Side: Tab details */}
        <div className="lg:col-span-3 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-950/20 border border-rose-800/50 rounded-2xl text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {activeTab === 'profile' ? (
            <div className="bg-[#121212] border border-neutral-850 rounded-2xl p-8 space-y-6">
              <h2 className="text-xl font-bold tracking-tight border-b border-neutral-800 pb-3">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-neutral-400">
                <div className="space-y-1.5">
                  <span className="uppercase tracking-wider text-neutral-500">Full Name</span>
                  <p className="text-sm text-neutral-250 font-bold bg-[#1A1A1A] p-3 rounded-xl border border-neutral-800">{user?.name}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="uppercase tracking-wider text-neutral-500">Email Address</span>
                  <p className="text-sm text-neutral-250 font-bold bg-[#1A1A1A] p-3 rounded-xl border border-neutral-800">{user?.email}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="uppercase tracking-wider text-neutral-500">Account Privilege</span>
                  <p className="text-sm text-neutral-250 font-bold bg-[#1A1A1A] p-3 rounded-xl border border-neutral-800 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-xl font-bold tracking-tight">Your Movie Tickets</h2>
              
              {loadingBookings ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-neutral-900/40 border border-neutral-900 p-6 rounded-2xl animate-pulse h-28" />
                  ))}
                </div>
              ) : bookings.filter(b => !hiddenBookingIds.includes(b._id)).length === 0 ? (
                <div className="py-20 text-center border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/20">
                  <Ticket className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-neutral-300">No tickets found</h3>
                  <p className="text-neutral-500 text-xs mt-1">You have not booked any tickets yet. Explore movies and start booking.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Explore Movies
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.filter(b => !hiddenBookingIds.includes(b._id)).map((booking) => {
                    const { show, seats, totalAmount, bookingStatus, _id, bookingId } = booking;
                    const movie = show?.movie || {};
                    const screen = show?.screen || {};
                    const theatre = screen?.theatre || {};

                    const isPast = getShowDateTime(show) < new Date();
                    const isBooked = bookingStatus === 'booked';
                    const isCancelled = bookingStatus === 'cancelled';
                    const isExpired = bookingStatus === 'expired' || bookingStatus === 'failed';

                    return (
                      <div
                        key={_id}
                        className="bg-[#121212]/30 border border-neutral-900 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-neutral-850 transition-colors"
                      >
                        {/* Movie & Theatre Info */}
                        <div className="flex gap-4 items-start grow">
                          <img
                            src={movie.posterUrl || movie.image}
                            alt={movie.title}
                            className="w-14 sm:w-16 aspect-[2/3] object-cover rounded-xl border border-neutral-800"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-sm sm:text-base text-neutral-100">{movie.title}</h3>
                              
                              {/* Status Badges */}
                              {isBooked && !isPast && (
                                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold rounded uppercase">
                                  Upcoming
                                </span>
                              )}
                              {isBooked && isPast && (
                                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-500 text-[9px] font-bold rounded uppercase">
                                  Past Show
                                </span>
                              )}
                              {isCancelled && (
                                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-bold rounded uppercase">
                                  Cancelled
                                </span>
                              )}
                              {isExpired && (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-550 text-[9px] font-bold rounded uppercase">
                                  Failed/Expired Attempt
                                </span>
                              )}
                            </div>

                            <p className="text-neutral-500 text-xs font-semibold pl-0">
                              {theatre.name} ({screen.screenNumber})
                            </p>
                            
                            <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-bold pt-1.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(show?.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} | {show?.startTime}
                              </span>
                              <span>•</span>
                              <span>
                                SEATS: {seats.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Booking cost and actions */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-neutral-900 pt-4 md:pt-0 gap-4">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Paid</p>
                            <p className="font-black text-neutral-200">₹{totalAmount}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isBooked && !isPast && (
                              <button
                                onClick={() => handleCancelClick(booking)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-rose-950/20 hover:text-rose-400 border border-neutral-850 hover:border-rose-900/35 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel Ticket
                              </button>
                            )}

                            {(isExpired || isCancelled || isPast) && (
                              <button
                                onClick={() => handleDeleteBooking(_id)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 hover:text-rose-500 border border-neutral-850 hover:border-neutral-800 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}

                            {isBooked && (
                              <button
                                onClick={() => navigate(`/ticket/${_id}`)}
                                className="flex items-center gap-1 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-rose-600/5 cursor-pointer"
                              >
                                Details
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal for Cancel Booking */}
      {showConfirmModal && selectedBookingForCancel && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Cancel Ticket Booking
            </h3>

            {cancelResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-800/50 rounded-2xl text-emerald-400 text-xs font-semibold flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm">Ticket Cancelled Successfully!</p>
                    <p className="mt-1">Refund processed: ₹{cancelResult.refundAmount} ({cancelResult.refundPercentage}% refund amount credit).</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-3 bg-white text-black font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Are you sure you want to cancel your ticket for <span className="font-extrabold text-neutral-250">{selectedBookingForCancel.show?.movie?.title}</span>?
                </p>
                
                <div className="bg-[#1C1611] border border-amber-600/20 rounded-2xl p-4 text-[11px] text-amber-500 font-semibold space-y-1">
                  <p>• Cancellations are eligible for refunds based on timeline policies.</p>
                  <p>• Refund credits will be returned via Razorpay payment gateway to source payment method.</p>
                  <p>• Cancellations within 2 hours of showtime are non-refundable.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 text-neutral-450 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={confirmCancellation}
                    disabled={cancellingId !== null}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {cancellingId ? 'Processing...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
