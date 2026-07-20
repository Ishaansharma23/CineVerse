import React from 'react';
import { Plus, Tv, MapPin } from 'lucide-react';

const OwnerMyTheatres = ({ theatres, selectedTheatreId, setSelectedTheatreId, setShowTheatreModal }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">My Theatres</h2>
        <button
          onClick={() => setShowTheatreModal(true)}
          className="flex items-center gap-2 bg-rose-650 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Theatre
        </button>
      </div>

      {theatres.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
          <Tv className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">No theatres registered. Register your first theatre to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {theatres.map((theatre) => (
            <div 
              key={theatre._id}
              onClick={() => setSelectedTheatreId(theatre._id)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                selectedTheatreId === theatre._id
                  ? 'bg-neutral-900 border-rose-600 shadow-xl shadow-rose-600/5'
                  : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-extrabold text-base tracking-tight text-neutral-100">{theatre.name}</h3>
                <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                  theatre.status === 'approved' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                }`}>
                  {theatre.status}
                </span>
              </div>
              <p className="text-xs text-neutral-450 leading-relaxed font-semibold">{theatre.description || 'No description provided.'}</p>
              <p className="text-[11px] text-neutral-500 flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5" /> {theatre.address}, {theatre.city}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerMyTheatres;
