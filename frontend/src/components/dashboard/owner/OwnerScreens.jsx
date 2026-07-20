import React from 'react';
import { Plus, Tv, ArrowLeft, ArrowRight } from 'lucide-react';

const OwnerScreens = ({ theatres, selectedTheatreId, setSelectedTheatreId, screens, setShowScreenModal, onPrevStep, onNextStep }) => {
  const currentScreens = screens[selectedTheatreId] || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Step 2: Select Screen</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-semibold">Active Theatre:</span>
            <select 
              value={selectedTheatreId}
              onChange={(e) => setSelectedTheatreId(e.target.value)}
              className="bg-[#121212] border border-neutral-850 px-3 py-1 rounded-lg text-xs font-bold outline-none text-neutral-200"
            >
              {theatres.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPrevStep}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Theatres</span>
          </button>

          <button
            onClick={() => setShowScreenModal(true)}
            disabled={!selectedTheatreId}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer text-neutral-300 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Screen
          </button>

          <button
            onClick={onNextStep}
            disabled={!selectedTheatreId || currentScreens.length === 0}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-850 disabled:text-neutral-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-rose-600/10"
          >
            <span>Next: Schedule Shows</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(!selectedTheatreId || currentScreens.length === 0) ? (
        <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20 space-y-3">
          <Tv className="w-12 h-12 text-neutral-700 mx-auto" />
          <p className="text-neutral-400 text-sm">No screens configured for this theatre yet.</p>
          <button
            onClick={() => setShowScreenModal(true)}
            className="px-4 py-2 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer hover:bg-rose-600/20"
          >
            Configure First Screen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentScreens.map((screen) => (
            <div key={screen._id} className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-4 hover:border-neutral-800 transition-colors">
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
