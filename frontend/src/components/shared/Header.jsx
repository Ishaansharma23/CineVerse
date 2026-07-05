import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice';
import { useLocation } from '../../context/LocationContext';
import { Search, User, LogOut, LayoutDashboard, Ticket, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';

const Header = ({ onSearchChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';

  const { location } = useLocation();
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchVal);
    }
  };

  const handleSearchInput = (e) => {
    setSearchVal(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully.');
      navigate('/');
    } catch (err) {
      toast.error('Logout failed.');
    }
  };

  return (
    <header className="w-full bg-[#0A0A0A] border-b border-neutral-900 sticky top-0 z-50 text-white select-none">
      {/* Top Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center gap-4">
        {/* Left Side: Brand Logo and Search */}
        <div className="flex items-center gap-8 grow max-w-2xl">
          <Link to="/" className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-white to-rose-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
            CINEVERSE
          </Link>
          
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
            <input
              type="text"
              placeholder="Search movies by title, genre, language..."
              value={searchVal}
              onChange={handleSearchInput}
              className="w-full bg-[#121212] border border-neutral-800 focus:border-neutral-700 rounded-lg py-2 pl-10 pr-4 text-xs text-neutral-300 placeholder-neutral-500 outline-none transition-colors"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
          </form>
        </div>

        {/* Right Side: Geolocation City & Controls */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center text-xs font-semibold text-neutral-400 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-2 animate-ping"></span>
            {location || 'Detecting Location...'}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Admin/Owner Links */}
                {isOwner && (
                  <Link
                    to="/scanner"
                    className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    title="Gate Scanner"
                  >
                    <ScanLine className="w-3.5 h-3.5 text-rose-500" />
                    Scanner
                  </Link>
                )}
                {(isOwner || isAdmin) && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-rose-500" />
                    Dashboard
                  </Link>
                )}

                {/* My Bookings / Profile Link */}
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Ticket className="w-3.5 h-3.5 text-neutral-400" />
                  My Tickets
                </Link>

                {/* User Info & Logout */}
                <div className="flex items-center gap-3 ml-2 border-l border-neutral-800 pl-4">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-semibold text-neutral-200">{user.name}</p>
                    <p className="text-[10px] text-neutral-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 bg-neutral-900/60 hover:bg-rose-950/20 hover:text-rose-400 border border-neutral-850 rounded-lg transition-all cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/10 active:scale-98"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Categories Horizontal Banner */}
      <div className="w-full bg-[#121212]/30 border-t border-neutral-900/60">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex justify-between items-center text-xs select-none">
          <div className="flex items-center gap-6 text-neutral-400 font-semibold">
            <Link to="/stream" className="hover:text-white transition-colors">Stream</Link>
            <Link to="/events" className="hover:text-white transition-colors">Events</Link>
            <Link to="/plays" className="hover:text-white transition-colors">Plays</Link>
            <Link to="/sports" className="hover:text-white transition-colors">Sports</Link>
            <Link to="/activities" className="hover:text-white transition-colors">Activities</Link>
          </div>
          <div className="flex items-center gap-5 text-neutral-450 font-bold uppercase tracking-wider text-[10px]">
            <Link to="/list-your-show" className="hover:text-white transition-colors">List Your Show</Link>
            <Link to="/offers" className="hover:text-white transition-colors">Offers</Link>
            <Link to="/gift-cards" className="hover:text-white transition-colors">Gift Cards</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
