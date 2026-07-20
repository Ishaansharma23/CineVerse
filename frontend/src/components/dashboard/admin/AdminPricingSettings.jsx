import React from 'react';

const AdminPricingSettings = ({ gstRate, setGstRate, convenienceFee, setConvenienceFee, savingPricing, onSubmit }) => {
  return (
    <div className="max-w-xl space-y-6 animate-fadeIn">
      <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Pricing Configuration</h2>
      
      <form onSubmit={onSubmit} className="bg-[#121212] border border-neutral-850 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold uppercase text-neutral-450 tracking-wider">GST Rate (%)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 18"
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              className="bg-neutral-900/60 border border-neutral-850 focus:border-rose-650 rounded-xl px-4 py-3 text-xs font-semibold text-neutral-250 outline-none placeholder-neutral-700 w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold uppercase text-neutral-450 tracking-wider">Convenience Fee (₹ per ticket)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 30"
              value={convenienceFee}
              onChange={(e) => setConvenienceFee(e.target.value)}
              className="bg-neutral-900/60 border border-neutral-850 focus:border-rose-650 rounded-xl px-4 py-3 text-xs font-semibold text-neutral-250 outline-none placeholder-neutral-700 w-full"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPricing}
          className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-lg shadow-rose-600/10 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {savingPricing ? 'Saving settings...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default AdminPricingSettings;
