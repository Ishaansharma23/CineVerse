import { createContext, useContext, useState } from 'react';

const TrailerContext = createContext(null);

export const TrailerProvider = ({ children }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [trailerLoading, setTrailerLoading] = useState(false);

  const playTrailer = async (tmdbId) => {
    if (!tmdbId) {
      // Fallback to Dolby/IMAX cinematic 4K intro
      setTrailerUrl(`https://www.youtube.com/embed/d3_DjiLLDfo?autoplay=1`);
      setShowTrailer(true);
      return;
    }
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
        // Fallback to Dolby/IMAX cinematic 4K intro
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

  return (
    <TrailerContext.Provider value={{ playTrailer, trailerLoading }}>
      {children}

      {/* Global Trailer Playback Modal */}
      {showTrailer && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video bg-[#0A0A0A] rounded-2xl border border-neutral-800/85 overflow-hidden shadow-2xl">
            <button 
              onClick={() => { setShowTrailer(false); setTrailerUrl(''); }} 
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white font-bold px-3 py-1.5 rounded-xl border border-neutral-850 cursor-pointer text-xs uppercase tracking-wider z-50 transition-colors"
            >
              Close
            </button>
            <iframe 
              src={trailerUrl} 
              title="Movie Trailer" 
              className="w-full h-full animate-fade-in" 
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen
            />
          </div>
        </div>
      )}
    </TrailerContext.Provider>
  );
};

export const useTrailer = () => {
  const context = useContext(TrailerContext);
  if (!context) {
    throw new Error('useTrailer must be used within a TrailerProvider');
  }
  return context;
};
