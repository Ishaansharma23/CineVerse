import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

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
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!form.movieId) {
      setValidationError('Please select a movie from the catalog.');
      return;
    }

    if (!selectedScreenId) {
      setValidationError('Please allocate a screen for this show.');
      return;
    }

    if (!form.date) {
      setValidationError('Please select a valid show date.');
      return;
    }

    if (form.date < todayStr) {
      setValidationError('Show date cannot be in the past.');
      return;
    }

    if (!form.startTime || !form.endTime) {
      setValidationError('Please enter both Start Time and End Time.');
      return;
    }

    // Compare time strings in HH:mm format
    if (form.startTime >= form.endTime) {
      setValidationError('End Time must be strictly later than Start Time.');
      return;
    }

    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setValidationError('Pass price must be a valid positive amount.');
      return;
    }

    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
        <button 
          onClick={() => {
            setValidationError('');
            onClose();
          }} 
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Schedule Showtime</h3>
        
        {validationError && (
          <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-450 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-neutral-450">
          <div className="space-y-1">
            <label className="uppercase tracking-wider">Select Movie</label>
            <select
              value={form.movieId}
              onChange={(e) => {
                setValidationError('');
                setForm({ ...form, movieId: e.target.value });
              }}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              required
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
                onChange={(e) => {
                  setValidationError('');
                  setSelectedScreenId(e.target.value);
                }}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                required
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
                type="number" 
                required 
                min="1"
                step="1"
                placeholder="e.g. 150"
                value={form.price}
                onChange={(e) => {
                  setValidationError('');
                  setForm({ ...form, price: e.target.value });
                }}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="uppercase tracking-wider">Date</label>
            <input
              type="date" 
              required
              min={todayStr}
              value={form.date}
              onChange={(e) => {
                setValidationError('');
                setForm({ ...form, date: e.target.value });
              }}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Start Time</label>
              <input
                type="time" 
                required 
                value={form.startTime}
                onChange={(e) => {
                  setValidationError('');
                  setForm({ ...form, startTime: e.target.value });
                }}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">End Time</label>
              <input
                type="time" 
                required 
                value={form.endTime}
                onChange={(e) => {
                  setValidationError('');
                  setForm({ ...form, endTime: e.target.value });
                }}
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
