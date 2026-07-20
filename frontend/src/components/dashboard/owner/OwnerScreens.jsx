import React from 'react';
import { Plus, Tv } from 'lucide-react';

const OwnerScreens = ({ theatres, selectedTheatreId, setSelectedTheatreId, screens, setShowScreenModal }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Screen Details</h2>
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
          onClick={() => setShowScreenModal(true)}
          disabled={!selectedTheatreId}
          className="flex items-center gap-2 bg-rose-650 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-550"
        >
          <Plus className="w-4 h-4" /> Add Screen
        </button>
      </div>

      {(!selectedTheatreId || !screens[selectedTheatreId] || screens[selectedTheatreId].length === 0) ? (
        <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
          <Tv className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">No screens configured for this theatre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens[selectedTheatreId].map((screen) => (
            <div key={screen._id} className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
                <h3 className="font-extrabold text-sm text-neutral-200">Screen {screen.screenNumber}</h3>
                <span className="text-[10px] text-rose-500 uppercase tracking-wider font-extrabold bg-rose-600/10 px-2 py-0.5 rounded">
                  {screen.screenType}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-neutral-450">
                <div>
                  <p className="text-neutral-500 text-[10px] uppercase">Rows</p>
                  <p className="text-neutral-300 font-extrabold mt-0.5">{screen.layout?.rows || 8}</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-[10px] uppercase">Seats/Row</p>
                  <p className="text-neutral-300 font-extrabold mt-0.5">{screen.layout?.seatsPerRow || 10}</p>
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold">Features: {screen.features || 'None listed'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerScreens;
