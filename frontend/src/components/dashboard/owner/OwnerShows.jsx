import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';

const OwnerShows = ({ theatres, selectedTheatreId, setSelectedTheatreId, shows, screens, setShowShowModal, handleDeleteShow }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Scheduled Shows</h2>
          <select 
            value={selectedTheatreId}
            onChange={(e) => setSelectedTheatreId(e.target.value)}
            className="bg-[#121212] border border-neutral-850 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none text-neutral-350"
          >
            {theatres.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowShowModal(true)}
          disabled={!selectedTheatreId || !screens[selectedTheatreId] || screens[selectedTheatreId].length === 0}
          className="flex items-center gap-2 bg-rose-655 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-550"
        >
          <Calendar className="w-4 h-4" /> Schedule Show
        </button>
      </div>

      {(!selectedTheatreId || !shows[selectedTheatreId] || shows[selectedTheatreId].length === 0) ? (
        <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
          <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">No shows scheduled for this theatre yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shows[selectedTheatreId].map((show) => (
            <div key={show._id} className="bg-[#121212] border border-neutral-850 p-5 rounded-2xl flex justify-between items-center gap-4 hover:border-neutral-800 transition-colors">
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-750 text-neutral-400 font-extrabold text-[9px] uppercase tracking-wider rounded">
                  Screen {show.screen?.screenNumber || 'N/A'}
                </span>
                <h3 className="font-extrabold text-sm text-neutral-200 mt-1.5 leading-snug">
                  {show.movie?.title || 'Unknown Movie'}
                </h3>
                <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(show.date).toDateString()} | {show.startTime} - {show.endTime}
                </p>
                <p className="text-[10px] font-extrabold uppercase text-rose-500">
                  Pass price: ₹{show.price} • Status: {show.status}
                </p>
              </div>

              {show.status === 'scheduled' && (
                <button
                  onClick={() => handleDeleteShow(show._id)}
                  className="p-2.5 bg-neutral-900 hover:bg-rose-950/20 border border-neutral-850 hover:border-rose-900/30 text-neutral-500 hover:text-rose-455 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerShows;
