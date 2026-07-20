import React from 'react';

const OwnerAnalytics = ({ ownerTotalBookings, ownerOccupancyRatio, ownerTotalRevenue, ownerBookings }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Revenue & Occupancy Metrics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-500">Total Bookings (Paid)</span>
          <p className="text-2xl font-black text-white">{ownerTotalBookings}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-500">Occupancy Ratio</span>
          <p className="text-2xl font-black text-emerald-500">{ownerOccupancyRatio}%</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-500">Total Gross Earnings</span>
          <p className="text-2xl font-black text-rose-500">₹{ownerTotalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Owner Bookings log table */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Live Booking History ({ownerBookings.length})</h3>
        {ownerBookings.length === 0 ? (
          <p className="text-xs text-neutral-550 italic bg-neutral-900/20 p-6 rounded-2xl border border-neutral-850">
            No bookings logged for this theatre yet.
          </p>
        ) : (
          <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs font-semibold text-neutral-450">
              <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Reference ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Movie</th>
                  <th className="p-4">Seats</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Checked-In</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {ownerBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-neutral-900/30 transition-colors">
                    <td className="p-4 font-mono text-neutral-200 uppercase font-bold">{b.bookingId}</td>
                    <td className="p-4">
                      <p className="text-neutral-300 font-bold">{b.user?.name || 'Guest'}</p>
                      <p className="text-[10px] text-neutral-500">{b.user?.email || ''}</p>
                    </td>
                    <td className="p-4 text-neutral-300 font-extrabold">{b.show?.movie?.title || 'Unknown Movie'}</td>
                    <td className="p-4 font-mono">
                      {b.seats?.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-neutral-850 rounded text-neutral-400 text-[10px] mr-1">
                          {s}
                        </span>
                      ))}
                    </td>
                    <td className="p-4 text-neutral-300">₹{b.totalAmount}</td>
                    <td className="p-4">
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                        b.checkedIn
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {b.checkedIn ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                        b.bookingStatus === 'booked'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                          : b.bookingStatus === 'cancelled'
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                          : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerAnalytics;
