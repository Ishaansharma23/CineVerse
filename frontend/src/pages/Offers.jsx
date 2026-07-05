import { useEffect, useState } from 'react';
import { Sparkles, Gift, Tag, Check, Copy } from 'lucide-react';
import gsap from 'gsap';

const offersList = [
  { id: 1, title: 'Cineverse Welcome Offer', code: 'CINESTART100', description: 'Get ₹100 discount on your first ticket booking.', type: 'General' },
  { id: 2, title: 'HDFC Bank Credit Cards Deal', code: 'HDFCBOGO', description: 'Buy 1 Get 1 Free on premium recliners and IMAX seats.', type: 'Banking' },
  { id: 3, title: 'ICICI Bank Debit Cards Offer', code: 'ICICIMAX', description: 'Flat 20% discount on convenience handling fees.', type: 'Banking' },
  { id: 4, title: 'Weekend Movie Night Special', code: 'WEEKEND30', description: 'Get 30% off on snack bar vouchers when booked with tickets.', type: 'Snacks' },
];

const Offers = () => {
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    gsap.fromTo(
      '.offer-card',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, []);

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

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offersList.map((offer) => (
            <div
              key={offer.id}
              className="offer-card bg-[#121212]/40 border border-neutral-900 hover:border-neutral-850 p-6 rounded-2xl flex flex-col justify-between gap-6 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-rose-650/10 border border-rose-600/20 text-rose-500 font-extrabold text-[9px] tracking-wider uppercase rounded">
                    {offer.type} Promo
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Offers;
