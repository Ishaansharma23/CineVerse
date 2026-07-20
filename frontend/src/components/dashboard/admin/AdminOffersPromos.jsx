import React from 'react';
import { Plus, Gift, Trash2 } from 'lucide-react';

const AdminOffersPromos = ({ promos, setShowPromoModal, handleDeletePromo }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Offers & Promo Codes</h2>
        <button
          onClick={() => setShowPromoModal(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Promo
        </button>
      </div>

      {promos.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
          <Gift className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">No promo codes configured yet. Click "Create Promo" to add one!</p>
        </div>
      ) : (
        <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs font-semibold text-neutral-400">
            <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Promo Code</th>
                <th className="p-4">Type</th>
                <th className="p-4">Value</th>
                <th className="p-4">Min Spend</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {promos.map((promo) => (
                <tr key={promo._id} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="p-4 font-bold text-neutral-200">{promo.title}</td>
                  <td className="p-4 font-mono font-black text-rose-500">{promo.code}</td>
                  <td className="p-4 uppercase">{promo.discountType}</td>
                  <td className="p-4 text-neutral-300">
                    {promo.discountType === 'flat' ? `₹${promo.discountValue}` : `${promo.discountValue}%`}
                  </td>
                  <td className="p-4 text-neutral-300">₹{promo.minPurchase}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeletePromo(promo._id)}
                      className="p-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-700 text-neutral-500 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Delete Promo Code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default AdminOffersPromos;
