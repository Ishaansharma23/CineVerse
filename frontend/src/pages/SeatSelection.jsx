import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSeatSelection, setCurrentBooking, clearSeats, clearBooking } from '../redux/slices/bookingSlice';
import request from '../services/api';
import { io } from 'socket.io-client';
import { Film, Users, ShieldAlert, Sparkles, LogIn, Calendar, Clock, Monitor, Lock, ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react';
import gsap from 'gsap';
import screenImg from '../assets/screen.png';

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { selectedMovie, selectedSeats, currentBooking } = useSelector((state) => state.booking);

  const [show, setShow] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const totalAmount = selectedSeats.length * (show?.price || 150);

  const socketRef = useRef(null);
  const pageRef = useRef(null);

  // Fetch show and seats layout on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchLayout = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        // Auto-release previous booking if mounting and a booking is pending
        if (currentBooking) {
          try {
            await request(`/bookings/cancel/${currentBooking._id}`, { method: 'PUT' });
          } catch (cancelErr) {
            console.error("Error auto-releasing seat lock:", cancelErr);
          }
          dispatch(clearBooking());
        }

        // 1. Fetch show metadata
        const showData = await request(`/shows/${showId}`);
        if (!isMounted) return;
        setShow(showData.show);

        // 2. Fetch locked/booked seats layout
        const seatLayoutData = await request(`/bookings/show/${showId}/seats`);
        if (!isMounted) return;
        setBookedSeats(seatLayoutData.bookedSeats || []);
        setLockedSeats(seatLayoutData.lockedSeats || []);
        
        dispatch(clearSeats()); // Clear any previously selected seats
      } catch (err) {
        console.error('Error loading show layout:', err);
        setErrorMsg('Failed to load seat layout. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLayout();

    // 3. Establish Socket.io connection for real-time seat locks
    const socketUrl = import.meta.env.VITE_API_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.io connected:', socket.id);
      socket.emit('join-show', showId);
    });

    socket.on('seat-locked', (data) => {
      if (data.showId === showId && data.lockedBy !== user?.id) {
        setLockedSeats((prev) => {
          const updated = [...prev];
          data.seats.forEach((s) => {
            if (!updated.includes(s)) updated.push(s);
          });
          return updated;
        });
      }
    });

    socket.on('seat-unlocked', (data) => {
      if (data.showId === showId) {
        setLockedSeats((prev) => prev.filter((s) => !data.seats.includes(s)));
      }
    });

    socket.on('seat-booked', (data) => {
      if (data.showId === showId) {
        setBookedSeats((prev) => {
          const updated = [...prev];
          data.seats.forEach((s) => {
            if (!updated.includes(s)) updated.push(s);
          });
          return updated;
        });
        // Remove from locked seats since they are now booked
        setLockedSeats((prev) => prev.filter((s) => !data.seats.includes(s)));
      }
    });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [showId, user?.id]);

  // Page entrance animation
  useEffect(() => {
    if (!loading && show && pageRef.current) {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [loading, show]);

  const handleSeatClick = (seatLabel) => {
    // If seat is permanently booked, do nothing
    if (bookedSeats.includes(seatLabel)) return;
    
    // If seat is locked by someone else, do nothing
    if (lockedSeats.includes(seatLabel)) return;

    dispatch(toggleSeatSelection(seatLabel));
  };

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/show/${showId}/seats` } });
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMsg('Please select at least one seat to proceed.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // Call backend POST /api/bookings to temporarily lock seats in Redis and save booking
      const response = await request('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          showId,
          seats: selectedSeats,
        }),
      });

      if (response.success && response.booking) {
        dispatch(setCurrentBooking(response.booking));
        localStorage.setItem('cv_active_booking_id', response.booking._id);
        // Navigate to payment checkout
        navigate('/checkout');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Seat lock failed. One of the selected seats may have been locked by another user.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-neutral-400 text-sm font-medium tracking-wide">Syncing seat layout...</span>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center p-8 text-white">
        <div className="max-w-md">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold">Showtime not found</h3>
          <p className="text-neutral-500 text-sm mt-2">
            The show details could not be retrieved from the backend.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { screen, price } = show;
  const movieTitle = show.movie?.title || selectedMovie?.title || 'Movie';

  return (
    <div ref={pageRef} className="bg-[#0A0A0A] text-white min-h-screen lg:h-screen lg:overflow-hidden flex flex-col">
      {/* Top Header Rail */}
      <div className="bg-[#121212] border-b border-neutral-900/60 sticky top-0 z-30 select-none flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full border border-neutral-800 bg-[#1A1A1A] flex items-center justify-center text-neutral-450 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={show.movie?.posterUrl}
              alt={movieTitle}
              className="w-10 h-14 object-cover rounded-lg border border-neutral-800 shadow-md hidden sm:block"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">{movieTitle}</h1>
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded">
                  U/A
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                {screen?.theatre?.name} • {screen?.screenNumber} ({screen?.screenType})
              </p>
              <div className="flex items-center gap-4 text-[10px] sm:text-xs text-neutral-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {show.startTime}
                </span>
                <span className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" />
                  {screen?.screenNumber}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-neutral-300 font-extrabold uppercase bg-rose-950/20 border border-rose-500/30 px-4 py-2 rounded-xl flex items-center gap-2 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20 animate-pulse" />
            SHOWTIME: {new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} | {show.startTime}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow overflow-hidden select-none">
        
        {/* Left Column: Legend, Seat grid and Screen */}
        <div className="lg:col-span-8 bg-[#0F0F0F]/30 border border-neutral-900/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden lg:h-[calc(100vh-160px)] min-h-[450px]">
          
          {/* Header row: Legend + Zoom controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-neutral-900 pb-6 flex-shrink-0 animate-fade-in">
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-5 text-[10px] sm:text-xs font-bold text-neutral-450 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border border-neutral-800 bg-[#121212]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-rose-600 shadow-md shadow-rose-600/10" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-600 border border-emerald-600 text-white flex items-center justify-center text-[9px] font-black">✕</div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border border-amber-500/50 bg-[#1E1610] text-amber-500 flex items-center justify-center text-[9px] font-black">✕</div>
                <span>Locked</span>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-[#121212] border border-neutral-850 px-3 py-1.5 rounded-xl text-neutral-450">
              <button 
                onClick={() => setZoom(Math.max(0.7, zoom - 0.1))} 
                className="hover:text-white cursor-pointer select-none text-sm font-black w-5 h-5 flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-extrabold uppercase tracking-wider select-none w-14 text-center">
                Zoom {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(Math.min(1.3, zoom + 0.1))} 
                className="hover:text-white cursor-pointer select-none text-sm font-black w-5 h-5 flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-950/20 border border-rose-800/50 rounded-2xl text-rose-450 text-xs font-semibold flex items-start gap-2.5 max-w-xl mx-auto flex-shrink-0">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seating Grid Map container */}
          <div className="w-full overflow-auto scrollbar-none py-6 flex justify-center items-center flex-grow">
            <div 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
              className="flex flex-col gap-3 select-none"
            >
              {screen?.seatLayout?.map((rowLayout) => (
                <div key={rowLayout.row} className="flex items-center justify-center gap-4">
                  {/* Row Label (Left) */}
                  <div className="w-6 text-[10px] font-extrabold text-neutral-600 text-center uppercase tracking-wider">
                    {rowLayout.row}
                  </div>

                  {/* Seats List */}
                  <div className="flex items-center gap-2.5">
                    {rowLayout.seats.map((seat) => {
                      const label = seat.seatLabel;
                      const isBooked = bookedSeats.includes(label);
                      const isLocked = lockedSeats.includes(label);
                      const isSelected = selectedSeats.includes(label);

                      let seatClass = 'border border-neutral-855 bg-[#121212] hover:border-neutral-500 text-neutral-400 hover:text-white cursor-pointer';
                      if (isBooked) {
                        seatClass = 'bg-emerald-950/30 border border-emerald-900/30 text-emerald-500/40 cursor-not-allowed';
                      } else if (isLocked) {
                        seatClass = 'border border-amber-600/35 bg-[#1C1611] text-amber-600/50 cursor-not-allowed';
                      } else if (isSelected) {
                        seatClass = 'bg-rose-600 border border-rose-600 text-white font-extrabold shadow-lg shadow-rose-600/20 scale-105';
                      }

                      return (
                        <button
                          key={seat._id}
                          disabled={isBooked || isLocked}
                          onClick={() => handleSeatClick(label)}
                          className={`w-8 h-8 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center outline-none ${seatClass}`}
                          title={`Seat ${label} - ${seat.seatType}`}
                        >
                          {isBooked ? '✕' : isLocked ? '✕' : label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Label (Right) */}
                  <div className="w-6 text-[10px] font-extrabold text-neutral-600 text-center uppercase tracking-wider">
                    {rowLayout.row}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purple Screen Indicator (Placed at the bottom) */}
          <div className="w-full max-w-xl mx-auto mt-6 select-none relative flex flex-col items-center flex-shrink-0">
            <img src={screenImg} alt="Screen" className="w-full opacity-60" />
            <p className="text-[9px] text-center text-neutral-555 font-extrabold uppercase tracking-[0.3em] absolute bottom-4">
              All Eyes This Way (Screen)
            </p>
          </div>

          {/* Reference Notice at bottom */}
          <div className="border-t border-neutral-900/60 pt-3 flex items-center justify-center gap-2 text-[10px] text-neutral-550 font-bold select-none flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>This seat layout is for reference only. Actual seat position may vary.</span>
          </div>

        </div>

        {/* Right Column: Sticky Booking Summary sidebar */}
        <div className="lg:col-span-4 lg:h-[calc(100vh-160px)] min-h-[450px]">
          <div className="bg-[#121212]/50 border border-neutral-900 bg-gradient-to-b from-[#121212]/80 to-[#0A0A0A]/80 rounded-3xl p-6 flex flex-col justify-between h-full overflow-hidden select-none">
            
            <div className="space-y-1 flex-shrink-0">
              <h2 className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest">Booking Summary</h2>
            </div>

            {/* Movie Info card layout */}
            <div className="flex gap-4 bg-[#181818]/60 p-4 border border-neutral-855 rounded-2xl flex-shrink-0 mt-4">
              <img 
                src={show.movie?.posterUrl} 
                alt={movieTitle} 
                className="w-12 h-16 object-cover rounded-lg shadow-md border border-neutral-800"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-neutral-100 leading-snug">{movieTitle}</h3>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-extrabold">
                  {screen?.screenNumber} ({screen?.screenType})
                </p>
              </div>
            </div>

            {/* Scrollable details segment */}
            <div className="flex-grow overflow-y-auto py-4 space-y-4 scrollbar-none">
              {/* Details list */}
              <div className="space-y-3 font-bold text-xs text-neutral-400">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{show.startTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>Screen {screen?.screenNumber}</span>
                </div>
              </div>

              {/* Selected seats badges */}
              <div className="space-y-2 border-t border-neutral-900/60 pt-4">
                <h4 className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">Selected Seats</h4>
                {selectedSeats.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto scrollbar-none">
                    {selectedSeats.map((s) => (
                      <span 
                        key={s} 
                        className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg shadow-md shadow-rose-600/10 transition-all hover:scale-105"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-semibold italic text-neutral-600">No seats selected yet</p>
                )}
              </div>
            </div>

            {/* Price Details breakdown */}
            <div className="space-y-3 border-t border-neutral-900/60 pt-4 font-semibold text-xs flex-shrink-0">
              <h4 className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">Price Details</h4>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Ticket Price {selectedSeats.length > 0 && `(${selectedSeats.length})`}</span>
                <span className="font-bold">
                  {selectedSeats.length > 0 ? `₹${show.price} × ${selectedSeats.length}` : `₹0`}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Convenience Fee</span>
                <span className="font-bold">₹{selectedSeats.length > 0 ? '40' : '0'}</span>
              </div>
            </div>

            {/* Total and CTA block */}
            <div className="space-y-4 border-t border-neutral-900/60 pt-4 flex-shrink-0">
              <div className="flex justify-between items-center select-none">
                <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Total Amount</span>
                <span className="text-xl font-black text-rose-500">
                  ₹{selectedSeats.length > 0 ? (totalAmount + 40) : 0}
                </span>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={submitting || selectedSeats.length === 0}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-lg shadow-rose-600/10 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {!isAuthenticated ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to Book
                  </>
                ) : submitting ? (
                  'Locking Seats...'
                ) : (
                  <>
                    Continue to Pay
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[9px] text-neutral-550 font-bold uppercase tracking-wider select-none">
                <Lock className="w-3.5 h-3.5" />
                <span>100% Secure Payments</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SeatSelection;
