import './App.css';
import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import { UserContext } from "./context/user.js";
import Navbar from './components/Navbar';
import SignUp from './components/SignUp.js';
import Login from './components/Login';
import LoadingScreen from './components/LoadingScreen';
import Verification from './components/Verification.js';
import ConfirmEmail from './components/ConfirmEmail.js';
import ForgotPassword from './components/ForgotPassword.js';
import ResetPassword from './components/ResetPassword.js';
import LandingPage from './components/LandingPage.js';
import UserActivities from './admincomponents/UserActivities.js';
import FAQ from './components/FAQ.js';
import TryVoxxy from './components/TryVoxxy.js';
import LearnMorePage from './components/LearnMorePage.js';
import AboutUsPage from './components/AboutUsSection.js';
import Blogs from './components/Blogs.js';
import AdminPage from './admincomponents/AdminPage.js';
import ContactUs from './components/ContactUs.js';
import PrivacyPolicyPage from './components/PrivacyPolicyPage.js';
import TermsOfServicePage from './components/TermsOfServicePage.js';
import PricingPage from './components/PricingPage.js';
import Profile from './admincomponents/Profile.js';
import GuestResponsePage from './components/GuestResponsePage.jsx';
import ProtectedActivityRoute from './components/ProtectedActivityRoute.js';
import TripDashboardPage from './admincomponents/TripDashboardPage.js';
import ComingSoonPlaceholder from './components/ComingSoonPlaceholder.js';
import HowItWorksPage from './components/HowItWorksPage.js';
import AboutPage from './components/AboutPage.js';
import CommunityPage from './components/CommunityPage.js';
import GetStartedPage from './components/GetStartedPage.js';
import LegalPage from './components/LegalPage.js';

function App() {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && !user.confirmed_at) {
      navigate("/confirm-email");
    }
  }, [loading, user, navigate]);

  const isLoggedIn = user && user.email && Object.keys(user).length > 0;
  const isConfirmed = user && user.confirmed_at;
  const isAdmin = user && user.admin;

  // Define routes that should NOT show the navbar
  const routesWithoutNavbar = [
    '/activities',
    '/activity',
    '/create-trip'
  ];

  // Check if current route should hide navbar
  const shouldHideNavbar = routesWithoutNavbar.some(route =>
    location.pathname.startsWith(route)
  );

  if (loading) {
    return <LoadingScreen />;
  }

  // Show coming soon for non-admin users who are logged in and confirmed
  if (isLoggedIn && isConfirmed && !isAdmin) {
    const isAuthRoute = ['/login', '/signup', '/invite_signup', '/forgot-password', '/reset-password', '/verification'].includes(location.pathname);
    const isGuestRoute = location.pathname.includes('/activities/') && location.pathname.includes('/respond/');
    
    if (!isAuthRoute && !isGuestRoute) {
      return <ComingSoonPlaceholder />;
    }
  }

  return (
    <div className="App">
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={
          isLoggedIn && isAdmin ? <UserActivities /> : 
          !isLoggedIn ? <LandingPage /> : 
          isConfirmed ? <ComingSoonPlaceholder /> : 
          <ConfirmEmail />
        } />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/invite_signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/get-started" element={<GetStartedPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/try-voxxy" element={<TryVoxxy />} />
        <Route path='/learn-more' element={<LearnMorePage />} />
        <Route path='/about-us' element={<AboutUsPage />} />
        <Route path='/blogs' element={<Blogs />} />
        <Route path='/voxxy-presents' element={<Blogs />} />
        <Route path='/loading' element={<LoadingScreen />} />
        <Route path='/contact' element={<ContactUs />} />
        <Route path='/privacy' element={<PrivacyPolicyPage />} />
        <Route path='/terms' element={<TermsOfServicePage />} />
        <Route path='/pricing' element={<PricingPage />} />
        
        {/* Admin-only routes */}
        {isAdmin && (
          <>
            <Route path='/profile' element={<Profile />} />
            <Route path='/create-trip' element={<TripDashboardPage />} />
            <Route path="/activity/:activityId" element={<ProtectedActivityRoute />} />
          </>
        )}
        
        {/* Guest response route - always available */}
        <Route path="/activities/:activityId/respond/:token" element={<GuestResponsePage />} />

        {isLoggedIn && !isConfirmed && (
          <Route path="/confirm-email" element={<ConfirmEmail />} />
        )}

        {isAdmin && (
          <Route path='/voxxyad' element={<AdminPage />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;