import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center p-8 text-white select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md p-8 bg-[#121212]/50 border border-neutral-900 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden"
      >
        {/* Top glowing accent */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-rose-600" />

        {/* Warning Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-500 shadow-lg shadow-rose-500/5 mb-6"
        >
          <XCircle className="w-10 h-10" />
        </motion.div>

        {/* Header and Details */}
        <h3 className="text-xl font-black text-rose-400 tracking-tight uppercase">Payment Failed</h3>
        <p className="text-neutral-300 text-xs mt-4 leading-relaxed font-medium whitespace-pre-line">
          Payment was not completed.<br />
          Your booking has not been confirmed.<br />
          Your reserved seats have been released.<br />
          Please try again.
        </p>

        {/* Home Button */}
        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-750 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default PaymentFailed;
