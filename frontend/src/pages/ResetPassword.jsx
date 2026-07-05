import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    setLoading(true);

    // Simulate reset request
    setTimeout(() => {
      setLoading(false);
      toast.success('Password updated successfully! Please login.');
      navigate('/auth');
    }, 1500);
  };

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-neutral-850 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-rose-600" />

        <div className="space-y-2 text-center">
          <div className="w-12 h-12 bg-rose-600/10 border border-rose-650/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider">Reset Password</h1>
          <p className="text-xs text-neutral-500 leading-normal max-w-xs mx-auto font-medium">
            Setup a secure, unique password to secure access to your Cineverse account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-neutral-450">
          <div className="space-y-1.5">
            <label className="uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 px-4 text-sm text-neutral-250 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 px-4 text-sm text-neutral-250 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-lg shadow-rose-600/10 cursor-pointer active:scale-98"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-900 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
