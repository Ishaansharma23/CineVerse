import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Plus, Sparkles, Building, ArrowRight, AlertTriangle } from 'lucide-react';
import gsap from 'gsap';
import request from '../services/api';

const ListYourShow = () => {
  const [formData, setFormData] = useState({ name: '', email: '', showName: '', category: 'Comedy', city: 'Kolkata', expectedPrice: 200, message: '', theatreId: '', mediaLink: '' });
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [theatres, setTheatres] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchTheatres = async () => {
      try {
        const response = await request('/theatres');
        if (response.success && response.theatres) {
          setTheatres(response.theatres.filter(t => t.status === 'approved'));
          if (response.theatres.length > 0) {
            setFormData(prev => ({ ...prev, theatreId: response.theatres[0]._id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch theatres", err);
      }
    };

    fetchTheatres();

    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await request('/proposals', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to submit proposal.');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* Left Column: Benefits info */}
        <div className="lg:col-span-2 space-y-8 select-none">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" />
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Partner with Cineverse</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">List Your Show & Sell Tickets Online</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Reach thousands of cinema and entertainment fans. Host standups, live plays, or screenings on Cineverse.
            </p>
          </div>

          <div className="space-y-6 pt-4 text-xs font-semibold text-neutral-450 border-t border-neutral-900">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-850 flex items-center justify-center flex-shrink-0">
                <Building className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-neutral-200 text-sm">Auditorium Allocations</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Direct integration with approved IMAX and regular screens.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-850 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-neutral-200 text-sm">Secure Live Seat Locking</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Redis seat locking prevents overselling and duplicate bookings.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Submission Form */}
        <div className="lg:col-span-3 bg-[#121212] border border-neutral-850 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600" />

          {success ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Proposal Submitted!</h2>
              <p className="text-neutral-550 text-xs leading-relaxed max-w-sm mx-auto">
                Our partnerships team will review your show proposal and contact you within 2 business days to schedule screen bookings.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Submit another show
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-neutral-450">
              <h2 className="text-lg font-bold text-neutral-200 border-b border-neutral-900 pb-3 uppercase tracking-wider">
                Show Proposal Details
              </h2>
              
              {error && (
                <div className="p-4 bg-rose-950/10 border border-rose-900/30 text-rose-500 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Show Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Standup Comedy Act"
                    value={formData.showName}
                    onChange={(e) => setFormData({ ...formData, showName: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  >
                    <option value="Comedy">Comedy Standup</option>
                    <option value="Theatre">Theatre Drama</option>
                    <option value="Concert">Music Concert</option>
                    <option value="Workshop">Interactive Workshop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Select Theatre</label>
                  <select
                    required
                    value={formData.theatreId}
                    onChange={(e) => setFormData({ ...formData, theatreId: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  >
                    <option value="" disabled>Select a theatre</option>
                    {theatres.map((t) => (
                      <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Location City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Expected Ticket Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.expectedPrice}
                    onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-655 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Media Link (Video/Drive)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://youtube.com/..."
                    value={formData.mediaLink}
                    onChange={(e) => setFormData({ ...formData, mediaLink: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Event details / Message</label>
                <textarea
                  required
                  placeholder="Outline show timings, artist bios, and screen specifications"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                {submitting ? 'Submitting Proposal...' : 'Submit Proposal'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default ListYourShow;
