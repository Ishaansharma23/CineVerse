import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, MapPin, Calendar, Camera, Play, Ticket, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import request from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const TicketScanner = () => {
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false);
  const [cameraStatusMsg, setCameraStatusMsg] = useState('');

  const containerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const handleVerify = async (bookingIdToVerify) => {
    const targetId = bookingIdToVerify || bookingIdInput.trim();
    if (!targetId) {
      toast.error('Please enter or scan a valid Booking Reference ID.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setScanResult(null);

    try {
      const res = await request('/bookings/verify', {
        method: 'POST',
        body: JSON.stringify({ bookingId: targetId }),
      });

      if (res.success) {
        setScanResult({
          status: 'allowed',
          message: 'Entry Allowed',
          booking: res.booking,
        });
        toast.success('Ticket Verified! Entry Allowed.');
        // Animate success card
        setTimeout(() => {
          if (panelRef.current) {
            gsap.fromTo(
              panelRef.current,
              { scale: 0.95, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.1)' }
            );
          }
        }, 50);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed.');
      toast.error(err.message || 'Ticket is not valid for entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulatedCamera = () => {
    setIsSimulatingCamera(true);
    setCameraStatusMsg('Initializing lens check...');

    setTimeout(() => setCameraStatusMsg('Position barcode inside screen limits...'), 800);
    setTimeout(() => setCameraStatusMsg('Focusing scanner lens...'), 1500);
    setTimeout(() => {
      // Mock scan of a random ticket from database logs, or user input
      setCameraStatusMsg('Decoding code...');
      setTimeout(() => {
        setIsSimulatingCamera(false);
        setBookingIdInput('CV-EVT-958210');
        handleVerify('CV-EVT-958210');
      }, 800);
    }, 2200);
  };

  return (
    <div ref={containerRef} className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Page title */}
        <div className="text-center space-y-1.5 border-b border-neutral-900 pb-5">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 text-rose-600 animate-pulse" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cineverse Gate Check-In</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Theatre QR Verification</h1>
          <p className="text-neutral-500 text-sm mt-1">Scan or input customer booking codes to verify screening validation parameters</p>
        </div>

        {/* Action Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form input details */}
          <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Scan Input Controller</h2>
            
            {isSimulatingCamera ? (
              <div className="aspect-[4/3] bg-neutral-950 rounded-xl border border-rose-900/30 flex flex-col items-center justify-center p-4 text-center space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 border border-rose-500/20 animate-pulse" />
                <div className="relative w-12 h-12">
                  <Camera className="w-12 h-12 text-rose-600 animate-bounce" />
                </div>
                <p className="text-[10px] text-neutral-450 font-bold uppercase tracking-widest">{cameraStatusMsg}</p>
                <button
                  onClick={() => setIsSimulatingCamera(false)}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 rounded text-[9px] uppercase tracking-wider text-neutral-500 font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold text-neutral-450">
                <div className="space-y-1.5">
                  <label className="uppercase tracking-wider">Booking ID / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CV-EVT-958210"
                    value={bookingIdInput}
                    onChange={(e) => setBookingIdInput(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 font-mono outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleVerify()}
                    disabled={loading}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Verify Code
                  </button>

                  <button
                    onClick={handleStartSimulatedCamera}
                    className="p-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-750 text-neutral-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                    title="Simulate Camera QR Reader"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Verification Results Output Panel */}
          <div className="bg-[#121212]/40 border border-neutral-900 p-6 rounded-2xl shadow-xl flex flex-col justify-center min-h-[220px]">
            {scanResult ? (
              <div ref={panelRef} className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">
                    {scanResult.message}
                  </span>
                  <h3 className="text-base font-extrabold text-neutral-200 mt-2">Check-In Successful</h3>
                  <p className="text-[10px] text-neutral-500 font-mono">Reference: {scanResult.booking.bookingId}</p>
                </div>
                
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-900 text-left text-[11px] text-neutral-450 font-semibold space-y-1.5">
                  <p>Movie/Event: <span className="text-neutral-200 font-bold">{scanResult.booking.show ? 'Cinema Movie' : 'Live Event'}</span></p>
                  <p>Booked Seats: <span className="text-neutral-200 font-bold">{scanResult.booking.seats?.join(', ') || 'General Pass'}</span></p>
                  <p>Checked In: <span className="text-neutral-400">{new Date().toLocaleTimeString()}</span></p>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-rose-600/10 border border-rose-650/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] bg-rose-600/10 border border-rose-650/20 text-rose-500 px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">
                    Verification Failed
                  </span>
                  <h3 className="text-base font-extrabold text-neutral-200 mt-2">Entry Refused</h3>
                  <p className="text-[11px] text-neutral-500 leading-normal max-w-xs mx-auto">{errorMsg}</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2.5">
                <Ticket className="w-10 h-10 text-neutral-700 mx-auto" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Awaiting check-in scan</h3>
                <p className="text-[11px] text-neutral-600 max-w-[200px] mx-auto leading-normal">
                  Input a ticket reference or start simulated camera to begin verification.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketScanner;
