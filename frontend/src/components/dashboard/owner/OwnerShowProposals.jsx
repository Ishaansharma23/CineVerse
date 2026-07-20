import React from 'react';
import { FileText } from 'lucide-react';

const OwnerShowProposals = ({ proposals, handleUpdateProposalStatus }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">My Theatre Show Proposals</h2>

      {proposals.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
          <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">No show proposals have been submitted yet.</p>
        </div>
      ) : (
        <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs font-semibold text-neutral-400">
            <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Presenter</th>
                <th className="p-4">Show Details</th>
                <th className="p-4">City</th>
                <th className="p-4">Expected Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {proposals.map((prop) => (
                <tr key={prop._id} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-neutral-200">{prop.name}</p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{prop.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-neutral-300">{prop.showName}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5 uppercase tracking-wider">{prop.category}</p>
                    {prop.message && (
                      <p className="text-[10px] text-neutral-400 mt-1 italic">"{prop.message}"</p>
                    )}
                    {prop.mediaLink && (
                      <p className="text-[10px] mt-1">
                        <a href={prop.mediaLink} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline inline-flex items-center gap-1">
                          View Media Attachment
                        </a>
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-neutral-300 font-bold">{prop.city}</td>
                  <td className="p-4 text-neutral-300 font-bold">₹{prop.expectedPrice}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-extrabold ${
                      prop.status === 'approved'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : prop.status === 'rejected'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                    }`}>
                      {prop.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {prop.status === 'pending_owner' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUpdateProposalStatus(prop._id, 'pending_admin')}
                          className="px-2.5 py-1.5 bg-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer flex-shrink-0"
                        >
                          Approve for Admin
                        </button>
                        <button
                          onClick={() => handleUpdateProposalStatus(prop._id, 'rejected')}
                          className="px-2.5 py-1.5 bg-rose-600/10 border border-rose-500/20 hover:border-rose-500 text-rose-500 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer flex-shrink-0"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerShowProposals;
