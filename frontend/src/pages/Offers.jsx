import { useEffect, useState } from 'react';
import { Sparkles, Gift, Tag, Check, Copy } from 'lucide-react';
import gsap from 'gsap';
import request from '../services/api';

const Offers = () => {
  const [offersList, setOffersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const res = await request('/offers');
        if (res.success) {
          setOffersList(res.offers || []);
        } else {
          setError(res.message || 'Failed to load offers.');
        }
      } catch (err) {
        setError(err.message || 'Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (!loading && offersList.length > 0) {
      gsap.fromTo(
        '.offer-card',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [loading, offersList]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Title */}
        <div className="border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Active Offers</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Exclusive Cinema Discounts</h1>
          <p className="text-neutral-500 text-sm mt-1">Copy coupon codes to unlock flat discounts, banking cashbacks, and buy-one-get-one deals</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse select-none">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-[#121212]/40 border border-neutral-900 p-6 rounded-2xl h-36 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-neutral-900 rounded-md w-20" />
                  <div className="h-7 bg-neutral-900 rounded-lg w-28" />
                </div>
                <div className="h-4 bg-neutral-900 rounded-md w-3/4" />
                <div className="h-4 bg-neutral-900 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-24 text-center border border-dashed border-rose-900/40 rounded-3xl bg-rose-950/5 max-w-xl mx-auto px-6">
            <Tag className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-base font-bold text-rose-450 uppercase tracking-wide">Failed to load promos</h3>
            <p className="text-neutral-500 text-xs mt-2 font-semibold">{error}</p>
          </div>
        ) : offersList.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20 max-w-xl mx-auto px-6">
            <Gift className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-300">No active offers</h3>
            <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
              Check back later for exclusive movie deals, bank cards cashback, and special discounts!
            </p>
          </div>
        ) : (
          /* Offers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offersList.map((offer) => (
              <div
                key={offer._id}
                className="offer-card bg-[#121212]/40 border border-neutral-900 hover:border-neutral-850 p-6 rounded-2xl flex flex-col justify-between gap-6 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-rose-600/10 border border-rose-600/20 text-rose-500 font-extrabold text-[9px] tracking-wider uppercase rounded">
                      {offer.discountType} Discount
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-neutral-350 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-lg">
                      <span>{offer.code}</span>
                      <button
                        onClick={() => handleCopy(offer.code)}
                        className="ml-1.5 p-1 hover:bg-neutral-800 hover:text-white rounded transition-colors cursor-pointer"
                        title="Copy Code"
                      >
                        {copiedCode === offer.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-neutral-100">{offer.title}</h3>
                  <p className="text-neutral-500 text-xs leading-relaxed">{offer.description}</p>
                  <div className="flex gap-4 text-[10px] text-neutral-500 font-semibold pt-1 border-t border-neutral-900/40">
                    <span>Min Purchase: ₹{offer.minPurchase}</span>
                    <span>•</span>
                    <span>Value: {offer.discountType === 'flat' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
