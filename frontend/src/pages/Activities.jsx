import { useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Compass, Play } from 'lucide-react';
import gsap from 'gsap';

const activitiesList = [
  { id: 1, title: 'VR Reality Gaming Lounge Pass', category: 'Gaming', ageLimit: 'All Ages', price: 400, venue: 'Downtown Mall, Kolkata' },
  { id: 2, title: 'Science & Space Exploration Workshop', category: 'Kids & Education', ageLimit: 'Kids 6-12', price: 250, venue: 'Science City Auditorium, Kolkata' },
  { id: 3, title: 'Indoor Trampoline Park Access', category: 'Active Fun', ageLimit: 'Age 5+', price: 500, venue: 'Salt Lake Action Park, Kolkata' },
  { id: 4, title: 'Salsa Dance Masterclass for Couples', category: 'Workshops', ageLimit: 'Adults', price: 600, venue: 'Alliance Française, Kolkata' },
];

const Activities = () => {
  useEffect(() => {
    gsap.fromTo(
      '.activity-card',
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, []);

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Title */}
        <div className="border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cineverse Activities</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Adventure & Fun Activities</h1>
          <p className="text-neutral-500 text-sm mt-1">Explore VR zones, trampoline parks, masterclasses, and interactive workshops</p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {activitiesList.map((activity) => (
            <div
              key={activity.id}
              className="activity-card group bg-[#121212]/40 border border-neutral-900 hover:border-neutral-850 p-5 rounded-2xl flex flex-col justify-between gap-6 transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-neutral-805 border border-neutral-800 text-neutral-400 font-bold text-[9px] tracking-wider uppercase rounded">
                    {activity.category}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase">{activity.ageLimit}</span>
                </div>
                
                <h3 className="font-extrabold text-sm sm:text-base text-neutral-100 group-hover:text-rose-500 transition-colors leading-snug line-clamp-2">
                  {activity.title}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold pt-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="line-clamp-1">{activity.venue}</span>
                </div>
              </div>

              {/* Booking and Price */}
              <div className="flex justify-between items-center border-t border-neutral-900/60 pt-4">
                <div>
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-wider block">Pass Price</span>
                  <p className="font-black text-rose-500 text-sm sm:text-base">₹{activity.price}</p>
                </div>
                
                <button className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer">
                  Book Pass
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Activities;
