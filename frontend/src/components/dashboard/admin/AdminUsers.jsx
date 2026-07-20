import React from 'react';
import { ShieldAlert } from 'lucide-react';
import request from '../../../services/api';
import toast from 'react-hot-toast';

const AdminUsers = ({ usersList, setUsersList, searchTerm, setSearchTerm, currentPage, itemsPerPage }) => {
  const pendingPartners = usersList.filter(u => u.role === 'owner' && u.verificationStatus === 'pending');
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Partner Verification Applications List */}
      {pendingPartners.length > 0 && (
        <div className="space-y-4 bg-yellow-950/5 border border-yellow-600/10 p-6 rounded-2xl animate-fadeIn">
          <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-500 animate-pulse" />
            Pending Partner Verification Requests ({pendingPartners.length})
          </h3>
          
          <div className="bg-[#121212] border border-neutral-850 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs font-semibold text-neutral-455">
              <thead className="bg-neutral-900/60 border-b border-neutral-900 text-neutral-500 uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {pendingPartners.map((partner) => (
                  <tr key={partner._id} className="hover:bg-neutral-900/10">
                    <td className="p-4 text-neutral-200 font-bold">{partner.name}</td>
                    <td className="p-4 font-mono text-neutral-400">{partner.email}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await request('/auth/verify-partner', {
                              method: 'PUT',
                              body: JSON.stringify({ userId: partner._id, status: 'approved' })
                            });
                            if (res.success) {
                              toast.success('Partner application approved!');
                              setUsersList(prev => prev.map(u => u._id === partner._id ? { ...u, verificationStatus: 'approved' } : u));
                            } else {
                              toast.error(res.message || 'Verification update failed.');
                            }
                          } catch (err) {
                            toast.error(err.message || 'Network error.');
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600/15 border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 font-extrabold uppercase rounded-lg text-[10px] tracking-wide transition-all cursor-pointer flex-shrink-0"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await request('/auth/verify-partner', {
                              method: 'PUT',
                              body: JSON.stringify({ userId: partner._id, status: 'rejected' })
                            });
                            if (res.success) {
                              toast.success('Partner application rejected.');
                              setUsersList(prev => prev.map(u => u._id === partner._id ? { ...u, verificationStatus: 'rejected' } : u));
                            } else {
                              toast.error(res.message || 'Verification update failed.');
                            }
                          } catch (err) {
                            toast.error(err.message || 'Network error.');
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600/15 border border-rose-500/20 hover:border-rose-500 text-rose-500 font-extrabold uppercase rounded-lg text-[10px] tracking-wide transition-all cursor-pointer flex-shrink-0"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Registered Accounts</h2>
        <input
          type="text"
          placeholder="Search user by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#121212] border border-neutral-850 px-4 py-2 rounded-xl text-xs outline-none text-neutral-300 placeholder-neutral-600 w-64"
        />
      </div>

      <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs font-semibold text-neutral-400">
          <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => (
              <tr key={user._id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="p-4 text-neutral-200 font-extrabold">{user.name}</td>
                <td className="p-4 font-mono text-neutral-400">{user.email}</td>
                <td className="p-4 uppercase tracking-wider text-[10px]">{user.role}</td>
                <td className="p-4">
                  {user.role === 'owner' ? (
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border font-extrabold ${
                      user.verificationStatus === 'approved'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : user.verificationStatus === 'rejected'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 animate-pulse'
                    }`}>
                      {user.verificationStatus}
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
