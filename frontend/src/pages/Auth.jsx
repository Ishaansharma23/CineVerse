import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser } from '../redux/slices/authSlice';
import { KeyRound, Mail, User, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user', // user, owner
  });
  const [errorMsg, setErrorMsg] = useState('');

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (isLogin) {
        const result = await dispatch(loginUser({ email: formData.email, password: formData.password })).unwrap();
        if (result) {
          toast.success(`Welcome back, ${result.name}!`);
          navigate(redirectPath, { replace: true });
        }
      } else {
        const result = await dispatch(
          registerUser({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          })
        ).unwrap();
        if (result) {
          toast.success('Registration successful! Welcome to Cineverse.');
          navigate(redirectPath, { replace: true });
        }
      }
    } catch (err) {
      setErrorMsg(err || 'Authentication failed. Please try again.');
      toast.error(err || 'Authentication failed.');
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-neutral-850 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-rose-600" />
        
        <div className="space-y-1.5 text-center select-none">
          <h1 className="text-2xl font-black uppercase tracking-wider">Cineverse Auth</h1>
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
            {isLogin ? 'Sign In to Your Workspace' : 'Register Partner / Customer Accounts'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/20 border border-rose-900/35 p-3.5 rounded-xl text-xs text-rose-455 font-semibold text-center leading-normal">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-neutral-450">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-250 placeholder-neutral-600 outline-none transition-colors"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-255 placeholder-neutral-600 outline-none transition-colors"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="uppercase tracking-wider">Password</label>
              {isLogin && (
                <Link to="/forgot-password" className="text-[10px] text-rose-500 font-bold hover:underline">
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-250 placeholder-neutral-600 outline-none transition-colors"
              />
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Account Type</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-200 appearance-none outline-none transition-colors"
                >
                  <option value="user">Customer (User)</option>
                  <option value="owner">Cinema Partner (Owner)</option>
                </select>
                <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-550 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-lg shadow-rose-600/10 cursor-pointer active:scale-98"
          >
            {loading ? 'Verifying...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-850 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="text-neutral-450 hover:text-white text-xs font-medium tracking-wide transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
