import React from 'react';
import { X } from 'lucide-react';

const CreatePromoModal = ({ isOpen, onClose, onSubmit, form, setForm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Create Promo Offer</h3>
        
        <form onSubmit={onSubmit} className="space-y-4 text-xs font-semibold text-neutral-450">
          <div className="space-y-1">
            <label className="uppercase tracking-wider">Offer Title</label>
            <input
              type="text" required placeholder="e.g. ICICI Card Discount"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Promo Code (Uppercase)</label>
              <input
                type="text" required placeholder="e.g. ICICIBOGO"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none uppercase font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none cursor-pointer"
              >
                <option value="flat">Flat Cash Discount (₹)</option>
                <option value="percentage">Percentage Discount (%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Discount Value</label>
              <input
                type="number" required min="1"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Minimum Spend Required</label>
              <input
                type="number" min="0"
                value={form.minPurchase}
                onChange={(e) => setForm({ ...form, minPurchase: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="uppercase tracking-wider">Offer Description</label>
            <textarea
              required placeholder="Describe the terms and benefits of this code..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none h-20 resize-none"
            />
          </div>

          <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
            Publish Promo Code
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePromoModal;
