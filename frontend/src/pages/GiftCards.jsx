import { useState, useEffect, useRef } from 'react';
import { Gift, Sparkles, Send, Check } from 'lucide-react';
import gsap from 'gsap';

const presetAmounts = [250, 500, 1000, 2000, 5000];

const GiftCards = () => {
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [recipient, setRecipient] = useState('');
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [purchased, setPurchased] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  const handlePurchase = (e) => {
    e.preventDefault();
    setPurchased(true);
  };

  return (
    <div ref={containerRef} className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Title */}
        <div className="border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cineverse Gifting</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Cineverse e-Gift Cards</h1>
          <p className="text-neutral-500 text-sm mt-1">Gift the magic of movies. Send custom digital e-gift cards instantly via email</p>
        </div>

        {purchased ? (
          <div className="max-w-md mx-auto bg-[#121212] border border-neutral-850 p-8 rounded-3xl text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">e-Gift Card Sent!</h2>
            <p className="text-neutral-500 text-xs leading-relaxed">
              We have processed your payment. An e-gift card voucher of <span className="font-extrabold text-rose-500">₹{selectedAmount}</span> has been sent directly to <span className="text-neutral-250 font-bold">{recipient}</span>.
            </p>
            <button
              onClick={() => {
                setPurchased(false);
                setRecipient('');
                setSender('');
                setMessage('');
              }}
              className="px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Send Another Gift
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Side: Custom card design view */}
            <div className="space-y-6">
              <h2 className="text-base font-extrabold uppercase tracking-wider text-neutral-300">Gift Card Preview</h2>
              
              <div className="aspect-[1.58/1] w-full rounded-2xl bg-gradient-to-tr from-neutral-950 via-neutral-900 to-rose-950 border border-neutral-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black tracking-widest text-neutral-100">CINEVERSE</h3>
                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">e-Gift Voucher</p>
                  </div>
                  <Gift className="w-6 h-6 text-rose-500" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider">Voucher Value</span>
                  <p className="text-3xl font-black text-white">₹{selectedAmount}</p>
                </div>
              </div>

              {/* Amount Selection presets */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Choose Amount (INR)</span>
                <div className="flex flex-wrap gap-2.5">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                        selectedAmount === amount
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-[#121212] text-neutral-400 border-neutral-900 hover:border-neutral-850 hover:text-neutral-200'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Form details */}
            <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-5 h-fit shadow-xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300 border-b border-neutral-800 pb-3">Delivery details</h2>
              
              <form onSubmit={handlePurchase} className="space-y-4 text-xs font-semibold text-neutral-450">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Recipient Email</label>
                  <input
                    type="email"
                    required
                    placeholder="friend@example.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Sender Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Message (Optional)</label>
                  <textarea
                    placeholder="Add a friendly movie gift message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-650 rounded-xl p-3 text-neutral-200 outline-none h-16 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send e-Gift Card
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GiftCards;
