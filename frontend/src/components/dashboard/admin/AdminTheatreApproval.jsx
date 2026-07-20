import React from 'react';

const AdminTheatreApproval = ({ pendingTheatres, theatres, handleApproveTheatre }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Approval queue list */}
      <div className="lg:col-span-3 space-y-6">
        <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Pending Theatre Requests ({pendingTheatres.length})</h2>
        
        {pendingTheatres.length === 0 ? (
          <p className="text-xs text-neutral-500 italic bg-neutral-900/40 p-5 rounded-2xl border border-neutral-850">
            No theatres pending approval at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingTheatres.map((theatre) => (
              <div 
                key={theatre._id}
                className="bg-neutral-900/50 border border-neutral-850 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-neutral-800 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-neutral-200 text-sm">{theatre.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-neutral-450 leading-relaxed font-semibold">{theatre.address}, {theatre.city}</p>
                  {theatre.owner && (
                    <p className="text-[10px] text-neutral-500">
                      Owner: <span className="text-neutral-400 font-bold">{theatre.owner.name}</span> ({theatre.owner.email})
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleApproveTheatre(theatre._id, theatre.name)}
                  className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex-shrink-0"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Theatres catalog */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Active Theatre Registry</h2>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {theatres.filter(t => t.status === 'approved').map(t => (
            <div key={t._id} className="bg-[#121212]/50 border border-neutral-900 p-4 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-neutral-200">{t.name}</span>
                <span className="text-[8px] uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">Approved</span>
              </div>
              <p className="text-[10px] text-neutral-500 font-semibold">{t.address}, {t.city}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTheatreApproval;
