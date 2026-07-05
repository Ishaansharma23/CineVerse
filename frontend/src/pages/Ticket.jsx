import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../services/api';
import { ShieldCheck, Calendar, MapPin, Printer, ArrowRight, CircleAlert, Download } from 'lucide-react';
import gsap from 'gsap';

const Ticket = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const ticketRef = useRef(null);
  const stampRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await request(`/bookings/${bookingId}`);
        if (isMounted && data.booking) {
          setBooking(data.booking);
        }
      } catch (err) {
        console.error('Failed to load ticket booking details:', err);
        setErrorMsg('Failed to load ticket details. Make sure you are authorized.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBooking();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  // Entrance animations for ticket and confirmation stamp
  useEffect(() => {
    if (!loading && booking && ticketRef.current) {
      // Animate the ticket box slide down
      gsap.fromTo(
        ticketRef.current,
        { opacity: 0, y: -40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.2)' }
      );

      // Animate stamp slap effect
      if (stampRef.current) {
        gsap.fromTo(
          stampRef.current,
          { opacity: 0, scale: 3, rotation: -20 },
          { opacity: 0.85, scale: 1, rotation: -12, duration: 0.5, delay: 0.6, ease: 'bounce.out' }
        );
      }
    }
  }, [loading, booking]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Standard window.open bypasses cors/auth header issues since it triggers file download dialog on server response
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    window.open(`${apiUrl}/bookings/${bookingId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-neutral-400 text-sm font-medium tracking-wide">Generating your ticket receipt...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !booking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center p-8 text-white">
        <div className="max-w-md">
          <CircleAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold">Ticket not found</h3>
          <p className="text-neutral-500 text-sm mt-2">
            {errorMsg || 'The booking details could not be retrieved.'}
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

  const { show, seats, totalAmount, bookingId: code, ticketQr } = booking;
  const movie = show?.movie || {};
  const screen = show?.screen || {};
  const theatre = screen?.theatre || {};

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-16 px-4 print:bg-white print:text-black">
      <div className="max-w-xl mx-auto space-y-6 print:space-y-0">
        
        {/* Top Actions: Header Controls */}
        <div className="flex justify-between items-center print:hidden select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Booking Confirmed</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-500" />
              Download PDF
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-rose-600/10 cursor-pointer"
            >
              Home
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ticket receipt container */}
        <div
          ref={ticketRef}
          className="bg-[#121212] border border-neutral-850 rounded-3xl overflow-hidden shadow-2xl relative print:border-none print:shadow-none print:bg-white"
        >
          {/* Confirmed Stamp Overlay */}
          <div
            ref={stampRef}
            className="absolute top-6 right-6 border-[3px] border-emerald-500/80 text-emerald-500/90 font-black text-[10px] tracking-[0.2em] px-3.5 py-1.5 rounded-lg select-none print:border-black print:text-black uppercase"
          >
            CONFIRMED
          </div>

          {/* Ticket Header (Movie Details) */}
          <div className="p-6 md:p-8 bg-[#181818] border-b border-neutral-900 print:bg-neutral-100 print:border-neutral-200">
            <div className="flex gap-5">
              <img
                src={movie.posterUrl || movie.image}
                alt={movie.title}
                className="w-16 sm:w-20 aspect-[2/3] object-cover rounded-xl border border-neutral-800 print:border-neutral-300"
              />
              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-100 print:text-black">
                  {movie.title}
                </h2>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-neutral-400 print:text-neutral-600">
                  <span className="uppercase">{movie.language}</span>
                  <span>•</span>
                  <span>{show.screen?.screenType || '2D'}</span>
                  {movie.runtime && (
                    <>
                      <span>•</span>
                      <span>{movie.runtime}m</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  ID: {code}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Body (Show Details & Seats) */}
          <div className="p-6 md:p-8 space-y-6 md:space-y-8">
            <div className="grid grid-cols-2 gap-6 border-b border-neutral-900/60 pb-6 print:border-neutral-200 print:pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400 print:text-neutral-600" />
                  Date & Time
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-neutral-200 print:text-black">
                  {new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[11px] sm:text-xs text-neutral-400 font-semibold print:text-neutral-600">
                  {show.startTime}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 print:text-neutral-600" />
                  Cinema Theatre
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-neutral-200 print:text-black">
                  {theatre.name}
                </p>
                <p className="text-[11px] sm:text-xs text-neutral-400 font-semibold print:text-neutral-600">
                  {screen.screenNumber}
                </p>
              </div>
            </div>

            {/* Seat selection summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/40 border border-neutral-900 px-5 py-4 rounded-2xl print:bg-neutral-50 print:border-neutral-200">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Reserved Seats</p>
                <div className="flex flex-wrap gap-1.5">
                  {seats.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-rose-600/10 border border-rose-600/20 text-rose-500 text-xs font-extrabold rounded-md print:bg-neutral-200 print:border-neutral-300 print:text-black">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-left sm:text-right">
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Amount Paid</p>
                <p className="text-lg font-black text-rose-500 print:text-black">₹{totalAmount}</p>
              </div>
            </div>

            {/* Ticket QR Validation Code */}
            {ticketQr && (
              <div className="flex flex-col items-center justify-center pt-2 space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-inner inline-block border border-neutral-200">
                  <img src={ticketQr} alt="Ticket QR" className="w-36 h-36" />
                </div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-center select-none print:text-neutral-600">
                  Scan at the auditorium door for entry
                </p>
              </div>
            )}
          </div>

          {/* Ticket edge notch aesthetics */}
          <div className="absolute left-0 bottom-[240px] -translate-x-1/2 w-6 h-6 rounded-full bg-[#0A0A0A] border-r border-neutral-850 print:hidden" />
          <div className="absolute right-0 bottom-[240px] translate-x-1/2 w-6 h-6 rounded-full bg-[#0A0A0A] border-l border-neutral-850 print:hidden" />
        </div>
      </div>
    </div>
  );
};

export default Ticket;
