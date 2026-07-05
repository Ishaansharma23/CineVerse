import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaInfoCircle, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';
import { movieService } from '../../services/movieService';

const BannerSlider = () => {
    const [banners, setBanners] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef(null);

    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState('');
    const [trailerLoading, setTrailerLoading] = useState(false);

    const playTrailer = async (tmdbId) => {
        if (!tmdbId) return;
        setTrailerLoading(true);
        try {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=143fd9ab7d108d2efe4e112a9541e6b3`);
            const data = await res.json();
            const youtubeTrailer = (data.results || []).find(
                (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            );
            if (youtubeTrailer) {
                setTrailerUrl(`https://www.youtube.com/embed/${youtubeTrailer.key}?autoplay=1`);
                setShowTrailer(true);
            } else {
                // Fallback to Dolby/IMAX Cinematic 4K intro
                setTrailerUrl(`https://www.youtube.com/embed/d3_DjiLLDfo?autoplay=1`);
                setShowTrailer(true);
            }
        } catch (err) {
            console.error('Error fetching trailer, falling back:', err);
            setTrailerUrl(`https://www.youtube.com/embed/d3_DjiLLDfo?autoplay=1`);
            setShowTrailer(true);
        } finally {
            setTrailerLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadBanners = async () => {
            try {
                // Fetch top trending movies for the hero banner
                const response = await movieService.getTrendingMovies(5);
                if (isMounted) {
                    setBanners(response.movies || []);
                }
            } catch (error) {
                console.error('Failed to load banner movies:', error.message);
            }
        };

        loadBanners();

        return () => {
            isMounted = false;
        };
    }, []);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Timer only runs if not hovered
        if (!isHovered && banners.length > 0) {
            timerRef.current = setInterval(() => {
                setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
            }, 6000);
        }
    }, [banners.length, isHovered]);

    useEffect(() => {
        if (banners.length > 0) {
            startTimer();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [banners, startTimer, isHovered]);

    const handlePrev = (e) => {
        e.stopPropagation();
        setActiveIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
        startTimer();
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
        startTimer();
    };

    const handleDotClick = (index, e) => {
        e.stopPropagation();
        setActiveIndex(index);
        startTimer();
    };

    if (!banners.length) {
        return (
            <div className="w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[21/9] bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#f84464] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-neutral-400 text-sm font-medium tracking-wide">Loading Spotlight...</span>
                </div>
            </div>
        );
    }

    const currentBanner = banners[activeIndex];

    return (
        <div 
            className="group relative w-full overflow-hidden bg-neutral-950 aspect-[4/3] sm:aspect-[16/10] md:aspect-[21/9] select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image Carousel (Fade & Zoom Transition) */}
            <div className="absolute inset-0 w-full h-full">
                <AnimatePresence initial={false} mode="popLayout">
                    <motion.div
                        key={activeIndex}
                        className="absolute inset-0 w-full h-full overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.0, ease: 'easeInOut' }}
                    >
                        {/* Ken Burns Slide Zoom Effect */}
                        <motion.img
                            src={currentBanner.bannerImage || currentBanner.backdropUrl || currentBanner.image}
                            alt={currentBanner.title}
                            initial={{ scale: 1.08 }}
                            animate={{ scale: 1.01 }}
                            transition={{ duration: 6, ease: 'easeOut' }}
                            className="w-full h-full object-cover object-center"
                        />
                        
                        {/* Cinematic Ambient Overlays */}
                        {/* Left gradient for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 via-35% via-neutral-950/20 to-transparent z-10" />
                        
                        {/* Bottom gradient to blend with the rest of the site */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent z-10" />
                        
                        {/* Top subtle vignette */}
                        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-neutral-950/50 to-transparent z-10" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Slide Content Overlay */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: [0.215, 0.610, 0.355, 1.0] }}
                    className="absolute inset-0 z-20 flex flex-col justify-end pb-10 pl-6 pr-6 sm:pb-16 sm:pl-12 lg:pb-20 lg:pl-24 max-w-3xl text-white pointer-events-none"
                >
                    {/* Genre Badges */}
                    <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 pointer-events-auto">
                        {currentBanner.genres?.slice(0, 3).map((genre, i) => (
                            <span 
                                key={i} 
                                className="px-3 py-0.5 text-[9px] sm:text-[10px] md:text-xs font-semibold tracking-wider uppercase bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/90 shadow-sm"
                            >
                                {genre}
                            </span>
                        ))}
                    </div>

                    {/* Movie Title */}
                    <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 sm:mb-3 leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        {currentBanner.title}
                    </h1>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 text-xs sm:text-sm font-medium text-neutral-300 pointer-events-auto">
                        {currentBanner.rating && (
                            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shadow-inner">
                                <FaStar className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                                {currentBanner.rating.toFixed(1)}
                            </span>
                        )}
                        {currentBanner.releaseDate && (
                            <span className="drop-shadow-sm">{new Date(currentBanner.releaseDate).getFullYear()}</span>
                        )}
                        {currentBanner.language && (
                            <span className="uppercase border border-neutral-600 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider bg-black/20">
                                {currentBanner.language}
                            </span>
                        )}
                    </div>

                    {/* Overview description */}
                    <p className="text-neutral-300 text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                        {currentBanner.overview}
                    </p>

                    {/* Action Call-To-Action buttons */}
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <button 
                            onClick={() => playTrailer(currentBanner.tmdbId)}
                            disabled={trailerLoading}
                            className="group/btn flex items-center gap-2 bg-[#f84464] hover:bg-[#f84464]/90 disabled:bg-neutral-800 text-white font-semibold text-xs sm:text-sm md:text-base px-3 py-2 sm:px-6 sm:py-3.5 rounded-xl shadow-lg shadow-[#f84464]/10 hover:shadow-[#f84464]/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                        >
                            <FaPlay className="w-3 h-1 sm:w-4 sm:h-4 fill-current group-hover/btn:translate-x-0.5 transition-transform" />
                            {trailerLoading ? 'Loading...' : 'Play Now'}
                        </button>
                        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md font-semibold text-xs sm:text-sm md:text-base px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer">
                            <FaInfoCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            More Info
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Left/Right Navigation Arrows */}
            <button
                onClick={handlePrev}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-black/35 hover:bg-black/60 border border-white/10 hover:border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-350 hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Previous slide"
            >
                <FaChevronLeft className="w-4 h-4 text-white/90" />
            </button>
            <button
                onClick={handleNext}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-black/35 hover:bg-black/60 border border-white/10 hover:border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-350 hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Next slide"
            >
                <FaChevronRight className="w-4 h-4 text-white/90" />
            </button>

            {/* Smart Timeline Navigation Indicators */}
            <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-12 lg:right-24 z-30 flex items-center gap-2.5">
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={(e) => handleDotClick(i, e)}
                        className="group relative h-1.5 rounded-full overflow-hidden transition-all duration-500 bg-white/20 cursor-pointer"
                        style={{ width: i === activeIndex ? '2.5rem' : '0.625rem' }}
                        aria-label={`Go to slide ${i + 1}`}
                    >
                        {i === activeIndex && (
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 6, ease: 'linear' }}
                                className="absolute inset-0 bg-[#f84464] origin-left"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Trailer Modal */}
            {showTrailer && (
                <div className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4">
                    <div className="relative w-full max-w-4xl aspect-video bg-[#0A0A0A] rounded-2xl border border-neutral-800/80 overflow-hidden shadow-2xl">
                        <button 
                            onClick={() => { setShowTrailer(false); setTrailerUrl(''); }} 
                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white font-bold px-3 py-1.5 rounded-xl border border-neutral-850 cursor-pointer text-xs uppercase tracking-wider z-50 transition-colors"
                        >
                            Close
                        </button>
                        <iframe 
                            src={trailerUrl} 
                            title="Movie Trailer" 
                            className="w-full h-full" 
                            allow="autoplay; encrypted-media; picture-in-picture" 
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerSlider;