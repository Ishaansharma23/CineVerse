import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Ticket, Award, Play } from 'lucide-react';
import { useTrailer } from '../context/TrailerContext';
import gsap from 'gsap';

const playsList = [
  { id: 1, title: 'Hamlet - The Prince of Denmark', language: 'English', duration: '120 min', venue: 'Academy of Fine Arts, Kolkata', price: 250, rating: '4.8' },
  { id: 2, title: 'Bisharjan - Rabindranath Tagore Classic', language: 'Bengali', duration: '90 min', venue: 'Rabindra Sadan, Kolkata', price: 150, rating: '4.9' },
  { id: 3, title: 'The Mousetrap - Agatha Christie', language: 'English', duration: '110 min', venue: 'Gyan Manch, Kolkata', price: 300, rating: '4.7' },
  { id: 4, title: 'Court Martial - Social Drama Act', language: 'Hindi', duration: '100 min', venue: 'Kala Mandir, Kolkata', price: 200, rating: '4.6' },
];

const Plays = () => {
  const { playTrailer } = useTrailer();

  useEffect(() => {
    gsap.fromTo(
      '.play-card',
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
            <Award className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cineverse Plays</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Theatre Plays & Art Acts</h1>
          <p className="text-neutral-500 text-sm mt-1">Experience live performance art, dramatic adaptions, and classical theatre</p>
        </div>

        {/* Plays Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {playsList.map((play) => (
            <div
              key={play.id}
              className="play-card group bg-[#121212]/40 border border-neutral-900 hover:border-neutral-850 p-6 rounded-2xl flex flex-col sm:flex-row justify-between gap-6 transition-colors relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-650/10 border border-rose-600/20 text-rose-500 font-extrabold text-[9px] tracking-wider uppercase rounded">
                    Theatre Act
                  </span>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    {play.language} • {play.duration}
                  </span>
                </div>
                
                <h3 className="font-extrabold text-base sm:text-lg text-neutral-100">{play.title}</h3>
                
                <div className="flex items-center gap-2 text-xs text-neutral-450 font-medium">
                  <MapPin className="w-4 h-4 text-neutral-600" />
                  <span>{play.venue}</span>
                </div>

                {/* Inline Promo Player button */}
                <button
                  onClick={() => playTrailer('')}
                  className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-500 hover:text-rose-455 transition-colors cursor-pointer mt-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Stage Promo
                </button>
              </div>

              {/* Price and Ticket booking button */}
              <div className="flex sm:flex-col justify-between items-center sm:items-end flex-shrink-0 gap-4 border-t sm:border-t-0 border-neutral-900 pt-4 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-wider">Tickets From</span>
                  <p className="font-black text-rose-500 text-lg">₹{play.price}</p>
                </div>
                
                <Link
                  to={`/book/event/play-${play.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-rose-600/5 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
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

export default Plays;
