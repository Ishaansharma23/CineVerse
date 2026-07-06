import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/slices/authSlice';
import { movieService } from '../services/movieService';
import request from '../services/api';
import { 
  Film, Plus, ShieldCheck, MapPin, Tv, Calendar, Eye, Trash2, ArrowRight, 
  User, TrendingUp, DollarSign, Ticket, RefreshCw, BarChart2, PlusCircle, 
  Check, X, ShieldAlert, Users, Award, Gift, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux Auth state
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState(''); // owner: theatres, screens, shows, analytics | admin: overview, users, theatres, bookings
  
  // Data lists
  const [theatres, setTheatres] = useState([]);
  const [pendingTheatres, setPendingTheatres] = useState([]);
  const [screens, setScreens] = useState({});
  const [shows, setShows] = useState({});
  const [moviesList, setMoviesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [ownerBookings, setOwnerBookings] = useState([]);

  // Proposals & Offers
  const [proposals, setProposals] = useState([]);
  const [promos, setPromos] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({ title: '', code: '', description: '', discountType: 'flat', discountValue: 0, minPurchase: 0 });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected identifiers
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');

  // Modals state
  const [showTheatreModal, setShowTheatreModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [showShowModal, setShowShowModal] = useState(false);

  // Form states
  const [theatreForm, setTheatreForm] = useState({ name: '', description: '', city: '', address: '', amenities: '' });
  const [screenForm, setScreenForm] = useState({ screenNumber: '', screenType: '2D', totalRows: 8, seatsPerRow: 10, features: '' });
  const [showForm, setShowForm] = useState({ movieId: '', date: '', startTime: '', endTime: '', price: 150 });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [detailModal, setDetailModal] = useState({ isOpen: false, type: '', title: '' });
  
  const containerRef = useRef(null);

  // Computed Owner Analytics
  const ownerTotalBookings = ownerBookings.filter(b => b.bookingStatus === 'booked').length;
  const ownerTotalRevenue = ownerBookings
    .filter(b => b.bookingStatus === 'booked')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const pendingPartners = usersList.filter(u => u.role === 'owner' && u.verificationStatus === 'pending');

  let ownerTotalCapacity = 0;
  let ownerTotalBookedSeats = 0;
  const currentTheatreShows = shows[selectedTheatreId] || [];
  currentTheatreShows.forEach(show => {
    const screen = show.screen || {};
    const capacity = (screen.totalRows || 8) * (screen.seatsPerRow || 10);
    ownerTotalCapacity += capacity;
    const showBookings = ownerBookings.filter(b => b.show?._id === show._id && b.bookingStatus === 'booked');
    showBookings.forEach(b => {
      ownerTotalBookedSeats += (b.seats?.length || 0);
    });
  });
  const ownerOccupancyRatio = ownerTotalCapacity > 0
    ? ((ownerTotalBookedSeats / ownerTotalCapacity) * 100).toFixed(1)
    : '0';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (isOwner) {
      setActiveTab('theatres');
      loadOwnerData();
    } else if (isAdmin) {
      setActiveTab('overview');
      loadAdminData();
    } else {
      navigate('/');
    }
  }, [user, isAuthenticated, isOwner, isAdmin]);

  // Entrance tab animations and lazy loading dynamic lists
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }

    if (activeTab === 'proposals' && (isOwner || isAdmin)) {
      request('/proposals')
        .then(res => {
          if (res.success) setProposals(res.proposals || []);
        })
        .catch(err => console.error(err));
    } else if (activeTab === 'promos' && isAdmin) {
      request('/offers')
        .then(res => {
          if (res.success) setPromos(res.offers || []);
        })
        .catch(err => console.error(err));
    }
  }, [activeTab, isOwner, isAdmin]);

  const handleUpdateProposalStatus = async (proposalId, status) => {
    try {
      const res = await request(`/proposals/${proposalId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        toast.success(`Proposal ${status} successfully!`);
        setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status } : p));
      } else {
        toast.error(res.message || 'Failed to update proposal status.');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating proposal status.');
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      const res = await request('/offers', {
        method: 'POST',
        body: JSON.stringify(promoForm)
      });
      if (res.success) {
        toast.success('Promo code created successfully!');
        setPromos(prev => [res.offer, ...prev]);
        setShowPromoModal(false);
        setPromoForm({ title: '', code: '', description: '', discountType: 'flat', discountValue: 0, minPurchase: 0 });
      } else {
        toast.error(res.message || 'Failed to create promo code.');
      }
    } catch (err) {
      toast.error(err.message || 'Error creating promo code.');
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const res = await request(`/offers/${promoId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        toast.success('Promo code deleted successfully!');
        setPromos(prev => prev.filter(p => p._id !== promoId));
      } else {
        toast.error(res.message || 'Failed to delete promo code.');
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting promo code.');
    }
  };

  // Load Owner Data
  const loadOwnerData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await request('/theatres/my');
      setTheatres(res.theatres || []);
      
      const [trending, recommended] = await Promise.all([
        movieService.getTrendingMovies(20),
        movieService.getRecommendedMovies(20),
      ]);
      const combined = [...trending.movies, ...recommended.movies];
      const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values());
      setMoviesList(unique);

      if (res.theatres && res.theatres.length > 0) {
        setSelectedTheatreId(res.theatres[0]._id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load owner data.');
    } finally {
      setLoading(false);
    }
  };

  // Load Owner Screens, Shows & Bookings
  useEffect(() => {
    if (!selectedTheatreId || !isOwner) {
      setOwnerBookings([]);
      return;
    }

    const fetchScreensAndShows = async () => {
      try {
        const screenRes = await request(`/screens/my/${selectedTheatreId}`);
        setScreens((prev) => ({ ...prev, [selectedTheatreId]: screenRes.screens || [] }));

        if (screenRes.screens && screenRes.screens.length > 0) {
          setSelectedScreenId(screenRes.screens[0]._id);
        } else {
          setSelectedScreenId('');
        }

        const showRes = await request(`/shows/my/${selectedTheatreId}`);
        setShows((prev) => ({ ...prev, [selectedTheatreId]: showRes.shows || [] }));

        const bookingsRes = await request(`/bookings/owner/${selectedTheatreId}`);
        if (bookingsRes.success) {
          setOwnerBookings(bookingsRes.bookings || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchScreensAndShows();
  }, [selectedTheatreId, isOwner]);

  // Auto-initialize selectedScreenId when scheduling modal opens
  useEffect(() => {
    if (showShowModal && !selectedScreenId && screens[selectedTheatreId]?.length > 0) {
      setSelectedScreenId(screens[selectedTheatreId][0]._id);
    }
  }, [showShowModal, selectedTheatreId, screens, selectedScreenId]);

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      // Load stats
      const statsRes = await request('/theatres/admin/stats');
      if (statsRes.success) setAdminStats(statsRes.stats);

      // Load pending theatres
      const pendingRes = await request('/theatres/admin/pending');
      if (pendingRes.success) setPendingTheatres(pendingRes.theatres || []);

      // Load all users
      const usersRes = await request('/auth/admin/users');
      if (usersRes.success) setUsersList(usersRes.users || []);

      // Load all bookings
      const bookingsRes = await request('/bookings/admin/all');
      if (bookingsRes.success) setBookingsList(bookingsRes.bookings || []);

      // Load theatres list
      const theatresRes = await request('/theatres');
      if (theatresRes.success) setTheatres(theatresRes.theatres || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load administrative console data.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Action - Create Theatre
  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    try {
      const res = await request('/theatres', {
        method: 'POST',
        body: JSON.stringify(theatreForm),
      });
      if (res.success) {
        toast.success('Theatre submitted for admin approval!');
        setShowTheatreModal(false);
        setTheatreForm({ name: '', description: '', city: '', address: '', amenities: '' });
        loadOwnerData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to register theatre.');
    }
  };

  // Quick Action - Create Screen
  const handleCreateScreen = async (e) => {
    e.preventDefault();
    if (!selectedTheatreId) return;
    try {
      const payload = {
        ...screenForm,
        theatreId: selectedTheatreId,
        totalRows: Number(screenForm.totalRows),
        seatsPerRow: Number(screenForm.seatsPerRow),
      };
      const res = await request('/screens', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        toast.success('Screen registered successfully!');
        setShowScreenModal(false);
        setScreenForm({ screenNumber: '', screenType: '2D', totalRows: 8, seatsPerRow: 10, features: '' });
        
        // Reload screens
        const screenRes = await request(`/screens/my/${selectedTheatreId}`);
        setScreens((prev) => ({ ...prev, [selectedTheatreId]: screenRes.screens || [] }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create screen.');
    }
  };

  // Quick Action - Create Show
  const handleCreateShow = async (e) => {
    e.preventDefault();
    if (!selectedTheatreId || !selectedScreenId) {
      toast.error('Please select both a theatre and screen.');
      return;
    }
    try {
      const payload = {
        ...showForm,
        screenId: selectedScreenId,
        price: Number(showForm.price),
      };
      const res = await request('/shows', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        toast.success('Show scheduled successfully!');
        setShowShowModal(false);
        setShowForm({ movieId: '', date: '', startTime: '', endTime: '', price: 150 });
        
        // Reload shows
        const showRes = await request(`/shows/my/${selectedTheatreId}`);
        setShows((prev) => ({ ...prev, [selectedTheatreId]: showRes.shows || [] }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to schedule show.');
    }
  };

  // Delete/Cancel Show
  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Are you sure you want to cancel/delete this show?')) return;
    try {
      const res = await request(`/shows/${showId}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Show cancelled successfully.');
        const showRes = await request(`/shows/my/${selectedTheatreId}`);
        setShows((prev) => ({ ...prev, [selectedTheatreId]: showRes.shows || [] }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel show.');
    }
  };

  // Admin approval direct click
  const handleApproveTheatre = async (theatreId, name) => {
    try {
      const res = await request(`/theatres/approve/${theatreId}`, {
        method: 'PATCH',
      });
      if (res.success) {
        toast.success(`Theatre "${name}" approved successfully!`);
        loadAdminData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to approve theatre.');
    }
  };

  // Filtering lists
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookingsList.filter(b => 
    b.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Admin Dashboard Chart Helper Renderers ---

  const drawRevenueLineChart = () => {
    const data = adminStats?.graphData || [];
    if (data.length === 0) {
      return (
        <div className="h-48 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
          No Data Available
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };

    const maxVal = Math.max(...data.map(d => d.revenue), 100);
    const minVal = 0;
    const range = maxVal - minVal;

    const getX = (index) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
    const getY = (value) => height - padding.bottom - ((value - minVal) / range) * (height - padding.top - padding.bottom);

    const points = data.map((d, idx) => ({ x: getX(idx), y: getY(d.revenue) }));
    
    let pathStr = '';
    if (points.length > 0) {
      pathStr = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    const fillPathStr = points.length > 0 
      ? `${pathStr} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
      : '';

    return (
      <div className="w-full relative h-48">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 4 }).map((_, i) => {
            const yVal = minVal + (range / 3) * i;
            const yPos = getY(yVal);
            return (
              <g key={i}>
                <line x1={padding.left} y1={yPos} x2={width - padding.right} y2={yPos} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padding.left - 10} y={yPos + 3} fill="#4B5563" fontSize="8" fontWeight="bold" textAnchor="end">
                  ₹{Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Fill Area */}
          {fillPathStr && <path d={fillPathStr} fill="url(#revGrad)" />}

          {/* Line */}
          {pathStr && <path d={pathStr} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Interactive Dots */}
          {points.map((p, idx) => (
            <g key={idx} className="group/dot cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#0A0A0A" stroke="#f43f5e" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="8" fill="#f43f5e" fillOpacity="0" className="hover:fill-opacity-20 transition-all" />
            </g>
          ))}

          {/* X Axis Labels */}
          {data.map((d, idx) => {
            const formattedDate = new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            return (
              <text key={idx} x={getX(idx)} y={height - 10} fill="#4B5563" fontSize="8" fontWeight="bold" textAnchor="middle">
                {formattedDate}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  const drawBookingsBarChart = () => {
    const data = adminStats?.graphData || [];
    if (data.length === 0) {
      return (
        <div className="h-48 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
          No Data Available
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };

    const maxVal = Math.max(...data.map(d => d.bookings), 10);
    const minVal = 0;
    const range = maxVal - minVal;

    const barWidth = Math.max(12, (width - padding.left - padding.right) / (data.length * 1.6));
    const getX = (index) => padding.left + (index / data.length) * (width - padding.left - padding.right) + barWidth / 2;
    const getY = (value) => height - padding.bottom - ((value - minVal) / range) * (height - padding.top - padding.bottom);

    return (
      <div className="w-full relative h-48">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 4 }).map((_, i) => {
            const yVal = minVal + (range / 3) * i;
            const yPos = getY(yVal);
            return (
              <g key={i}>
                <line x1={padding.left} y1={yPos} x2={width - padding.right} y2={yPos} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padding.left - 10} y={yPos + 3} fill="#4B5563" fontSize="8" fontWeight="bold" textAnchor="end">
                  {Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, idx) => {
            const x = getX(idx);
            const y = getY(d.bookings);
            const barHeight = height - padding.bottom - y;

            return (
              <g key={idx} className="group/bar cursor-pointer">
                <rect
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#barGrad)"
                  rx="3"
                  className="hover:fill-rose-500 transition-colors duration-150"
                />
                <text
                  x={x}
                  y={y - 5}
                  fill="#F3F4F6"
                  fontSize="8"
                  fontWeight="black"
                  textAnchor="middle"
                  className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150"
                >
                  {d.bookings}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, idx) => {
            const formattedDate = new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            return (
              <text key={idx} x={getX(idx)} y={height - 10} fill="#4B5563" fontSize="8" fontWeight="bold" textAnchor="middle">
                {formattedDate}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  const drawUserDistributionPieChart = () => {
    const users = adminStats?.totalUsers || 0;
    const owners = adminStats?.totalOwners || 0;
    const total = users + owners;

    if (total === 0) {
      return (
        <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
          No Data Available
        </div>
      );
    }

    const circumference = 251.3;
    const userPct = (users / total) * 100;
    const ownerPct = (owners / total) * 100;
    const userStroke = (users / total) * circumference;

    return (
      <div className="w-full flex items-center justify-center gap-12 h-44">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1A1A1A" strokeWidth="12" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#404040"
              strokeWidth="12"
              strokeDasharray={`${circumference}`}
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth="12"
              strokeDasharray={`${userStroke} ${circumference}`}
              strokeDashoffset="0"
            />
          </svg>
          <div className="absolute flex flex-col items-center select-none">
            <p className="text-lg font-black text-white">{total}</p>
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-550">Accounts</span>
          </div>
        </div>

        <div className="space-y-3 font-semibold text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-rose-600 rounded-full" />
            <div>
              <p className="text-neutral-250">Customers</p>
              <p className="text-[10px] text-neutral-500">{users} ({Math.round(userPct)}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-neutral-600 rounded-full" />
            <div>
              <p className="text-neutral-250">Theatre Owners</p>
              <p className="text-[10px] text-neutral-500">{owners} ({Math.round(ownerPct)}%)</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const drawTheatreApprovalDoughnutChart = () => {
    const approved = adminStats?.totalTheatres || 0;
    const pending = adminStats?.pendingTheatreApprovals || 0;
    const total = approved + pending;

    if (total === 0) {
      return (
        <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
          No Data Available
        </div>
      );
    }

    const circumference = 251.3;
    const approvedPct = (approved / total) * 100;
    const pendingPct = (pending / total) * 100;
    const approvedStroke = (approved / total) * circumference;

    return (
      <div className="w-full flex items-center justify-center gap-12 h-44">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1A1A1A" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeDasharray={`${circumference}`}
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray={`${approvedStroke} ${circumference}`}
              strokeDashoffset="0"
            />
          </svg>
          <div className="absolute flex flex-col items-center select-none">
            <p className="text-lg font-black text-white">{total}</p>
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-550">Theatres</span>
          </div>
        </div>

        <div className="space-y-3 font-semibold text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full" />
            <div>
              <p className="text-neutral-250">Approved</p>
              <p className="text-[10px] text-neutral-500">{approved} ({Math.round(approvedPct)}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full" />
            <div>
              <p className="text-neutral-250">Pending Queue</p>
              <p className="text-[10px] text-neutral-500">{pending} ({Math.round(pendingPct)}%)</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const drawTopMoviesHorizontalChart = () => {
    const movies = adminStats?.topMovies || [];
    if (movies.length === 0) {
      return (
        <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
          No Data Available
        </div>
      );
    }

    const maxVal = Math.max(...movies.map(m => m.revenue), 100);

    return (
      <div className="w-full space-y-4 h-44 overflow-y-auto pr-2">
        {movies.map((m, idx) => {
          const pct = (m.revenue / maxVal) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-neutral-350">
                <span className="truncate max-w-[250px]">{m.title}</span>
                <span className="text-rose-500">₹{m.revenue.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${pct}%` }} 
                  className="h-full bg-gradient-to-r from-rose-700 to-rose-500 rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const drawTopTheatresVerticalChart = () => {
    const theatres = adminStats?.topTheatres || [];
    if (theatres.length === 0) {
      return (
        <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
          No Data Available
        </div>
      );
    }

    const width = 360;
    const height = 150;
    const padding = { top: 20, right: 10, bottom: 25, left: 40 };

    const maxVal = Math.max(...theatres.map(t => t.revenue), 100);
    const minVal = 0;
    const range = maxVal - minVal;

    const barWidth = Math.max(16, (width - padding.left - padding.right) / (theatres.length * 1.8));
    const getX = (index) => padding.left + (index / theatres.length) * (width - padding.left - padding.right) + barWidth / 2;
    const getY = (value) => height - padding.bottom - ((value - minVal) / range) * (height - padding.top - padding.bottom);

    return (
      <div className="w-full relative h-44">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="theatreBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 3 }).map((_, i) => {
            const yVal = minVal + (range / 2) * i;
            const yPos = getY(yVal);
            return (
              <g key={i}>
                <line x1={padding.left} y1={yPos} x2={width - padding.right} y2={yPos} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padding.left - 8} y={yPos + 3} fill="#4B5563" fontSize="7" fontWeight="bold" textAnchor="end">
                  ₹{Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {theatres.map((t, idx) => {
            const x = getX(idx);
            const y = getY(t.revenue);
            const barHeight = height - padding.bottom - y;

            return (
              <g key={idx} className="group/tbar cursor-pointer">
                <rect
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#theatreBarGrad)"
                  rx="2"
                  className="hover:fill-emerald-400 transition-colors duration-150"
                />
                <text
                  x={x}
                  y={height - 8}
                  fill="#4B5563"
                  fontSize="6"
                  fontWeight="black"
                  textAnchor="middle"
                  className="truncate max-w-[45px]"
                >
                  {t.name?.length > 10 ? t.name.slice(0, 8) + '..' : t.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (isOwner && user?.verificationStatus !== 'approved') {
    return (
      <div className="bg-[#0A0A0A] text-white min-h-screen py-24 px-4 md:px-8 flex items-center justify-center select-none animate-fadeIn">
        <div className="max-w-md w-full bg-[#121212] border border-neutral-850 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600" />
          
          {user?.verificationStatus === 'rejected' ? (
            <>
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold">Registration Rejected</h2>
              <p className="text-neutral-500 text-xs leading-relaxed font-semibold">
                Your request to join CineVerse as a Theatre Partner has been declined. Please contact our administrative support for details regarding verification requirements.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <ShieldAlert className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Partner Account Under Review</h2>
              <p className="text-neutral-500 text-xs leading-relaxed font-semibold">
                Your owner registration is currently pending review by our administrator team. 
                All dashboard controls and ticketing slots will be unlocked once verification is complete.
              </p>
            </>
          )}

          <div className="pt-4 border-t border-neutral-900 flex flex-col gap-2">
            <button
              onClick={async () => {
                try {
                  await dispatch(logoutUser()).unwrap();
                  toast.success('Logged out successfully.');
                  navigate('/auth');
                } catch (err) {
                  toast.error('Logout failed.');
                }
              }}
              className="w-full py-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sign out / Change Account
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Console */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-6 select-none">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Enterprise Console</h1>
            <p className="text-xs text-neutral-500 font-semibold mt-1">
              {isAdmin ? 'Platform Administration Dashboard' : 'Cinema Partner & Screen Management'}
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <>
                <button
                  onClick={() => setActiveTab('theatres')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'theatres' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  My Theatres
                </button>
                <button
                  onClick={() => setActiveTab('screens')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'screens' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Screens
                </button>
                <button
                  onClick={() => setActiveTab('shows')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'shows' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Shows
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'analytics' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('proposals')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'proposals' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Show Proposals
                </button>
              </>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'overview' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'users' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('theatres_admin')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'theatres_admin' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Theatres Approval
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'bookings' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Bookings Monitor
                </button>
                <button
                  onClick={() => setActiveTab('promos')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'promos' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Offers & Promos
                </button>
                <button
                  onClick={() => setActiveTab('proposals')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'proposals' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Show Proposals
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        {errorMsg ? (
          <div className="py-20 text-center border border-dashed border-rose-900/40 rounded-3xl bg-rose-950/5 max-w-xl mx-auto px-6 select-none">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-base font-bold text-rose-400 uppercase tracking-wide">Sync Failure</h3>
            <p className="text-neutral-500 text-xs mt-2 leading-relaxed font-semibold">
              {errorMsg}
            </p>
            <button
              onClick={() => isAdmin ? loadAdminData() : loadOwnerData()}
              className="mt-6 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-6 animate-pulse select-none">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-20 bg-neutral-900/60 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 h-[380px] bg-neutral-900/60 rounded-2xl" />
              <div className="lg:col-span-4 h-[380px] bg-neutral-900/60 rounded-2xl" />
            </div>
          </div>
        ) : (
          <div ref={containerRef}>
          
          {/* OWNER: Theatres Tab */}
          {activeTab === 'theatres' && isOwner && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">My Theatres</h2>
                <button
                  onClick={() => setShowTheatreModal(true)}
                  className="flex items-center gap-2 bg-rose-650 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Theatre
                </button>
              </div>

              {theatres.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
                  <Tv className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 text-sm">No theatres registered. Register your first theatre to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {theatres.map((theatre) => (
                    <div 
                      key={theatre._id}
                      onClick={() => setSelectedTheatreId(theatre._id)}
                      className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                        selectedTheatreId === theatre._id
                          ? 'bg-neutral-900 border-rose-600 shadow-xl shadow-rose-600/5'
                          : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-base tracking-tight text-neutral-100">{theatre.name}</h3>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                          theatre.status === 'approved' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                        }`}>
                          {theatre.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-450 leading-relaxed font-semibold">{theatre.description || 'No description provided.'}</p>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5" /> {theatre.address}, {theatre.city}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OWNER: Screens Tab */}
          {activeTab === 'screens' && isOwner && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Screen Details</h2>
                  <select 
                    value={selectedTheatreId}
                    onChange={(e) => setSelectedTheatreId(e.target.value)}
                    className="bg-[#121212] border border-neutral-850 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none text-neutral-350"
                  >
                    {theatres.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowScreenModal(true)}
                  disabled={!selectedTheatreId}
                  className="flex items-center gap-2 bg-rose-650 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-550"
                >
                  <Plus className="w-4 h-4" /> Add Screen
                </button>
              </div>

              {(!selectedTheatreId || !screens[selectedTheatreId] || screens[selectedTheatreId].length === 0) ? (
                <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
                  <Tv className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 text-sm">No screens configured for this theatre.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {screens[selectedTheatreId].map((screen) => (
                    <div key={screen._id} className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
                        <h3 className="font-extrabold text-sm text-neutral-200">Screen {screen.screenNumber}</h3>
                        <span className="text-[10px] text-rose-500 uppercase tracking-wider font-extrabold bg-rose-600/10 px-2 py-0.5 rounded">
                          {screen.screenType}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-neutral-450">
                        <div>
                          <p className="text-neutral-500 text-[10px] uppercase">Rows</p>
                          <p className="text-neutral-300 font-extrabold mt-0.5">{screen.layout?.rows || 8}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 text-[10px] uppercase">Seats/Row</p>
                          <p className="text-neutral-300 font-extrabold mt-0.5">{screen.layout?.seatsPerRow || 10}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold">Features: {screen.features || 'None listed'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OWNER: Shows Tab */}
          {activeTab === 'shows' && isOwner && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Scheduled Shows</h2>
                  <select 
                    value={selectedTheatreId}
                    onChange={(e) => setSelectedTheatreId(e.target.value)}
                    className="bg-[#121212] border border-neutral-850 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none text-neutral-350"
                  >
                    {theatres.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowShowModal(true)}
                  disabled={!selectedTheatreId || !screens[selectedTheatreId] || screens[selectedTheatreId].length === 0}
                  className="flex items-center gap-2 bg-rose-655 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-550"
                >
                  <Calendar className="w-4 h-4" /> Schedule Show
                </button>
              </div>

              {(!selectedTheatreId || !shows[selectedTheatreId] || shows[selectedTheatreId].length === 0) ? (
                <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
                  <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 text-sm">No shows scheduled for this theatre yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shows[selectedTheatreId].map((show) => (
                    <div key={show._id} className="bg-[#121212] border border-neutral-850 p-5 rounded-2xl flex justify-between items-center gap-4 hover:border-neutral-800 transition-colors">
                      <div className="space-y-2">
                        <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-750 text-neutral-400 font-extrabold text-[9px] uppercase tracking-wider rounded">
                          Screen {show.screen?.screenNumber || 'N/A'}
                        </span>
                        <h3 className="font-extrabold text-sm text-neutral-200 mt-1.5 leading-snug">
                          {show.movie?.title || 'Unknown Movie'}
                        </h3>
                        <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(show.date).toDateString()} | {show.startTime} - {show.endTime}
                        </p>
                        <p className="text-[10px] font-extrabold uppercase text-rose-500">
                          Pass price: ₹{show.price} • Status: {show.status}
                        </p>
                      </div>

                      {show.status === 'scheduled' && (
                        <button
                          onClick={() => handleDeleteShow(show._id)}
                          className="p-2.5 bg-neutral-900 hover:bg-rose-950/20 border border-neutral-850 hover:border-rose-900/30 text-neutral-500 hover:text-rose-455 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OWNER: Analytics Tab */}
          {activeTab === 'analytics' && isOwner && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Revenue & Occupancy Metrics</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
                <div className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Total Bookings (Paid)</span>
                  <p className="text-2xl font-black text-white">{ownerTotalBookings}</p>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Occupancy Ratio</span>
                  <p className="text-2xl font-black text-emerald-500">{ownerOccupancyRatio}%</p>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Total Gross Earnings</span>
                  <p className="text-2xl font-black text-rose-500">₹{ownerTotalRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Owner Bookings log table */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Live Booking History ({ownerBookings.length})</h3>
                {ownerBookings.length === 0 ? (
                  <p className="text-xs text-neutral-550 italic bg-neutral-900/20 p-6 rounded-2xl border border-neutral-850">
                    No bookings logged for this theatre yet.
                  </p>
                ) : (
                  <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs font-semibold text-neutral-450">
                      <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Reference ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Movie</th>
                          <th className="p-4">Seats</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Checked-In</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {ownerBookings.map((b) => (
                          <tr key={b._id} className="hover:bg-neutral-900/30 transition-colors">
                            <td className="p-4 font-mono text-neutral-200 uppercase font-bold">{b.bookingId}</td>
                            <td className="p-4">
                              <p className="text-neutral-300 font-bold">{b.user?.name || 'Guest'}</p>
                              <p className="text-[10px] text-neutral-500">{b.user?.email || ''}</p>
                            </td>
                            <td className="p-4 text-neutral-300 font-extrabold">{b.show?.movie?.title || 'Unknown Movie'}</td>
                            <td className="p-4 font-mono">
                              {b.seats?.map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-neutral-850 rounded text-neutral-400 text-[10px] mr-1">
                                  {s}
                                </span>
                              ))}
                            </td>
                            <td className="p-4 text-neutral-300">₹{b.totalAmount}</td>
                            <td className="p-4">
                              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                                b.checkedIn
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {b.checkedIn ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                                b.bookingStatus === 'booked'
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                  : b.bookingStatus === 'cancelled'
                                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                                  : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                              }`}>
                                {b.bookingStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADMIN: Overview Tab */}
          {activeTab === 'overview' && isAdmin && (
            <div className="select-none">
              {adminStats && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Visual Analytics & Charts (Col 8) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Financial Trends */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Revenue Trend</h3>
                          <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded">Weekly</span>
                        </div>
                        {drawRevenueLineChart()}
                      </div>

                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Daily Bookings</h3>
                          <span className="text-[10px] text-neutral-400 font-bold bg-neutral-800 px-2 py-0.5 rounded">Volume</span>
                        </div>
                        {drawBookingsBarChart()}
                      </div>
                    </div>

                    {/* Distribution Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">User Accounts Ratio</h3>
                        {drawUserDistributionPieChart()}
                      </div>

                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Theatre Approval Ratio</h3>
                        {drawTheatreApprovalDoughnutChart()}
                      </div>
                    </div>

                    {/* Leaderboards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Top Grossing Movies</h3>
                        {drawTopMoviesHorizontalChart()}
                      </div>

                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Top Performing Theatres</h3>
                        {drawTopTheatresVerticalChart()}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Key Stats & Live Logs (Col 4) */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Quick Metrics Dashboard panel */}
                    <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-lg">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Property Quick Stats</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'users', title: 'Customer Accounts' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Customers</span>
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-lg font-black text-white mt-1.5">{adminStats.totalUsers}</p>
                        </div>

                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'users', title: 'Theatre Partners' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Owners</span>
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-lg font-black text-white mt-1.5">{adminStats.totalOwners}</p>
                        </div>

                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'revenue', title: 'Platform Financials' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Total Revenue</span>
                            <DollarSign className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-base font-black text-rose-500 mt-1.5">₹{adminStats.totalRevenue?.toLocaleString()}</p>
                        </div>

                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'revenue', title: 'Platform Financials' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Today's Rev</span>
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-base font-black text-rose-500 mt-1.5">₹{adminStats.todayRevenue?.toLocaleString()}</p>
                        </div>

                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'bookings', title: 'Booking Logs' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Bookings</span>
                            <Ticket className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-lg font-black text-white mt-1.5">{adminStats.totalBookings}</p>
                        </div>

                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'movies', title: 'Movies Catalog' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Movies</span>
                            <Film className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-lg font-black text-neutral-300 mt-1.5">{adminStats.totalMovies}</p>
                        </div>

                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'theatres', title: 'Theatre Property Overview' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Screens</span>
                            <Tv className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-lg font-black text-neutral-300 mt-1.5">{adminStats.totalScreens}</p>
                        </div>

                        <div 
                          onClick={() => setDetailModal({ isOpen: true, type: 'theatres', title: 'Theatre Property Overview' })}
                          className="bg-neutral-900/30 border border-neutral-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-neutral-500">
                            <span className="text-[9px] uppercase font-bold tracking-wider">Pending</span>
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                          <p className={`text-lg font-black mt-1.5 ${adminStats.pendingTheatreApprovals > 0 ? 'text-amber-500' : 'text-white'}`}>{adminStats.pendingTheatreApprovals}</p>
                        </div>
                      </div>
                    </div>

                    {/* Live Records feed */}
                    <div className="space-y-6">
                      
                      {/* Recent Bookings Table */}
                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Recent Bookings</h3>
                        {adminStats.recentBookings?.length === 0 ? (
                          <p className="text-xs text-neutral-500 italic">No bookings found.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-neutral-400 font-semibold">
                              <thead>
                                <tr className="border-b border-neutral-900 text-neutral-550 uppercase tracking-wider text-[9px] text-left">
                                  <th className="pb-2">Booking ID</th>
                                  <th className="pb-2">Movie</th>
                                  <th className="pb-2 text-right">Paid</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adminStats.recentBookings?.slice(0, 4).map((b) => (
                                  <tr key={b._id} className="border-b border-neutral-900/60 hover:bg-neutral-900/10">
                                    <td className="py-2.5 font-mono uppercase text-neutral-300">{b.bookingId}</td>
                                    <td className="py-2.5 text-neutral-200 truncate max-w-[100px]">{b.show?.movie?.title || 'N/A'}</td>
                                    <td className="py-2.5 text-right font-bold text-rose-500">₹{b.totalAmount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Recent Payments Table */}
                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Recent Payments</h3>
                        {adminStats.recentBookings?.length === 0 ? (
                          <p className="text-xs text-neutral-500 italic">No transactions found.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-neutral-400 font-semibold">
                              <thead>
                                <tr className="border-b border-neutral-900 text-neutral-550 uppercase tracking-wider text-[9px] text-left">
                                  <th className="pb-2">Ref ID</th>
                                  <th className="pb-2">Status</th>
                                  <th className="pb-2 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adminStats.recentBookings?.slice(0, 4).map((b) => (
                                  <tr key={b._id} className="border-b border-neutral-900/60 hover:bg-neutral-900/10">
                                    <td className="py-2.5 font-mono text-neutral-300 truncate max-w-[90px]">{b.paymentId || 'N/A'}</td>
                                    <td className="py-2.5">
                                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold uppercase">
                                        Success
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-right font-bold text-neutral-200">₹{b.totalAmount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Recent Accounts */}
                      <div className="bg-[#121212] border border-neutral-850 p-6 rounded-2xl space-y-4 shadow-md">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-350">Recent Accounts</h3>
                        <div className="space-y-3">
                          {adminStats.recentUsers?.slice(0, 2).map((u) => (
                            <div key={u._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <p className="text-neutral-200 font-bold">{u.name}</p>
                                <p className="text-[10px] text-neutral-500 font-mono">{u.email}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-rose-600/10 text-rose-500 text-[9px] font-bold rounded uppercase">
                                User
                              </span>
                            </div>
                          ))}
                          {adminStats.recentOwners?.slice(0, 2).map((o) => (
                            <div key={o._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <p className="text-neutral-200 font-bold">{o.name}</p>
                                <p className="text-[10px] text-neutral-500 font-mono">{o.email}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-neutral-600 text-neutral-400 text-[9px] font-bold rounded uppercase">
                                Owner
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* ADMIN: Users Tab */}
          {activeTab === 'users' && isAdmin && (
            <div className="space-y-6">
              
              {/* Partner Verification Applications List */}
              {pendingPartners.length > 0 && (
                <div className="space-y-4 bg-yellow-950/5 border border-yellow-600/10 p-6 rounded-2xl animate-fadeIn">
                  <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-yellow-500 animate-pulse" />
                    Pending Partner Verification Requests ({pendingPartners.length})
                  </h3>
                  
                  <div className="bg-[#121212] border border-neutral-850 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-neutral-455">
                      <thead className="bg-neutral-900/60 border-b border-neutral-900 text-neutral-500 uppercase tracking-widest text-[9px]">
                        <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {pendingPartners.map((partner) => (
                          <tr key={partner._id} className="hover:bg-neutral-900/10">
                            <td className="p-4 text-neutral-200 font-bold">{partner.name}</td>
                            <td className="p-4 font-mono text-neutral-400">{partner.email}</td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await request('/auth/verify-partner', {
                                      method: 'PUT',
                                      body: JSON.stringify({ userId: partner._id, status: 'approved' })
                                    });
                                    if (res.success) {
                                      toast.success('Partner application approved!');
                                      setUsersList(prev => prev.map(u => u._id === partner._id ? { ...u, verificationStatus: 'approved' } : u));
                                    } else {
                                      toast.error(res.message || 'Verification update failed.');
                                    }
                                  } catch (err) {
                                    toast.error(err.message || 'Network error.');
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-600/15 border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 font-extrabold uppercase rounded-lg text-[10px] tracking-wide transition-all cursor-pointer flex-shrink-0"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await request('/auth/verify-partner', {
                                      method: 'PUT',
                                      body: JSON.stringify({ userId: partner._id, status: 'rejected' })
                                    });
                                    if (res.success) {
                                      toast.success('Partner application rejected.');
                                      setUsersList(prev => prev.map(u => u._id === partner._id ? { ...u, verificationStatus: 'rejected' } : u));
                                    } else {
                                      toast.error(res.message || 'Verification update failed.');
                                    }
                                  } catch (err) {
                                    toast.error(err.message || 'Network error.');
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-600/15 border border-rose-500/20 hover:border-rose-500 text-rose-500 font-extrabold uppercase rounded-lg text-[10px] tracking-wide transition-all cursor-pointer flex-shrink-0"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Registered Accounts</h2>
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#121212] border border-neutral-850 px-4 py-2 rounded-xl text-xs outline-none text-neutral-300 placeholder-neutral-600 w-64"
                />
              </div>

              <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs font-semibold text-neutral-400">
                  <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => (
                      <tr key={user._id} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="p-4 text-neutral-200 font-extrabold">{user.name}</td>
                        <td className="p-4 font-mono text-neutral-400">{user.email}</td>
                        <td className="p-4 uppercase tracking-wider text-[10px]">{user.role}</td>
                        <td className="p-4">
                          {user.role === 'owner' ? (
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border font-extrabold ${
                              user.verificationStatus === 'approved'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : user.verificationStatus === 'rejected'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 animate-pulse'
                            }`}>
                              {user.verificationStatus}
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN: Theatres Approval Tab */}
          {activeTab === 'theatres_admin' && isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Approval queue list */}
              <div className="lg:col-span-3 space-y-6">
                <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Pending Theatre Requests ({pendingTheatres.length})</h2>
                
                {pendingTheatres.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic bg-neutral-900/40 p-5 rounded-2xl border border-neutral-850">
                    No theatres pending approval at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingTheatres.map((theatre) => (
                      <div 
                        key={theatre._id}
                        className="bg-neutral-900/50 border border-neutral-850 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-neutral-800 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-neutral-200 text-sm">{theatre.name}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded">
                              Pending
                            </span>
                          </div>
                          <p className="text-xs text-neutral-450 leading-relaxed font-semibold">{theatre.address}, {theatre.city}</p>
                          {theatre.owner && (
                            <p className="text-[10px] text-neutral-500">
                              Owner: <span className="text-neutral-400 font-bold">{theatre.owner.name}</span> ({theatre.owner.email})
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleApproveTheatre(theatre._id, theatre.name)}
                          className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex-shrink-0"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Theatres catalog */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Active Theatre Registry</h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {theatres.filter(t => t.status === 'approved').map(t => (
                    <div key={t._id} className="bg-[#121212]/50 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-neutral-200">{t.name}</span>
                        <span className="text-[8px] uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">Approved</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-semibold">{t.address}, {t.city}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN: Bookings Monitoring Tab */}
          {activeTab === 'bookings' && isAdmin && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Live Platform Transactions</h2>
                <input
                  type="text"
                  placeholder="Search bookings by ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#121212] border border-neutral-850 px-4 py-2 rounded-xl text-xs outline-none text-neutral-300 placeholder-neutral-600 w-64"
                />
              </div>

              <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs font-semibold text-neutral-400">
                  <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Booking Ref</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Seats</th>
                      <th className="p-4">Total Paid</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking) => (
                      <tr key={booking._id} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="p-4 font-mono text-neutral-250 font-extrabold">{booking.bookingId}</td>
                        <td className="p-4">
                          <p className="text-neutral-200 font-bold">{booking.user?.name || 'Customer'}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">{booking.user?.email || 'N/A'}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-neutral-300">{booking.show?.movie?.title || 'Cinema'}</p>
                          <p className="text-[10px] text-neutral-550">{new Date(booking.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4 font-mono">{booking.seats?.join(', ') || 'Seats'}</td>
                        <td className="p-4 font-extrabold text-rose-500">₹{booking.totalAmount}</td>
                        <td className="p-4 uppercase tracking-wider text-[9px]">
                          <span className={`px-2 py-0.5 rounded border font-extrabold uppercase ${
                            booking.bookingStatus === 'booked' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                              : 'bg-rose-550/15 border-rose-900/25 text-rose-500'
                          }`}>
                            {booking.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN: Offers & Promos Tab */}
          {activeTab === 'promos' && isAdmin && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Offers & Promo Codes</h2>
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Promo
                </button>
              </div>

              {promos.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
                  <Gift className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 text-sm">No promo codes configured yet. Click "Create Promo" to add one!</p>
                </div>
              ) : (
                <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs font-semibold text-neutral-400">
                    <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">Promo Code</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Value</th>
                        <th className="p-4">Min Spend</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {promos.map((promo) => (
                        <tr key={promo._id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="p-4 font-bold text-neutral-200">{promo.title}</td>
                          <td className="p-4 font-mono font-black text-rose-500">{promo.code}</td>
                          <td className="p-4 uppercase">{promo.discountType}</td>
                          <td className="p-4 text-neutral-300">
                            {promo.discountType === 'flat' ? `₹${promo.discountValue}` : `${promo.discountValue}%`}
                          </td>
                          <td className="p-4 text-neutral-300">₹{promo.minPurchase}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeletePromo(promo._id)}
                              className="p-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-700 text-neutral-500 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete Promo Code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ADMIN & OWNER: Show Proposals Tab */}
          {activeTab === 'proposals' && (isOwner || isAdmin) && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-lg font-bold text-neutral-200 uppercase tracking-wider">Show Proposals Review</h2>

              {proposals.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20">
                  <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 text-sm">No show proposals have been submitted yet.</p>
                </div>
              ) : (
                <div className="bg-[#121212] border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs font-semibold text-neutral-400">
                    <thead className="bg-neutral-900/70 border-b border-neutral-855 text-neutral-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Presenter</th>
                        <th className="p-4">Show Details</th>
                        <th className="p-4">City</th>
                        <th className="p-4">Expected Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {proposals.map((prop) => (
                        <tr key={prop._id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-neutral-200">{prop.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{prop.email}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-neutral-300">{prop.showName}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5 uppercase tracking-wider">{prop.category}</p>
                            {prop.message && (
                              <p className="text-[10px] text-neutral-400 mt-1 italic">"{prop.message}"</p>
                            )}
                          </td>
                          <td className="p-4 text-neutral-300 font-bold">{prop.city}</td>
                          <td className="p-4 text-neutral-300 font-bold">₹{prop.expectedPrice}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-extrabold ${
                              prop.status === 'approved'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : prop.status === 'rejected'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                            }`}>
                              {prop.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {prop.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleUpdateProposalStatus(prop._id, 'approved')}
                                  className="px-2.5 py-1.5 bg-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer flex-shrink-0"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateProposalStatus(prop._id, 'rejected')}
                                  className="px-2.5 py-1.5 bg-rose-600/10 border border-rose-500/20 hover:border-rose-500 text-rose-500 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer flex-shrink-0"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
      </div>

      {/* MODALS */}
      {/* 1. Modal: Register Theatre */}
      {showTheatreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
            <button onClick={() => setShowTheatreModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Register New Theatre</h3>
            
            <form onSubmit={handleCreateTheatre} className="space-y-4 text-xs font-semibold text-neutral-450">
              <div className="space-y-1">
                <label className="uppercase tracking-wider">Theatre Name</label>
                <input
                  type="text" required
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">City</label>
                  <input
                    type="text" required
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Amenities</label>
                  <input
                    type="text" placeholder="e.g. IMAX, Dolby, Food Court"
                    value={theatreForm.amenities}
                    onChange={(e) => setTheatreForm({ ...theatreForm, amenities: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Full Address</label>
                <input
                  type="text" required
                  value={theatreForm.address}
                  onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Brief Description</label>
                <textarea
                  value={theatreForm.description}
                  onChange={(e) => setTheatreForm({ ...theatreForm, description: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none h-20 resize-none"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
                Submit Theatre Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Create Screen */}
      {showScreenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
            <button onClick={() => setShowScreenModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Configure Screen Layout</h3>
            
            <form onSubmit={handleCreateScreen} className="space-y-4 text-xs font-semibold text-neutral-450">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Screen Number</label>
                  <input
                    type="text" required placeholder="e.g. 1"
                    value={screenForm.screenNumber}
                    onChange={(e) => setScreenForm({ ...screenForm, screenNumber: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Screen Category</label>
                  <select
                    value={screenForm.screenType}
                    onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
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
                    value={screenForm.totalRows}
                    onChange={(e) => setScreenForm({ ...screenForm, totalRows: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Seats per Row</label>
                  <input
                    type="number" required min="1" max="25"
                    value={screenForm.seatsPerRow}
                    onChange={(e) => setScreenForm({ ...screenForm, seatsPerRow: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Specific Features</label>
                <input
                  type="text" placeholder="e.g. Dolby Atmos Sound system"
                  value={screenForm.features}
                  onChange={(e) => setScreenForm({ ...screenForm, features: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
                Configure Layout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Create Show */}
      {showShowModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
            <button onClick={() => setShowShowModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Schedule Showtime</h3>
            
            <form onSubmit={handleCreateShow} className="space-y-4 text-xs font-semibold text-neutral-450">
              <div className="space-y-1">
                <label className="uppercase tracking-wider">Select Movie</label>
                <select
                  value={showForm.movieId}
                  onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                >
                  <option value="">-- Choose Movie --</option>
                  {moviesList.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Screen Allocation</label>
                  <select
                    value={selectedScreenId}
                    onChange={(e) => setSelectedScreenId(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  >
                    <option value="">-- Choose Screen --</option>
                    {screens[selectedTheatreId]?.map(screen => (
                      <option key={screen._id} value={screen._id}>Screen {screen.screenNumber} ({screen.screenType})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Pass Price (INR)</label>
                  <input
                    type="number" required min="50"
                    value={showForm.price}
                    onChange={(e) => setShowForm({ ...showForm, price: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Date</label>
                <input
                  type="date" required
                  value={showForm.date}
                  onChange={(e) => setShowForm({ ...showForm, date: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Start Time</label>
                  <input
                    type="text" required placeholder="e.g. 14:30"
                    value={showForm.startTime}
                    onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">End Time</label>
                  <input
                    type="text" required placeholder="e.g. 17:00"
                    value={showForm.endTime}
                    onChange={(e) => setShowForm({ ...showForm, endTime: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
                Confirm Schedule Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Create Promo Code */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-neutral-850 rounded-3xl w-full max-w-lg p-8 relative space-y-6">
            <button onClick={() => setShowPromoModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-250 border-b border-neutral-900 pb-3">Create Promo Offer</h3>
            
            <form onSubmit={handleCreatePromo} className="space-y-4 text-xs font-semibold text-neutral-450">
              <div className="space-y-1">
                <label className="uppercase tracking-wider">Offer Title</label>
                <input
                  type="text" required placeholder="e.g. ICICI Card Discount"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Promo Code (Uppercase)</label>
                  <input
                    type="text" required placeholder="e.g. ICICIBOGO"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none uppercase font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Discount Type</label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none cursor-pointer"
                  >
                    <option value="flat">Flat Cash Discount (₹)</option>
                    <option value="percentage">Percentage Discount (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Discount Value</label>
                  <input
                    type="number" required min="1"
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Minimum Spend Required</label>
                  <input
                    type="number" min="0"
                    value={promoForm.minPurchase}
                    onChange={(e) => setPromoForm({ ...promoForm, minPurchase: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Offer Description</label>
                <textarea
                  required placeholder="Describe the terms and benefits of this code..."
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-rose-600 rounded-xl p-3 text-neutral-200 outline-none h-20 resize-none"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
                Publish Promo Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin details modal */}
      {detailModal.isOpen && adminStats && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121212] border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-rose-500" />
                {detailModal.title}
              </h3>
              <button 
                onClick={() => setDetailModal({ isOpen: false, type: '', title: '' })}
                className="p-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Switch */}
            <div className="space-y-6">
              {detailModal.type === 'users' && (
                <div className="space-y-6">
                  {/* Visual segment progress bar: Customers vs Owners */}
                  <div className="bg-neutral-950/40 p-5 rounded-2xl border border-neutral-850 space-y-3">
                    <p className="text-xs uppercase font-bold tracking-wider text-neutral-400">Account Distribution</p>
                    <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(adminStats.totalUsers / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100}%` }}
                        className="bg-rose-600"
                        title="Customers"
                      />
                      <div 
                        style={{ width: `${(adminStats.totalOwners / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100}%` }}
                        className="bg-neutral-600"
                        title="Theatre Owners"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-600 rounded-full" /> Customers: {adminStats.totalUsers} ({Math.round((adminStats.totalUsers / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100)}%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-neutral-600 rounded-full" /> Partners: {adminStats.totalOwners} ({Math.round((adminStats.totalOwners / (adminStats.totalUsers + adminStats.totalOwners || 1)) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase font-bold text-neutral-400">Recent Customers</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {adminStats.recentUsers?.map((u) => (
                          <div key={u._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex flex-col gap-0.5">
                            <span className="text-xs text-neutral-200 font-bold">{u.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">{u.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase font-bold text-neutral-400">Recent Owners</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {adminStats.recentOwners?.map((o) => (
                          <div key={o._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex flex-col gap-0.5">
                            <span className="text-xs text-neutral-200 font-bold">{o.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">{o.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailModal.type === 'revenue' && (
                <div className="space-y-6">
                  {/* Financial breakdown summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Total Gross</span>
                      <p className="text-sm font-black text-rose-500">₹{adminStats.totalRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Today's Gross</span>
                      <p className="text-sm font-black text-rose-500">₹{adminStats.todayRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Refunds Processed</span>
                      <p className="text-sm font-black text-neutral-300">{adminStats.refundCount || 0}</p>
                    </div>
                  </div>

                  {/* Revenue by movie & theatre */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase font-bold text-neutral-400">Revenue by Movie</h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {adminStats.topMovies?.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3 rounded-xl border border-neutral-850">
                            <span className="text-xs text-neutral-300 font-bold">{m.title}</span>
                            <span className="text-xs text-rose-500 font-black">₹{m.revenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase font-bold text-neutral-400">Revenue by Theatre</h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {adminStats.topTheatres?.map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3 rounded-xl border border-neutral-850">
                            <span className="text-xs text-neutral-300 font-bold">{t.name}</span>
                            <span className="text-xs text-rose-500 font-black">₹{t.revenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Transaction logs */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-bold text-neutral-400">Recent Transactions Log</h4>
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {adminStats.recentBookings?.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3 rounded-xl border border-neutral-850 text-xs">
                          <div>
                            <p className="font-bold text-neutral-200 uppercase font-mono">{b.bookingId}</p>
                            <p className="text-[10px] text-neutral-500">{b.user?.name || 'Guest'} ({b.user?.email || 'N/A'})</p>
                          </div>
                          <span className="font-extrabold text-emerald-500">₹{b.totalAmount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailModal.type === 'bookings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Total Orders Confirmed</span>
                      <p className="text-sm font-black text-white">{adminStats.totalBookings}</p>
                    </div>
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Today's Orders</span>
                      <p className="text-sm font-black text-white">{adminStats.todayBookings}</p>
                    </div>
                  </div>

                  <h4 className="text-xs uppercase font-bold text-neutral-400 pt-2">Live Orders Monitor</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {adminStats.recentBookings?.map((b) => (
                      <div key={b._id} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-neutral-200 uppercase font-mono">{b.bookingId}</p>
                          <p className="text-[10px] text-neutral-500">Movie: {b.show?.movie?.title || 'Unknown'} • Seats: {b.seats?.join(', ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-neutral-200">₹{b.totalAmount}</p>
                          <p className="text-[10px] text-neutral-500">{new Date(b.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailModal.type === 'movies' && (
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-550">Movies Catalog Size</span>
                    <p className="text-sm font-black text-white">{adminStats.totalMovies}</p>
                  </div>

                  <h4 className="text-xs uppercase font-bold text-neutral-400 pt-2">Top Performing Film Titles</h4>
                  <div className="space-y-3">
                    {adminStats.topMovies?.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-850">
                        <span className="text-xs text-neutral-200 font-extrabold">{m.title}</span>
                        <span className="text-xs text-rose-500 font-black">₹{m.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailModal.type === 'theatres' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Approved Properties</span>
                      <p className="text-sm font-black text-white">{adminStats.totalTheatres}</p>
                    </div>
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Total Screen Audis</span>
                      <p className="text-sm font-black text-white">{adminStats.totalScreens}</p>
                    </div>
                    <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-550">Total Shows Scheduled</span>
                      <p className="text-sm font-black text-white">{adminStats.totalShows}</p>
                    </div>
                  </div>

                  <h4 className="text-xs uppercase font-bold text-neutral-400 pt-2">Top Performing Theatres</h4>
                  <div className="space-y-3">
                    {adminStats.topTheatres?.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-850">
                        <span className="text-xs text-neutral-200 font-extrabold">{t.name}</span>
                        <span className="text-xs text-rose-500 font-black">₹{t.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2">
              <button 
                onClick={() => setDetailModal({ isOpen: false, type: '', title: '' })}
                className="w-full py-3 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
