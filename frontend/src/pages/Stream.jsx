import { useEffect, useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { movieService } from '../services/movieService';
import { useTrailer } from '../context/TrailerContext';
import gsap from 'gsap';

const Stream = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrailer } = useTrailer();

  useEffect(() => {
    let isMounted = true;
    const fetchMovies = async () => {
      try {
        const response = await movieService.getPopularMovies(10);
        if (isMounted) setMovies(response.movies || []);
      } catch (err) {
        console.error('Failed to load streaming content:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMovies();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!loading && movies.length > 0) {
      gsap.fromTo(
        '.stream-card',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [loading, movies]);

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Title */}
        <div className="border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cineverse Stream Premiere</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Rent or Buy Movies Online</h1>
          <p className="text-neutral-500 text-sm mt-1">Watch hand-picked premium blockbusters from the comfort of your home</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="space-y-4 animate-pulse">
                <div className="aspect-[2/3] bg-neutral-900 rounded-xl" />
                <div className="h-4 bg-neutral-900 rounded-md w-3/4" />
                <div className="h-3 bg-neutral-900 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="stream-card group bg-[#121212]/40 border border-neutral-900 hover:border-neutral-800 rounded-2xl p-2.5 transition-all flex flex-col justify-between"
              >
                {/* Image Poster with Hover play trailer button */}
                <div 
                  onClick={() => playTrailer(movie.tmdbId)}
                  className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-950 relative cursor-pointer"
                  title="Hover to show trailer play sign"
                >
                  <img src={movie.image} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                  
                  {/* Badge */}
                  <span className="absolute top-3 left-3 bg-rose-600/90 text-white font-extrabold text-[9px] px-2 py-0.5 rounded tracking-widest uppercase">
                    Premiere
                  </span>

                  {/* Play overlay with Play Sign */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-300">
                    <div className="w-10 h-10 bg-white/10 hover:bg-white border border-white/20 hover:border-white text-white hover:text-black rounded-full flex items-center justify-center shadow-lg transition-colors">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-white bg-black/40 px-2 py-0.5 rounded">Play Trailer</span>
                  </div>
                </div>

                <div className="mt-3 px-1.5 space-y-2">
                  <h3 className="font-extrabold text-xs text-neutral-200 group-hover:text-white line-clamp-1 transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    <Link 
                      to={`/book/stream/${movie.id}`}
                      className="text-rose-500 hover:text-rose-455 transition-colors font-extrabold"
                    >
                      Rent from ₹120
                    </Link>
                    <span>⭐ {movie.rating?.toFixed(1) || '7.5'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stream;
