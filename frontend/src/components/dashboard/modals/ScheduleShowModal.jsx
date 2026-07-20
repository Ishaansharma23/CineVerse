import React from 'react';
import { X } from 'lucide-react';

const ScheduleShowModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  form, 
  setForm, 
  moviesList, 
  screens, 
  selectedTheatreId, 
  selectedScreenId, 
  setSelectedScreenId 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Schedule Showtime</h3>
        
        <form onSubmit={onSubmit} className="space-y-4 text-xs font-semibold text-neutral-450">
          <div className="space-y-1">
            <label className="uppercase tracking-wider">Select Movie</label>
            <select
              value={form.movieId}
              onChange={(e) => setForm({ ...form, movieId: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
            >
              <option value="">-- Choose Movie --</option>
              {moviesList.map(movie => (
                <option key={movie.id} value={movie.id}>{movie.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Screen Allocation</label>
              <select
                value={selectedScreenId}
                onChange={(e) => setSelectedScreenId(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              >
                <option value="">-- Choose Screen --</option>
                {screens[selectedTheatreId]?.map(screen => (
                  <option key={screen._id} value={screen._id}>Screen {screen.screenNumber} ({screen.screenType})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Pass Price (INR)</label>
              <input
                type="number" required min="50"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="uppercase tracking-wider">Date</label>
            <input
              type="date" required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Start Time</label>
              <input
                type="text" required placeholder="e.g. 14:30"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">End Time</label>
              <input
                type="text" required placeholder="e.g. 17:00"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
            Confirm Schedule Slot
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleShowModal;
