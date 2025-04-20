import './App.css';
import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import mixpanel from 'mixpanel-browser';
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

function App() {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !user.confirmed_at) {
      navigate("/confirm-email");
    }
    if (process.env.NODE_ENV === "production") {
      if (user) {
        mixpanel.identify(user.id);
        mixpanel.track("App Loaded", {
          "status": "Logged In",
          "user_id": user.id,
          "email": user.email
        });
      } else {
        mixpanel.track("App Loaded", {
          "status": "Not Logged In"
        });
      }
    }
  }, [loading, user, navigate]);

  const isLoggedIn = user && user.email && Object.keys(user).length > 0;
  const isConfirmed = user && user.confirmed_at;

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

        {isLoggedIn && !isConfirmed && (
          <Route path="/confirm-email" element={<ConfirmEmail />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;