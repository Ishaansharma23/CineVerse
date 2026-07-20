import React from 'react';
import { X, BarChart2 } from 'lucide-react';

const AdminDetailInsightsModal = ({ detailModal, setDetailModal, adminStats }) => {
  if (!detailModal.isOpen || !adminStats) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#121212] border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-rose-500" />
            {detailModal.title}
          </h3>
          <button 
            onClick={() => setDetailModal({ isOpen: false, type: '', title: '' })}
            className="p-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Switch */}
        <div className="space-y-6">
          {detailModal.type === 'users' && (
            <div className="space-y-6">
              {/* Visual segment progress bar: Customers vs Owners */}
              <div className="bg-neutral-950/40 p-5 rounded-2xl border border-neutral-850 space-y-3">
                <p className="text-xs uppercase font-bold tracking-wider text-neutral-400">Account Distribution</p>
                <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${(adminStats.totalUsers / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100}%` }}
                    className="bg-rose-600"
                    title="Customers"
                  />
                  <div 
                    style={{ width: `${(adminStats.totalOwners / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100}%` }}
                    className="bg-neutral-600"
                    title="Theatre Owners"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-600 rounded-full" /> Customers: {adminStats.totalUsers} ({Math.round((adminStats.totalUsers / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100)}%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-neutral-600 rounded-full" /> Partners: {adminStats.totalOwners} ({Math.round((adminStats.totalOwners / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100)}%)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-neutral-400">Recent Customers</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {adminStats.recentUsers?.map((u) => (
                      <div key={u._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex flex-col gap-0.5">
                        <span className="text-xs text-neutral-200 font-bold">{u.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{u.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-neutral-400">Recent Owners</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {adminStats.recentOwners?.map((o) => (
                      <div key={o._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex flex-col gap-0.5">
                        <span className="text-xs text-neutral-200 font-bold">{o.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{o.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailModal.type === 'revenue' && (
            <div className="space-y-6">
              {/* Financial breakdown summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Total Gross</span>
                  <p className="text-sm font-black text-rose-500">₹{adminStats.totalRevenue?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Today's Gross</span>
                  <p className="text-sm font-black text-rose-500">₹{adminStats.todayRevenue?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Refund Count</span>
                  <p className="text-sm font-black text-neutral-300">{adminStats.refundCount || 0}</p>
                </div>
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Total Refunded</span>
                  <p className="text-sm font-black text-rose-500">₹{adminStats.totalRefundedAmount?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Net Profit</span>
                  <p className="text-sm font-black text-emerald-500">₹{adminStats.profit?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Revenue by movie & theatre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-neutral-400">Revenue by Movie</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {adminStats.topMovies?.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3 rounded-xl border border-neutral-850">
                        <span className="text-xs text-neutral-300 font-bold">{m.title}</span>
                        <span className="text-xs text-rose-500 font-black">₹{m.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-neutral-400">Revenue by Theatre</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {adminStats.topTheatres?.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3 rounded-xl border border-neutral-850">
                        <span className="text-xs text-neutral-300 font-bold">{t.name}</span>
                        <span className="text-xs text-rose-500 font-black">₹{t.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Transaction logs */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-neutral-400">Recent Transactions Log</h4>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {adminStats.recentBookings?.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3 rounded-xl border border-neutral-850 text-xs">
                      <div>
                        <p className="font-bold text-neutral-200 uppercase font-mono">{b.bookingId}</p>
                        <p className="text-[10px] text-neutral-500">{b.user?.name || 'Guest'} ({b.user?.email || 'N/A'})</p>
                      </div>
                      <span className="font-extrabold text-emerald-500">₹{b.totalAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {detailModal.type === 'bookings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Total Orders Confirmed</span>
                  <p className="text-sm font-black text-white">{adminStats.totalBookings}</p>
                </div>
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Today's Orders</span>
                  <p className="text-sm font-black text-white">{adminStats.todayBookings}</p>
                </div>
              </div>

              <h4 className="text-xs uppercase font-bold text-neutral-400 pt-2">Live Orders Monitor</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {adminStats.recentBookings?.map((b) => (
                  <div key={b._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-neutral-200 uppercase font-mono">{b.bookingId}</p>
                      <p className="text-[10px] text-neutral-500">Movie: {b.show?.movie?.title || 'Unknown'} • Seats: {b.seats?.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-neutral-200">₹{b.totalAmount}</p>
                      <p className="text-[10px] text-neutral-500">{new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailModal.type === 'movies' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                <span className="text-[9px] uppercase font-bold text-neutral-550">Movies Catalog Size</span>
                <p className="text-sm font-black text-white">{adminStats.totalMovies}</p>
              </div>

              <h4 className="text-xs uppercase font-bold text-neutral-400 pt-2">Top Performing Film Titles</h4>
              <div className="space-y-3">
                {adminStats.topMovies?.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-850">
                    <span className="text-xs text-neutral-200 font-extrabold">{m.title}</span>
                    <span className="text-xs text-rose-500 font-black">₹{m.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailModal.type === 'theatres' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Approved Properties</span>
                  <p className="text-sm font-black text-white">{adminStats.totalTheatres}</p>
                </div>
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Total Screen Audis</span>
                  <p className="text-sm font-black text-white">{adminStats.totalScreens}</p>
                </div>
                <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-550">Total Shows Scheduled</span>
                  <p className="text-sm font-black text-white">{adminStats.totalShows}</p>
                </div>
              </div>

              <h4 className="text-xs uppercase font-bold text-neutral-400 pt-2">Top Performing Theatres</h4>
              <div className="space-y-3">
                {adminStats.topTheatres?.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-850">
                    <span className="text-xs text-neutral-200 font-extrabold">{t.name}</span>
                    <span className="text-xs text-rose-500 font-black">₹{t.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-2">
          <button 
            onClick={() => setDetailModal({ isOpen: false, type: '', title: '' })}
            className="w-full py-3 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDetailInsightsModal;
