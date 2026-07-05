import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Play, Sparkles, User, Mail, CreditCard, ArrowRight, Tv, HelpCircle, Film } from 'lucide-react';
import { movieService } from '../services/movieService';
import gsap from 'gsap';

const StreamBooking = () => {
  const { id: movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [purchaseType, setPurchaseType] = useState('Rent'); // Rent or Buy
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = Checkout, 2 = Payment, 3 = Movie Player
  const [paymentMsg, setPaymentMsg] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMovie = async () => {
      try {
        const res = await movieService.getMovieById(movieId);
        if (isMounted && res.movie) {
          setMovie(res.movie);
        }
      } catch (err) {
        console.error('Failed to load movie for stream checkout:', err);
      }
    };
    fetchMovie();
    return () => { isMounted = false; };
  }, [movieId]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [step]);

  const handleStartPayment = (e) => {
    e.preventDefault();
    setStep(2);
    
    // Simulate beautiful payment gateway workflow
    const steps = [
      'Contacting secure banking servers...',
      'Authorizing test Razorpay payload...',
      'Activating dynamic streaming access token...',
      'Payment verified. Stream activated!',
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

  if (!movie) {
    return (
      <div className="bg-[#0A0A0A] text-white min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xs text-neutral-500 font-bold uppercase tracking-widest">
          Loading Movie Details...
        </div>
      </div>
    );
  }

  const getPrice = () => (purchaseType === 'Rent' ? 120 : 399);

  return (
    <div ref={containerRef} className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8 flex items-center justify-center">
      
      {step === 1 && (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          {/* Left panel form checkout */}
          <div className="lg:col-span-3 bg-[#121212] border border-neutral-850 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-rose-600" />
            
            <div className="flex gap-4">
              <img src={movie.image} alt={movie.title} className="w-20 aspect-[2/3] object-cover rounded-xl border border-neutral-850" />
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500">CINEVERSE STREAMING</span>
                <h1 className="text-xl font-black text-neutral-100 tracking-tight leading-tight">{movie.title}</h1>
                <p className="text-xs text-neutral-500 font-medium">⭐ {movie.rating?.toFixed(1) || '7.5'} • {movie.language}</p>
              </div>
            </div>

            <form onSubmit={handleStartPayment} className="space-y-5 text-xs font-semibold text-neutral-450 pt-4 border-t border-neutral-900">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Choose Stream Option</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPurchaseType('Rent')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    purchaseType === 'Rent'
                      ? 'bg-neutral-900 border-rose-600 text-white'
                      : 'bg-neutral-950 border-neutral-900 hover:border-neutral-850 text-neutral-450'
                  }`}
                >
                  <span className="uppercase text-[9px] tracking-wider font-extrabold text-neutral-500">Rent Movie</span>
                  <span className="text-lg font-black text-rose-500 mt-1">₹120</span>
                  <span className="text-[9px] text-neutral-500 mt-1 font-medium">Valid for 30 days once purchased</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseType('Buy')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    purchaseType === 'Buy'
                      ? 'bg-neutral-900 border-rose-600 text-white'
                      : 'bg-neutral-950 border-neutral-900 hover:border-neutral-850 text-neutral-450'
                  }`}
                >
                  <span className="uppercase text-[9px] tracking-wider font-extrabold text-neutral-500">Buy Movie</span>
                  <span className="text-lg font-black text-rose-500 mt-1">₹399</span>
                  <span className="text-[9px] text-neutral-500 mt-1 font-medium">Keep forever in your Cineverse library</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Email Address for Stream Activation</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 pl-10 pr-4 text-neutral-200 outline-none"
                  />
                  <Mail className="w-4 h-4 text-neutral-600 absolute left-3 top-3.5" />
                </div>
                <p className="text-[10px] text-neutral-600 font-medium">We will email your activation token and receipt.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2 active:scale-98"
              >
                Buy Stream Access (₹{getPrice()})
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right panel summary */}
          <div className="lg:col-span-2 bg-[#121212]/40 border border-neutral-900 p-6 rounded-3xl h-fit space-y-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-300">Streaming Details</h2>
            
            <div className="space-y-4 text-xs font-medium text-neutral-450">
              <div className="flex gap-3">
                <Tv className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <p className="leading-normal">Watch in HD (1080p) or Ultra HD (4K) on any laptop, tablet, or Smart TV.</p>
              </div>
              <div className="flex gap-3">
                <Film className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <p className="leading-normal">Supported audio includes 5.1 Surround Sound and Dolby Atmos.</p>
              </div>
            </div>

            <div className="flex gap-2 bg-neutral-950 p-4 border border-neutral-900 rounded-2xl text-[10px] text-neutral-500 font-semibold items-start">
              <CreditCard className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p>Simulated payments check. Activating stream works directly on successful verification.</p>
            </div>
          </div>

        </div>
      )}

      {step === 2 && (
        <div className="max-w-md w-full bg-[#121212] border border-neutral-850 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-600" />
          
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-neutral-900" />
            <div className="absolute inset-0 rounded-full border-4 border-rose-600 border-t-transparent animate-spin" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold tracking-wider uppercase text-neutral-250">Activating Access</h2>
            <p className="text-xs text-neutral-500 font-semibold italic">{paymentMsg || 'Processing...'}</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-4xl space-y-6">
          {/* Header info */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">Active Stream</span>
                <span className="text-[10px] text-neutral-550 font-bold uppercase">{purchaseType === 'Rent' ? 'Rental Access' : 'Ownership Access'}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{movie.title}</h2>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="px-4 py-2 bg-neutral-900 border border-neutral-850 hover:border-neutral-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Back to catalog
            </button>
          </div>

          {/* Interactive Player Mockup */}
          <div className="relative aspect-video w-full bg-neutral-950 border border-neutral-850 rounded-3xl overflow-hidden shadow-2xl group flex flex-col justify-end">
            
            {isPlaying ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#0A0A0A]">
                {/* Simulated playback visual */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-rose-650/15 animate-ping" />
                  <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-lg">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-extrabold text-neutral-300 mt-6 tracking-wider uppercase">Streaming in Ultra HD 4K</h3>
                <p className="text-xs text-neutral-550 mt-1 font-semibold">Cineverse DRM Protected Stream Player</p>
              </div>
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: `url(${movie.bannerImage})` }}
              >
                <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-4">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="w-20 h-20 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <Play className="w-8 h-8 text-white fill-white ml-1.5" />
                  </button>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-300">Click to Play Digital Stream</p>
                </div>
              </div>
            )}

            {/* Playback Controls */}
            {isPlaying && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 to-black/0 p-6 space-y-4 z-10">
                {/* Progress bar */}
                <div className="relative h-1 w-full bg-white/20 rounded-full cursor-pointer overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-rose-600 rounded-full" />
                </div>
                
                <div className="flex justify-between items-center text-xs font-semibold text-neutral-400">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsPlaying(false)}
                      className="hover:text-white transition-colors text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      Pause
                    </button>
                    <span>0:45:12 / 2:18:00</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Audio: English (Dolby Atmos)</span>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Subtitles: Eng (CC)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StreamBooking;
