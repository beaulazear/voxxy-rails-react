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

function App() {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !user.confirmed_at) {
      navigate("/confirm-email");
    }
  }, [loading, user, navigate]);

  const isLoggedIn = user && user.username && Object.keys(user).length > 0;
  const isConfirmed = user && user.confirmed_at;

  return (
    <div className="App">
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <Navbar />
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={user ? <TripDashboard /> : <LandingPage />}
            />            
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verification" element={<Verification />} />
            {isLoggedIn && (
              <>
                {isConfirmed ? (
                  <>
                    <Route path="/verification" element={<Verification />} />
                    <Route path="/confirm-email" element={<ConfirmEmail />} />
                    <Route path="/" element={<TripDashboard />} />
                  </>
                ) : (
                  <>
                    <Route path="/confirm-email" element={<ConfirmEmail />} />
                  </>
                )}
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      )}
    </div>
  );
}

export default App;