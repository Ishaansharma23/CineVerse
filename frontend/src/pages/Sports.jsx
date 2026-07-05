import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Sparkles, Trophy, Play } from 'lucide-react';
import { useTrailer } from '../context/TrailerContext';
import gsap from 'gsap';

const sportsMatches = [
  { id: 1, eventName: 'India vs Pakistan - ICC T20 World Cup', sport: 'Cricket', date: 'Sunday, 12 Jul', venue: 'Cineverse Premiere IMAX (Live Screening)', price: 350 },
  { id: 2, eventName: 'Formula 1 British Grand Prix - Race Day', sport: 'Motorsport', date: 'Sunday, 5 Jul', venue: 'Cineverse Screen 2 (Live Screening)', price: 200 },
  { id: 3, eventName: 'UEFA Champions League Final - Real Madrid vs Man City', sport: 'Football', date: 'Saturday, 18 Jul', venue: 'Cineverse Audi 1 (Live Screening)', price: 250 },
];

const Sports = () => {
  const { playTrailer } = useTrailer();

  useEffect(() => {
    gsap.fromTo(
      '.sport-card',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, []);

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Title */}
        <div className="border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cineverse Sports</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Live Sports Screenings</h1>
          <p className="text-neutral-500 text-sm mt-1">Experience the stadium atmosphere on the giant screens with high-fidelity sound</p>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sportsMatches.map((match) => (
            <div
              key={match.id}
              className="sport-card bg-[#121212]/40 border border-neutral-900 hover:border-neutral-850 p-6 rounded-2xl flex flex-col justify-between gap-6 transition-colors"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-rose-650/10 border border-rose-600/20 text-rose-500 font-extrabold text-[9px] tracking-wider uppercase rounded">
                    {match.sport}
                  </span>
                  <span className="text-xs text-neutral-450 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    {match.date}
                  </span>
                </div>
                
                <h3 className="font-extrabold text-base sm:text-md text-neutral-100 line-clamp-2 leading-snug">
                  {match.eventName}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-semibold">
                  <MapPin className="w-4 h-4 text-neutral-600" />
                  <span>{match.venue}</span>
                </div>

                {/* Inline Promo Player button */}
                <button
                  onClick={() => playTrailer('')}
                  className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-500 hover:text-rose-455 transition-colors cursor-pointer mt-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Match Promo
                </button>
              </div>

              {/* Price and Action */}
              <div className="flex justify-between items-center border-t border-neutral-900/60 pt-4">
                <div>
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-wider block">Seat Passes</span>
                  <p className="font-black text-rose-500 text-base">₹{match.price}</p>
                </div>
                
                <Link
                  to={`/book/event/sport-${match.id}`}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-rose-600/5 cursor-pointer text-center"
                >
                  Book Pass
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sports;
