import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { selectMovie, selectTheatre, selectShow } from '../redux/slices/bookingSlice';
import request from '../services/api';
import { movieService } from '../services/movieService';
import { Star, Clock, Globe, Film, Calendar, MapPin } from 'lucide-react';
import gsap from 'gsap';

const MovieDetails = () => {
  const { id: tmdbId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [showsLoading, setShowsLoading] = useState(false);

  const containerRef = useRef(null);
  const showsRef = useRef(null);

  // Generate date rails (today + next 6 days)
  const getDatesRail = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const datesRail = getDatesRail();

  // On mount, set default date to today (YYYY-MM-DD format in local timezone)
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }, []);

  // Fetch movie details
  useEffect(() => {
    let isMounted = true;
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await movieService.getMovieById(tmdbId);
        if (isMounted && response.movie) {
          setMovie(response.movie);
          // Set selection context
          dispatch(selectMovie(response.movie));
        }
      } catch (error) {
        console.error('Failed to load movie details:', error.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMovieDetails();
    return () => {
      isMounted = false;
    };
  }, [tmdbId]);

  // Fetch showtimes when movie or selectedDate changes
  useEffect(() => {
    if (!movie || !selectedDate) return;
    let isMounted = true;
    const fetchShowtimes = async () => {
      try {
        setShowsLoading(true);
        // Call the new public shows endpoint
        const response = await request(`/shows/movie/${movie.id}?date=${selectedDate}`);
        if (isMounted) {
          setShows(response.shows || []);
        }
      } catch (error) {
        console.error('Failed to load showtimes:', error.message);
      } finally {
        if (isMounted) setShowsLoading(false);
      }
    };
    fetchShowtimes();
    return () => {
      isMounted = false;
    };
  }, [movie, selectedDate]);

  // Page animation
  useEffect(() => {
    if (!loading && movie && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }
  }, [loading, movie]);

  // Animate shows section on filter change
  useEffect(() => {
    if (!showsLoading && showsRef.current) {
      const rows = showsRef.current.querySelectorAll('.theatre-row');
      if (rows.length > 0) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
        );
      }
    }
  }, [showsLoading, shows]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-neutral-400 text-sm font-medium tracking-wide">Loading movie experience...</span>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center p-8">
        <div className="max-w-md">
          <Film className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold">Movie not found</h3>
          <p className="text-neutral-500 text-sm mt-2">
            The requested movie ID could not be loaded from the database or TMDB sync.
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

  // Group shows by Theatre
  const getGroupedShows = () => {
    const groups = {};
    shows.forEach((show) => {
      const theatre = show.screen?.theatre;
      if (!theatre || !theatre.isActive || theatre.status !== 'approved') return;
      
      if (!groups[theatre._id]) {
        groups[theatre._id] = {
          theatre,
          shows: [],
        };
      }
      groups[theatre._id].shows.push(show);
    });
    return Object.values(groups);
  };

  const groupedShows = getGroupedShows();

  const handleShowSelection = (theatre, show) => {
    dispatch(selectTheatre(theatre));
    dispatch(selectShow(show));
    navigate(`/show/${show._id}/seats`);
  };

  return (
    <div ref={containerRef} className="bg-[#0A0A0A] text-white min-h-screen pb-20">
      {/* Hero Backdrop Banner */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] overflow-hidden bg-neutral-950">
        <img
          src={movie.bannerImage}
          alt={movie.title}
          className="w-full h-full object-cover opacity-20 filter blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        
        {/* Movie Info Box Overlay */}
        <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 md:px-8 pb-8 flex flex-col md:flex-row items-end gap-6 sm:gap-8 z-20">
          {/* Poster image */}
          <div className="w-32 sm:w-40 aspect-[2/3] rounded-xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-neutral-900 flex-shrink-0">
            <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          <div className="grow">
            <div className="flex flex-wrap gap-2 mb-3">
              {movie.genres.map((g, idx) => (
                <span key={idx} className="bg-neutral-850 border border-neutral-850/50 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider text-neutral-300">
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-neutral-300">
              {movie.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {movie.rating.toFixed(1)} / 10
                  <span className="text-[10px] text-neutral-500 font-medium">({movie.voteCount} votes)</span>
                </div>
              )}
              {movie.runtime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  {movie.runtime} mins
                </div>
              )}
              <div className="flex items-center gap-1 capitalize">
                <Globe className="w-4 h-4 text-neutral-500" />
                {movie.language}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left/Middle Content: Synopsis & Showtimes */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Synopsis */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-300 border-b border-neutral-900 pb-2">
              Synopsis
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {movie.overview}
            </p>
          </div>

          {/* Showtimes & Booking Selector */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-3">
              <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-300">
                Book Showtimes
              </h2>
            </div>

            {/* Date Rail Selection */}
            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 select-none">
              {datesRail.map((date, idx) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const formatted = `${year}-${month}-${day}`;
                
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dayNum = date.getDate();
                const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                
                const isSelected = selectedDate === formatted;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(formatted)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[70px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg shadow-white/5'
                        : 'bg-[#121212] text-neutral-400 border-neutral-900 hover:border-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span className="text-[9px] font-bold tracking-wider">{dayName}</span>
                    <span className="text-base font-extrabold my-0.5">{dayNum}</span>
                    <span className="text-[9px] font-semibold tracking-wide">{monthName}</span>
                  </button>
                );
              })}
            </div>

            {/* Shows List */}
            {showsLoading ? (
              <div className="space-y-4 py-8">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="bg-neutral-900/40 p-5 rounded-xl border border-neutral-900 animate-pulse h-28" />
                ))}
              </div>
            ) : groupedShows.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-neutral-900 rounded-xl bg-neutral-950/20">
                <Calendar className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-neutral-300">No shows scheduled</h3>
                <p className="text-neutral-500 text-xs mt-1">
                  There are no active showtimes for this movie on the selected date. Check another date or category.
                </p>
              </div>
            ) : (
              <div ref={showsRef} className="space-y-4">
                {groupedShows.map(({ theatre, shows: theatreShows }) => (
                  <div
                    key={theatre._id}
                    className="theatre-row bg-[#121212]/30 border border-neutral-900 rounded-xl p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-neutral-800 transition-colors"
                  >
                    {/* Theatre Details */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm tracking-tight text-neutral-100 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        {theatre.name}
                      </h3>
                      <p className="text-neutral-500 text-xs font-semibold pl-5.5">
                        {theatre.address}, {theatre.city}
                      </p>
                      {theatre.amenities && theatre.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5 pl-5.5">
                          {theatre.amenities.map((amenity, i) => (
                            <span key={i} className="text-[9px] text-neutral-400 bg-neutral-850/60 border border-neutral-850/40 px-2 py-0.5 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Showtime Chips */}
                    <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                      {theatreShows.map((show) => (
                        <button
                          key={show._id}
                          onClick={() => handleShowSelection(theatre, show)}
                          className="flex flex-col items-center justify-center bg-neutral-900 border border-neutral-850 hover:bg-neutral-800/80 hover:border-neutral-700 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all group/chip cursor-pointer"
                        >
                          <span className="text-neutral-200 group-hover/chip:text-white font-extrabold text-sm">{show.startTime}</span>
                          <span className="text-[10px] text-neutral-500 group-hover/chip:text-rose-500 font-bold uppercase tracking-wider mt-0.5">
                            {show.screen?.screenType || '2D'} • ₹{show.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-[#121212] border border-neutral-850 rounded-2xl p-6 space-y-6">
            <h3 className="font-extrabold text-base border-b border-neutral-800 pb-3">Movie Information</h3>
            
            <div className="space-y-4 text-xs font-semibold text-neutral-400">
              <div className="flex justify-between border-b border-neutral-900/60 pb-2">
                <span>Release Date</span>
                <span className="text-neutral-200">
                  {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                </span>
              </div>
              
              {movie.runtime && (
                <div className="flex justify-between border-b border-neutral-900/60 pb-2">
                  <span>Runtime</span>
                  <span className="text-neutral-200">{movie.runtime} minutes</span>
                </div>
              )}
              
              <div className="flex justify-between border-b border-neutral-900/60 pb-2">
                <span>Language</span>
                <span className="text-neutral-200 capitalize">{movie.language}</span>
              </div>
              
              <div className="flex justify-between border-b border-neutral-900/60 pb-2">
                <span>Genres</span>
                <span className="text-neutral-200">{movie.genres.join(', ')}</span>
              </div>

              <div className="flex justify-between pb-2">
                <span>Popularity Index</span>
                <span className="text-neutral-200">{movie.popularity ? movie.popularity.toFixed(0) : '0'} pts</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MovieDetails;