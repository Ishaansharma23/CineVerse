import React from 'react';
import { X } from 'lucide-react';

const TheatreRegistrationModal = ({ isOpen, onClose, onSubmit, form, setForm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Register New Theatre</h3>
        
        <form onSubmit={onSubmit} className="space-y-4 text-xs font-semibold text-neutral-450">
          <div className="space-y-1">
            <label className="uppercase tracking-wider">Theatre Name</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">City</label>
              <input
                type="text" required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Amenities</label>
              <input
                type="text" placeholder="e.g. IMAX, Dolby, Food Court"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="uppercase tracking-wider">Full Address</label>
            <input
              type="text" required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="uppercase tracking-wider">Brief Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none h-20 resize-none"
            />
          </div>

          <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
            Submit Theatre Details
          </button>
        </form>
      </div>
    </div>
  );
};

export default TheatreRegistrationModal;
