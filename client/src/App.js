import './App.css';
import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

function App() {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !user.confirmed_at) {
      navigate("/confirm-email");
    }
  }, [loading, user, navigate]);

  const isLoggedIn = user && user.email && Object.keys(user).length > 0;
  const isConfirmed = user && user.confirmed_at;
  const isAdmin = user && user.admin;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={isLoggedIn ? <UserActivities /> : <LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/invite_signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/try-voxxy" element={<TryVoxxy />} />
        <Route path='/learn-more' element={<LearnMorePage />} />
        <Route path='/about-us' element={<AboutUsPage />} />
        <Route path='/blogs' element={<Blogs />} />
        <Route path='/loading' element={<LoadingScreen />} />
        <Route path='/contact' element={<ContactUs />} />
        <Route path='/privacy' element={<PrivacyPolicyPage />} />
        <Route path='/terms' element={<TermsOfServicePage />} />

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