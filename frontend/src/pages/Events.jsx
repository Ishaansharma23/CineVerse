import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar } from 'lucide-react';
import request from '../services/api';
import gsap from 'gsap';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Attempt to fetch dynamically from API
        const res = await request('/events').catch(() => ({ success: false, events: [] }));
        if (isMounted) {
          setEvents(res.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && events.length > 0) {
      gsap.fromTo(
        '.event-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [loading, events]);

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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Checking schedules...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-900 rounded-3xl bg-[#121212]/20 max-w-xl mx-auto px-6">
            <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-neutral-300">No Events Scheduled</h3>
            <p className="text-neutral-550 text-xs mt-2 leading-relaxed">
              We are currently in the process of scheduling new live shows, comedy gigs, and adventure events. Check back soon for the latest updates!
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-5 py-2.5 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
            >
              Explore Movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {events.map((event, index) => (
              <div
                key={index}
                className="event-card group bg-[#121212]/40 border border-neutral-900 hover:border-neutral-850 rounded-2xl overflow-hidden p-2.5 transition-all flex flex-col justify-between"
              >
                {/* Rendering logic here if dynamic events exist in future */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
