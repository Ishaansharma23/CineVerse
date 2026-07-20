import React from 'react';
import { Users, Award, DollarSign, TrendingUp, Ticket, Film, Tv, ShieldAlert } from 'lucide-react';
import DashboardRevenueChart from '../charts/DashboardRevenueChart';
import DashboardBookingsChart from '../charts/DashboardBookingsChart';
import DashboardUserDistributionChart from '../charts/DashboardUserDistributionChart';
import DashboardTheatreApprovalChart from '../charts/DashboardTheatreApprovalChart';
import DashboardTopMoviesChart from '../charts/DashboardTopMoviesChart';
import DashboardTopTheatresChart from '../charts/DashboardTopTheatresChart';

const AdminOverview = ({ adminStats, setDetailModal }) => {
  if (!adminStats) return null;

  return (
    <div className="select-none space-y-6 animate-fadeIn">
      {/*Top Section: Property Quick Stats Grid */}
      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Property Quick Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'users', title: 'Customer Accounts' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Customers</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-black text-white mt-1.5">{adminStats.totalUsers}</p>
          </div>

          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'users', title: 'Theatre Partners' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Owners</span>
              <Award className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-black text-white mt-1.5">{adminStats.totalOwners}</p>
          </div>

          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'revenue', title: 'Platform Financials' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Total Revenue</span>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-black text-rose-500 mt-1.5">₹{adminStats.totalRevenue?.toLocaleString()}</p>
          </div>

          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'revenue', title: 'Platform Financials' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Today's Rev</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-black text-rose-500 mt-1.5">₹{adminStats.todayRevenue?.toLocaleString()}</p>
          </div>

          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'bookings', title: 'Booking Logs' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Bookings</span>
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-black text-white mt-1.5">{adminStats.totalBookings}</p>
          </div>

          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'movies', title: 'Movies Catalog' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Movies</span>
              <Film className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-black text-neutral-300 mt-1.5">{adminStats.totalMovies}</p>
          </div>

          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'theatres', title: 'Theatre Property Overview' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Screens</span>
              <Tv className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-black text-neutral-300 mt-1.5">{adminStats.totalScreens}</p>
          </div>

          <div 
            onClick={() => setDetailModal({ isOpen: true, type: 'theatres', title: 'Theatre Property Overview' })}
            className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-center text-neutral-500">
              <span className="text-[9px] uppercase font-bold tracking-wider">Pending</span>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <p className={`text-lg font-black mt-1.5 ${adminStats.pendingTheatreApprovals > 0 ? 'text-amber-500' : 'text-white'}`}>{adminStats.pendingTheatreApprovals}</p>
          </div>
        </div>
      </div>

      {/* Middle Section: Analytics Charts Side-by-Side Rows */}
      <div className="space-y-6">
        {/* Row 1: Financial Trends (Revenue & Daily Bookings) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Revenue Trend</h3>
              <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded">Weekly</span>
            </div>
            <DashboardRevenueChart adminStats={adminStats} />
          </div>

          <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Daily Bookings</h3>
              <span className="text-[10px] text-neutral-400 font-bold bg-neutral-800 px-2 py-0.5 rounded">Volume</span>
            </div>
            <DashboardBookingsChart adminStats={adminStats} />
          </div>
        </div>

        {/* Row 2: Distribution Insights (User Ratio & Theatre Ratio) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">User Accounts Ratio</h3>
            <DashboardUserDistributionChart adminStats={adminStats} />
          </div>

          <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Theatre Approval Ratio</h3>
            <DashboardTheatreApprovalChart adminStats={adminStats} />
          </div>
        </div>

        {/* Row 3: Leaderboards (Top Movies & Top Theatres in the same row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Top Grossing Movies</h3>
            <DashboardTopMoviesChart adminStats={adminStats} />
          </div>

          <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Top Performing Theatres</h3>
            <DashboardTopTheatresChart adminStats={adminStats} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Stacked Live Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Recent Bookings</h3>
          {adminStats.recentBookings?.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-neutral-400 font-semibold">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-550 uppercase tracking-wider text-[9px] text-left">
                    <th className="pb-2">Booking ID</th>
                    <th className="pb-2">Movie</th>
                    <th className="pb-2 text-right">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {adminStats.recentBookings?.slice(0, 4).map((b) => (
                    <tr key={b._id} className="border-b border-neutral-900/60 hover:bg-neutral-900/10">
                      <td className="py-2.5 font-mono uppercase text-neutral-300">{b.bookingId}</td>
                      <td className="py-2.5 text-neutral-200 truncate max-w-[100px]">{b.show?.movie?.title || 'N/A'}</td>
                      <td className="py-2.5 text-right font-bold text-rose-500">₹{b.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Recent Transactions</h3>
          {adminStats.recentBookings?.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-neutral-400 font-semibold">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-550 uppercase tracking-wider text-[9px] text-left">
                    <th className="pb-2">Payment Ref</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {adminStats.recentBookings?.slice(0, 4).map((b) => (
                    <tr key={b._id} className="border-b border-neutral-900/60 hover:bg-neutral-900/10">
                      <td className="py-2.5 font-mono text-neutral-300 truncate max-w-[90px]">{b.paymentId || 'N/A'}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold uppercase">
                          Success
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-neutral-200">₹{b.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Accounts Table */}
        <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Recent Accounts</h3>
          <div className="space-y-3">
            {adminStats.recentUsers?.slice(0, 2).map((u) => (
              <div key={u._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="text-neutral-200 font-bold">{u.name}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{u.email}</p>
                </div>
                <span className="px-2 py-0.5 bg-rose-600/10 text-rose-500 text-[9px] font-bold rounded uppercase">
                  User
                </span>
              </div>
            ))}
            {adminStats.recentOwners?.slice(0, 2).map((o) => (
              <div key={o._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="text-neutral-200 font-bold">{o.name}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{o.email}</p>
                </div>
                <span className="px-2 py-0.5 bg-neutral-600 text-neutral-400 text-[9px] font-bold rounded uppercase">
                  Owner
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
