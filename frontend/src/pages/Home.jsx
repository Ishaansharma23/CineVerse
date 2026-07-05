import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../services/movieService';
import { useDispatch } from 'react-redux';
import { selectMovie } from '../redux/slices/bookingSlice';
import { useTrailer } from '../context/TrailerContext';
import BannerSlider from '../components/shared/BannerSlider';
import { Star, Film, SlidersHorizontal, Calendar, Compass, Flame, Play } from 'lucide-react';
import gsap from 'gsap';

const Home = ({ searchQuery }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { playTrailer } = useTrailer();
  
  const [activeTab, setActiveTab] = useState('now_showing'); // now_showing, recommended, upcoming
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);

  const gridRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [trending, recommended, upcoming] = await Promise.all([
          movieService.getTrendingMovies(15),
          movieService.getRecommendedMovies(15),
          movieService.getUpcomingMovies(15),
        ]);

        if (isMounted) {
          setTrendingMovies(trending.movies || []);
          setRecommendedMovies(recommended.movies || []);
          setUpcomingMovies(upcoming.movies || []);
        }
      } catch (error) {
        console.error('Failed to load home page movies:', error.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP animation on tab changes or movie list filter changes
  useEffect(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.movie-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', overwrite: 'auto' }
        );
      }
    }
  }, [activeTab, selectedGenre, selectedLanguage, searchQuery, loading]);

  // Determine current active list
  const getActiveMovies = () => {
    switch (activeTab) {
      case 'now_showing':
        return trendingMovies;
      case 'recommended':
        return recommendedMovies;
      case 'upcoming':
        return upcomingMovies;
      default:
        return trendingMovies;
    }
  };

  // Get unique genres and languages across all movies for filtering
  const allMoviesCombined = [...trendingMovies, ...recommendedMovies, ...upcomingMovies];
  const uniqueGenres = Array.from(new Set(allMoviesCombined.flatMap((m) => m.genres || [])));
  const uniqueLanguages = Array.from(new Set(allMoviesCombined.map((m) => m.language).filter(Boolean)));

  // Filter movies
  const filteredMovies = getActiveMovies().filter((movie) => {
    const matchesSearch = searchQuery
      ? movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (movie.genres || []).some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchesGenre = selectedGenre ? (movie.genres || []).includes(selectedGenre) : true;
    const matchesLanguage = selectedLanguage ? movie.language === selectedLanguage : true;
    return matchesSearch && matchesGenre && matchesLanguage;
  });

  const handleMovieClick = (movie) => {
    dispatch(selectMovie(movie));
    navigate(`/movies/${movie.tmdbId}`);
  };

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      {/* Banner slider for trending spotlights */}
      <BannerSlider />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Navigation Tabs and Quick Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-900 pb-5 mb-10">
          <div className="flex items-center gap-1.5 sm:gap-4 overflow-x-auto scrollbar-none pb-2 md:pb-0">
            <button
              onClick={() => { setActiveTab('now_showing'); setSelectedGenre(''); setSelectedLanguage(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === 'now_showing'
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Now Showing
            </button>
            <button
              onClick={() => { setActiveTab('recommended'); setSelectedGenre(''); setSelectedLanguage(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === 'recommended'
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Recommended
            </button>
            <button
              onClick={() => { setActiveTab('upcoming'); setSelectedGenre(''); setSelectedLanguage(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Upcoming
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-bold mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              FILTERS:
            </div>
            
            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-[#121212] border border-neutral-800 focus:border-neutral-700 text-xs font-semibold px-3 py-2 rounded-xl text-neutral-300 outline-none transition-colors cursor-pointer"
            >
              <option value="">All Genres</option>
              {uniqueGenres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-[#121212] border border-neutral-800 focus:border-neutral-700 text-xs font-semibold px-3 py-2 rounded-xl text-neutral-300 outline-none transition-colors cursor-pointer"
            >
              <option value="">All Languages</option>
              {uniqueLanguages.map((lang) => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="space-y-4 animate-pulse">
                <div className="aspect-[2/3] bg-neutral-900 rounded-xl" />
                <div className="h-4 bg-neutral-900 rounded-md w-3/4" />
                <div className="h-3 bg-neutral-900 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/20">
            <Film className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-300">No movies found</h3>
            <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
              We couldn't find any movies matching your search query or selected filter criteria. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8"
          >
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => handleMovieClick(movie)}
                className="movie-card group flex flex-col bg-[#121212]/30 border border-neutral-900/60 rounded-xl p-2 cursor-pointer hover:border-neutral-800 transition-all duration-300"
              >
                {/* Poster Container */}
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-950 relative">
                  <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-300">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent going to details page
                        playTrailer(movie.tmdbId);
                      }}
                      className="w-10 h-10 bg-white/10 hover:bg-white border border-white/20 hover:border-white text-white hover:text-black rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                      title="Play Trailer"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-white bg-black/40 px-2 py-0.5 rounded">Play Trailer</span>
                    
                    <button className="mt-4 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-rose-600/25 transition-colors cursor-pointer">
                      Book Tickets
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-3.5 px-1.5 flex-grow flex flex-col justify-between">
                  <div>
                    {/* Rating and votes */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold mb-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-[10px] text-neutral-500">{movie.voteCount} votes</span>
                    </div>

                    <h3 className="font-bold text-sm tracking-tight text-neutral-200 group-hover:text-white line-clamp-1 transition-colors">
                      {movie.title}
                    </h3>
                  </div>

                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1.5">
                    {movie.language} • {movie.genres.slice(0, 2).join(' / ') || 'Cinema'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;