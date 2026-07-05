import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, MapPin, Printer, ArrowRight, CircleAlert, Sparkles, User, Mail, CreditCard, ChevronRight } from 'lucide-react';
import { events } from '../utils/Constants';
import gsap from 'gsap';

const playsList = [
  { id: 1, title: 'Hamlet - The Prince of Denmark', language: 'English', duration: '120 min', venue: 'Academy of Fine Arts, Kolkata', price: 250, rating: '4.8', category: 'Play' },
  { id: 2, title: 'Bisharjan - Rabindranath Tagore Classic', language: 'Bengali', duration: '90 min', venue: 'Rabindra Sadan, Kolkata', price: 150, rating: '4.9', category: 'Play' },
  { id: 3, title: 'The Mousetrap - Agatha Christie', language: 'English', duration: '110 min', venue: 'Gyan Manch, Kolkata', price: 300, rating: '4.7', category: 'Play' },
  { id: 4, title: 'Court Martial - Social Drama Act', language: 'Hindi', duration: '100 min', venue: 'Kala Mandir, Kolkata', price: 200, rating: '4.6', category: 'Play' },
];

const sportsMatches = [
  { id: 1, title: 'India vs Pakistan - ICC T20 World Cup', date: 'Sunday, 12 Jul', venue: 'Cineverse Premiere IMAX (Live Screening)', price: 350, category: 'Sport' },
  { id: 2, title: 'Formula 1 British Grand Prix - Race Day', date: 'Sunday, 5 Jul', venue: 'Cineverse Screen 2 (Live Screening)', price: 200, category: 'Sport' },
  { id: 3, title: 'UEFA Champions League Final - Real Madrid vs Man City', date: 'Saturday, 18 Jul', venue: 'Cineverse Audi 1 (Live Screening)', price: 250, category: 'Sport' },
];

const EventBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tier, setTier] = useState('Premium');
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '' });
  const [step, setStep] = useState(1); // 1 = Details, 2 = Payment processing, 3 = Confirmed Ticket
  const [paymentMsg, setPaymentMsg] = useState('');
  const [bookingRef, setBookingRef] = useState('');

  const containerRef = useRef(null);
  const ticketRef = useRef(null);

  // Load target event/play/sport details
  useEffect(() => {
    let details = null;
    if (id.startsWith('event-')) {
      const idx = parseInt(id.replace('event-', ''), 10);
      const matched = events[idx];
      if (matched) {
        details = {
          title: matched.title,
          category: matched.subtitle || 'Live Event',
          venue: 'Cineverse Premiere Arena, Kolkata',
          date: 'Saturday, 11 Jul at 07:00 PM',
          price: 499,
        };
      }
    } else if (id.startsWith('play-')) {
      const playId = parseInt(id.replace('play-', ''), 10);
      const matched = playsList.find(p => p.id === playId);
      if (matched) {
        details = {
          title: matched.title,
          category: `Play (${matched.language})`,
          venue: matched.venue,
          date: 'Friday, 10 Jul at 06:30 PM',
          price: matched.price,
        };
      }
    } else if (id.startsWith('sport-')) {
      const sportId = parseInt(id.replace('sport-', ''), 10);
      const matched = sportsMatches.find(s => s.id === sportId);
      if (matched) {
        details = {
          title: matched.title,
          category: `Live Sports Screening`,
          venue: matched.venue,
          date: `${matched.date} at 08:00 PM`,
          price: matched.price,
        };
      }
    }

    if (details) {
      setEventData(details);
    } else {
      // General fallback
      setEventData({
        title: 'Cineverse Special Experience',
        category: 'Entertainment',
        venue: 'Cineverse Arena',
        date: 'Sunday, 12 Jul at 06:00 PM',
        price: 200,
      });
    }
  }, [id]);

  // Pricing formula
  const getBasePrice = () => {
    if (!eventData) return 0;
    if (tier === 'VIP') return eventData.price + 300;
    if (tier === 'Premium') return eventData.price + 100;
    return eventData.price;
  };

  const getSubtotal = () => getBasePrice() * quantity;
  const getGST = () => Math.round(getSubtotal() * 0.18);
  const getTotal = () => getSubtotal() + getGST();

  const handleStartPayment = (e) => {
    e.preventDefault();
    setStep(2);
    setBookingRef('CV-EVT-' + Math.floor(100000 + Math.random() * 900000));
    
    // Simulate beautiful payment gateway workflow
    const steps = [
      'Contacting secure banking servers...',
      'Authorizing test Razorpay payload...',
      'Locking event slot passes...',
      'Booking finalized successfully!',
    ];

    steps.forEach((msg, idx) => {
      setTimeout(() => {
        setPaymentMsg(msg);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setStep(3);
          }, 1000);
        }
      }, idx * 1200);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (step === 3 && ticketRef.current) {
      gsap.fromTo(
        ticketRef.current,
        { opacity: 0, scale: 0.95, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.1)' }
      );
    }
  }, [step]);

  if (!eventData) return null;

  return (
    <div ref={containerRef} className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8 flex items-center justify-center">
      
      {step === 1 && (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left Panel: Pass selection options */}
          <div className="lg:col-span-3 bg-[#121212] border border-neutral-850 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-rose-600" />
            
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500">{eventData.category}</span>
              <h1 className="text-2xl font-black text-neutral-100 tracking-tight leading-tight">{eventData.title}</h1>
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-neutral-600 animate-pulse" />
                {eventData.venue}
              </p>
            </div>

            <form onSubmit={handleStartPayment} className="space-y-5 text-xs font-semibold text-neutral-450 pt-2 border-t border-neutral-900">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Choose Passes Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Passes Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Seat Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  >
                    <option value="General">General Admission</option>
                    <option value="Premium">Premium Seat (+₹100)</option>
                    <option value="VIP">VIP Front Row Seat (+₹300)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-neutral-900">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Buyer Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={buyerInfo.name}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                        className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 pl-10 pr-4 text-neutral-200 outline-none"
                      />
                      <User className="w-4 h-4 text-neutral-600 absolute left-3 top-3.5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={buyerInfo.email}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                        className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 pl-10 pr-4 text-neutral-200 outline-none"
                      />
                      <Mail className="w-4 h-4 text-neutral-600 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 mt-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Panel: Booking Summary */}
          <div className="lg:col-span-2 bg-[#121212]/40 border border-neutral-900 p-6 rounded-3xl h-fit space-y-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-300">Bill Summary</h2>
            
            <div className="space-y-3.5 text-xs text-neutral-400 font-semibold border-b border-neutral-900 pb-4">
              <div className="flex justify-between">
                <span>Pass Tier ({tier})</span>
                <span className="text-neutral-200">₹{getBasePrice()}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity</span>
                <span className="text-neutral-200">x{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-neutral-200">₹{getSubtotal()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span className="text-neutral-200">₹{getGST()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-extrabold text-neutral-300">
              <span>Total Payable Amount</span>
              <span className="text-rose-500 text-lg">₹{getTotal()}</span>
            </div>

            <div className="flex gap-2.5 items-start bg-neutral-950 p-4 border border-neutral-900 rounded-2xl text-[10px] text-neutral-500 font-medium">
              <CreditCard className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p>Simulated secure gateway transactions. Cards checkout supports mock auth validations.</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-md w-full bg-[#121212] border border-neutral-850 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-600" />
          
          {/* Animated Spinner */}
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-neutral-900" />
            <div className="absolute inset-0 rounded-full border-4 border-rose-600 border-t-transparent animate-spin" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold tracking-wider uppercase text-neutral-250">Processing Order</h2>
            <p className="text-xs text-neutral-500 font-semibold italic">{paymentMsg || 'Connecting...'}</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-lg space-y-6">
          {/* Confirmed Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Pass Booking Finalized!</span>
            </div>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-neutral-800 hover:border-neutral-750 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Pass
            </button>
          </div>

          {/* Ticket View */}
          <div ref={ticketRef} className="bg-[#121212] border border-neutral-850 rounded-3xl overflow-hidden shadow-2xl relative select-none">
            {/* Header branding */}
            <div className="bg-gradient-to-r from-neutral-950 to-neutral-900 border-b border-neutral-850 px-6 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black tracking-widest text-neutral-200">CINEVERSE</h2>
                <p className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">{eventData.category} VIP Pass</p>
              </div>
              <Sparkles className="w-5 h-5 text-rose-500" />
            </div>

            {/* Event core info */}
            <div className="p-6 space-y-6 border-b border-dashed border-neutral-850">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Event Title</span>
                <h3 className="text-xl font-extrabold text-neutral-100 tracking-tight leading-tight">{eventData.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-neutral-450">
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-550 font-extrabold uppercase tracking-wider block">Date & Time</span>
                  <div className="flex items-center gap-1 text-neutral-300">
                    <Calendar className="w-4 h-4 text-neutral-600" />
                    <span>{eventData.date}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-550 font-extrabold uppercase tracking-wider block">Quantity / Tier</span>
                  <p className="text-neutral-300">{quantity}x passes ({tier})</p>
                </div>
              </div>

              <div className="space-y-1 text-xs font-semibold text-neutral-450">
                <span className="text-[10px] text-neutral-550 font-extrabold uppercase tracking-wider block">Venue</span>
                <div className="flex items-center gap-1 text-neutral-300">
                  <MapPin className="w-4 h-4 text-neutral-600" />
                  <span>{eventData.venue}</span>
                </div>
              </div>
            </div>

            {/* Ticket receipt scan part */}
            <div className="p-6 bg-gradient-to-b from-neutral-900/40 to-neutral-950/20 grid grid-cols-1 sm:grid-cols-5 gap-6 items-center">
              <div className="sm:col-span-3 space-y-3.5 text-xs text-neutral-450 font-semibold">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-neutral-550 font-extrabold uppercase block">Booking Reference</span>
                  <p className="font-mono text-neutral-200 text-sm font-extrabold">{bookingRef}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-neutral-550 font-extrabold uppercase block">Holder Details</span>
                  <p className="text-neutral-300">{buyerInfo.name}</p>
                  <p className="text-[10px] text-neutral-500 font-medium">{buyerInfo.email}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-neutral-550 font-extrabold uppercase block">Total Value Paid</span>
                  <p className="text-rose-500 font-black text-base">₹{getTotal()}</p>
                </div>
              </div>

              {/* QR Code Code section */}
              <div className="sm:col-span-2 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-neutral-200 shadow-md">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CineverseBookingRef:CV-EVT-958210" 
                  alt="Entry Scan QR" 
                  className="w-24 h-24"
                />
                <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider mt-2">Scan at Entry Gate</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            Back to Home
          </button>
        </div>
      )}

    </div>
  );
};

export default EventBooking;
