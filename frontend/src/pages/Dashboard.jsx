import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/slices/authSlice';
import { movieService } from '../services/movieService';
import request from '../services/api';
import { Film, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import gsap from 'gsap';

// Extracted Subcomponents
import AdminOverview from '../components/dashboard/admin/AdminOverview';
import AdminUsers from '../components/dashboard/admin/AdminUsers';
import AdminTheatreApproval from '../components/dashboard/admin/AdminTheatreApproval';
import AdminBookingMonitor from '../components/dashboard/admin/AdminBookingMonitor';
import AdminOffersPromos from '../components/dashboard/admin/AdminOffersPromos';
import AdminShowProposals from '../components/dashboard/admin/AdminShowProposals';
import AdminPricingSettings from '../components/dashboard/admin/AdminPricingSettings';

import OwnerMyTheatres from '../components/dashboard/owner/OwnerMyTheatres';
import OwnerScreens from '../components/dashboard/owner/OwnerScreens';
import OwnerShows from '../components/dashboard/owner/OwnerShows';
import OwnerAnalytics from '../components/dashboard/owner/OwnerAnalytics';
import OwnerShowProposals from '../components/dashboard/owner/OwnerShowProposals';

import TheatreRegistrationModal from '../components/dashboard/modals/TheatreRegistrationModal';
import ScreenConfigurationModal from '../components/dashboard/modals/ScreenConfigurationModal';
import ScheduleShowModal from '../components/dashboard/modals/ScheduleShowModal';
import CreatePromoModal from '../components/dashboard/modals/CreatePromoModal';
import AdminDetailInsightsModal from '../components/dashboard/modals/AdminDetailInsightsModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux Auth state
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('');
  
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
  
  // Pricing configuration
  const [gstRate, setGstRate] = useState('');
  const [convenienceFee, setConvenienceFee] = useState('');
  const [savingPricing, setSavingPricing] = useState(false);

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
      const endpoint = isOwner ? '/proposals/owner' : '/proposals';
      request(endpoint)
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
      const endpoint = isOwner ? `/proposals/${proposalId}/owner-approve` : `/proposals/${proposalId}/status`;
      const res = await request(endpoint, {
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
      
      const statsRes = await request('/theatres/admin/stats');
      if (statsRes.success) setAdminStats(statsRes.stats);

      const pendingRes = await request('/theatres/admin/pending');
      if (pendingRes.success) setPendingTheatres(pendingRes.theatres || []);

      const usersRes = await request('/auth/admin/users');
      if (usersRes.success) setUsersList(usersRes.users || []);

      const bookingsRes = await request('/bookings/admin/all');
      if (bookingsRes.success) setBookingsList(bookingsRes.bookings || []);

      const theatresRes = await request('/theatres');
      if (theatresRes.success) setTheatres(theatresRes.theatres || []);

      try {
        const pricingRes = await request('/admin/pricing');
        if (pricingRes.success) {
          setGstRate(pricingRes.gstRate);
          setConvenienceFee(pricingRes.convenienceFee);
        }
      } catch (pricingErr) {
        console.error('Failed to load pricing config:', pricingErr);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load administrative console data.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSavePricing = async (e) => {
    e.preventDefault();
    const gstNum = Number(gstRate);
    const feeNum = Number(convenienceFee);

    if (isNaN(gstNum) || gstNum < 0 || gstNum > 100) {
      toast.error('GST rate must be between 0% and 100%.');
      return;
    }
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error('Convenience fee must be greater than or equal to ₹0.');
      return;
    }

    setSavingPricing(true);
    try {
      const response = await request('/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify({
          gstRate: gstNum,
          convenienceFee: feeNum,
        }),
      });
      if (response.success) {
        toast.success('Pricing configuration updated successfully!');
        setGstRate(response.gstRate);
        setConvenienceFee(response.convenienceFee);
      } else {
        toast.error(response.message || 'Failed to update pricing settings.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update pricing settings.');
    } finally {
      setSavingPricing(false);
    }
  };

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
        
        const screenRes = await request(`/screens/my/${selectedTheatreId}`);
        setScreens((prev) => ({ ...prev, [selectedTheatreId]: screenRes.screens || [] }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create screen.');
    }
  };

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
        
        const showRes = await request(`/shows/my/${selectedTheatreId}`);
        setShows((prev) => ({ ...prev, [selectedTheatreId]: showRes.shows || [] }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to schedule show.');
    }
  };

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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-6 pb-16 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Navigation Bar */}
        <div className="border-b border-neutral-850 pb-4 overflow-x-auto select-none scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {isOwner && (
              <>
                <button
                  onClick={() => setActiveTab('theatres')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'theatres' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Step 1: My Theatres
                </button>
                <button
                  onClick={() => setActiveTab('screens')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'screens' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Step 2: Screens
                </button>
                <button
                  onClick={() => setActiveTab('shows')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'shows' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Step 3: Shows
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
                  Users ({usersList.length})
                </button>
                <button
                  onClick={() => setActiveTab('theatres_admin')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'theatres_admin' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Theatre Approvals ({pendingTheatres.length})
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
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'pricing' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-450 hover:text-white'
                  }`}
                >
                  Pricing Settings
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
            {/* OWNER Tabs */}
            {activeTab === 'theatres' && isOwner && (
              <OwnerMyTheatres
                theatres={theatres}
                selectedTheatreId={selectedTheatreId}
                setSelectedTheatreId={setSelectedTheatreId}
                setShowTheatreModal={setShowTheatreModal}
                onNextStep={() => setActiveTab('screens')}
              />
            )}

            {activeTab === 'screens' && isOwner && (
              <OwnerScreens
                theatres={theatres}
                selectedTheatreId={selectedTheatreId}
                setSelectedTheatreId={setSelectedTheatreId}
                screens={screens}
                setShowScreenModal={setShowScreenModal}
                onPrevStep={() => setActiveTab('theatres')}
                onNextStep={() => setActiveTab('shows')}
              />
            )}

            {activeTab === 'shows' && isOwner && (
              <OwnerShows
                theatres={theatres}
                selectedTheatreId={selectedTheatreId}
                setSelectedTheatreId={setSelectedTheatreId}
                shows={shows}
                screens={screens}
                setShowShowModal={setShowShowModal}
                handleDeleteShow={handleDeleteShow}
                onPrevStep={() => setActiveTab('screens')}
              />
            )}

            {activeTab === 'analytics' && isOwner && (
              <OwnerAnalytics
                ownerTotalBookings={ownerTotalBookings}
                ownerOccupancyRatio={ownerOccupancyRatio}
                ownerTotalRevenue={ownerTotalRevenue}
                ownerBookings={ownerBookings}
              />
            )}

            {activeTab === 'proposals' && isOwner && (
              <OwnerShowProposals
                proposals={proposals}
                handleUpdateProposalStatus={handleUpdateProposalStatus}
              />
            )}

            {/* ADMIN Tabs */}
            {activeTab === 'overview' && isAdmin && (
              <AdminOverview adminStats={adminStats} setDetailModal={setDetailModal} />
            )}

            {activeTab === 'users' && isAdmin && (
              <AdminUsers
                usersList={usersList}
                setUsersList={setUsersList}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            )}

            {activeTab === 'theatres_admin' && isAdmin && (
              <AdminTheatreApproval
                pendingTheatres={pendingTheatres}
                theatres={theatres}
                handleApproveTheatre={handleApproveTheatre}
              />
            )}

            {activeTab === 'bookings' && isAdmin && (
              <AdminBookingMonitor
                bookingsList={bookingsList}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            )}

            {activeTab === 'promos' && isAdmin && (
              <AdminOffersPromos
                promos={promos}
                setShowPromoModal={setShowPromoModal}
                handleDeletePromo={handleDeletePromo}
              />
            )}

            {activeTab === 'proposals' && isAdmin && (
              <AdminShowProposals
                proposals={proposals}
                handleUpdateProposalStatus={handleUpdateProposalStatus}
              />
            )}

            {activeTab === 'pricing' && isAdmin && (
              <AdminPricingSettings
                gstRate={gstRate}
                setGstRate={setGstRate}
                convenienceFee={convenienceFee}
                setConvenienceFee={setConvenienceFee}
                savingPricing={savingPricing}
                onSubmit={handleSavePricing}
              />
            )}
          </div>
        )}

      </div>

      {/* Interactive Modals */}
      <TheatreRegistrationModal
        isOpen={showTheatreModal}
        onClose={() => setShowTheatreModal(false)}
        onSubmit={handleCreateTheatre}
        form={theatreForm}
        setForm={setTheatreForm}
      />

      <ScreenConfigurationModal
        isOpen={showScreenModal}
        onClose={() => setShowScreenModal(false)}
        onSubmit={handleCreateScreen}
        form={screenForm}
        setForm={setScreenForm}
      />

      <ScheduleShowModal
        isOpen={showShowModal}
        onClose={() => setShowShowModal(false)}
        onSubmit={handleCreateShow}
        form={showForm}
        setForm={setShowForm}
        moviesList={moviesList}
        screens={screens}
        selectedTheatreId={selectedTheatreId}
        selectedScreenId={selectedScreenId}
        setSelectedScreenId={setSelectedScreenId}
      />

      <CreatePromoModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        onSubmit={handleCreatePromo}
        form={promoForm}
        setForm={setPromoForm}
      />

      <AdminDetailInsightsModal
        detailModal={detailModal}
        setDetailModal={setDetailModal}
        adminStats={adminStats}
      />
    </div>
  );
};

export default Dashboard;
