import React from 'react';
import { X } from 'lucide-react';

const ScreenConfigurationModal = ({ isOpen, onClose, onSubmit, form, setForm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Configure Screen Layout</h3>
        
        <form onSubmit={onSubmit} className="space-y-4 text-xs font-semibold text-neutral-450">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Screen Number</label>
              <input
                type="text" required placeholder="e.g. 1"
                value={form.screenNumber}
                onChange={(e) => setForm({ ...form, screenNumber: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Screen Category</label>
              <select
                value={form.screenType}
                onChange={(e) => setForm({ ...form, screenType: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              >
                <option value="2D">Standard 2D</option>
                <option value="3D">Standard 3D</option>
                <option value="IMAX">Premium IMAX</option>
                <option value="4DX">Premium 4DX</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Total Grid Rows</label>
              <input
                type="number" required min="1" max="20"
                value={form.totalRows}
                onChange={(e) => setForm({ ...form, totalRows: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Seats per Row</label>
              <input
                type="number" required min="1" max="25"
                value={form.seatsPerRow}
                onChange={(e) => setForm({ ...form, seatsPerRow: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="uppercase tracking-wider">Specific Features</label>
            <input
              type="text" placeholder="e.g. Dolby Atmos Sound system"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
            />
          </div>

          <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
            Configure Layout
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScreenConfigurationModal;
