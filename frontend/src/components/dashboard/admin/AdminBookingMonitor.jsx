import React from 'react';

const AdminBookingMonitor = ({ bookingsList, searchTerm, setSearchTerm, currentPage, itemsPerPage }) => {
  const filteredBookings = bookingsList.filter(b => 
    b.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Live Platform Transactions</h2>
        <input
          type="text"
          placeholder="Search bookings by ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#121212] border border-neutral-850 px-4 py-2 rounded-xl text-xs outline-none text-neutral-300 placeholder-neutral-600 w-64"
        />
      </div>

      <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs font-semibold text-neutral-400">
          <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
            <tr>
              <th className="p-4">Booking Ref</th>
              <th className="p-4">User</th>
              <th className="p-4">Details</th>
              <th className="p-4">Seats</th>
              <th className="p-4">Total Paid</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking) => (
              <tr key={booking._id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="p-4 font-mono text-neutral-250 font-extrabold">{booking.bookingId}</td>
                <td className="p-4">
                  <p className="text-neutral-200 font-bold">{booking.user?.name || 'Customer'}</p>
                  <p className="text-[10px] text-neutral-500 font-medium">{booking.user?.email || 'N/A'}</p>
                </td>
                <td className="p-4">
                  <p className="text-neutral-300">{booking.show?.movie?.title || 'Cinema'}</p>
                  <p className="text-[10px] text-neutral-550">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="p-4 font-mono">{booking.seats?.join(', ') || 'Seats'}</td>
                <td className="p-4 font-extrabold text-rose-500">₹{booking.totalAmount}</td>
                <td className="p-4 uppercase tracking-wider text-[9px]">
                  <span className={`px-2 py-0.5 rounded border font-extrabold uppercase ${
                    booking.bookingStatus === 'booked' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-rose-550/15 border-rose-900/25 text-rose-500'
                  }`}>
                    {booking.bookingStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBookingMonitor;
