import './App.css';
import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import TripDashboard from './admincomponents/TripDashboard.js';
import UserActivities from './admincomponents/UserActivities.js';

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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={isLoggedIn ? <TripDashboard /> : <LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/invite_signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verification" element={<Verification />} />

        {isLoggedIn && !isConfirmed && (
          <Route path="/confirm-email" element={<ConfirmEmail />} />
        )}

        {isLoggedIn && isConfirmed && (
          <Route path="/boards" element={<UserActivities />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;