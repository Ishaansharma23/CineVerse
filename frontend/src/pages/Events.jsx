import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { events } from '../utils/Constants';
import { MapPin, Sparkles, Play } from 'lucide-react';
import { useTrailer } from '../context/TrailerContext';
import gsap from 'gsap';

const Events = () => {
  const { playTrailer } = useTrailer();

  useEffect(() => {
    gsap.fromTo(
      '.event-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
    );
  }, []);

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Title */}
        <div className="border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cineverse Events</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Live Events & Experiences</h1>
          <p className="text-neutral-500 text-sm mt-1">From comedy gigs to amusement parks, discover the best of offline events near you</p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {events.map((event, index) => (
            <div
              key={index}
              className="event-card group bg-[#121212]/40 border border-neutral-900 hover:border-neutral-850 rounded-2xl overflow-hidden p-2.5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Event poster with Play Teaser Overlay */}
                <div 
                  onClick={() => playTrailer('')} // Empty string triggers Dolby/IMAX cinematic intro fallback!
                  className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-950 relative cursor-pointer"
                  title="Hover to show promo trailer sign"
                >
                  {event.img ? (
                    <img
                      src={event.img}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-600">
                      No Image
                    </div>
                  )}

                  {/* Play Teaser Sign */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity duration-300">
                    <div className="w-9 h-9 bg-white/10 hover:bg-white border border-white/20 hover:border-white text-white hover:text-black rounded-full flex items-center justify-center shadow-lg transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-white bg-black/40 px-1.5 py-0.5 rounded">Play Promo</span>
                  </div>

                  {/* Overlay details */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/5 text-neutral-300 font-bold text-[9px] px-2 py-0.5 rounded tracking-wide">
                    {event.subtitle}
                  </div>
                </div>

                {/* Text Info */}
                <div className="mt-1 px-1.5 space-y-1">
                  <h3 className="font-extrabold text-xs sm:text-sm text-neutral-100 group-hover:text-rose-500 line-clamp-1 transition-colors uppercase tracking-tight">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    <MapPin className="w-3 h-3 text-neutral-600" />
                    <span>Kolkata</span>
                  </div>
                </div>
              </div>

              {/* Book tickets link button */}
              <div className="mt-4 pt-3 border-t border-neutral-900/60 px-1.5">
                <Link
                  to={`/book/event/event-${index}`}
                  className="block w-full py-2 bg-[#1A1A1A] hover:bg-rose-600 border border-neutral-800 hover:border-rose-600 text-center text-white text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                >
                  Book Tickets
                </Link>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
