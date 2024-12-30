import './App.css';
import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserContext } from "./context/user.js";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/HomePage';
import WaitlistPage from './components/WaitlistPage';
import InfoPage from './components/InfoPage';
import SignUp from './components/SignUp.js';
import Login from './components/Login';
import AdminWaitlist from './admincomponents/AdminWaitlist';
import LoadingScreen from './components/LoadingScreen';
import WelcomeComponent from './admincomponents/WelcomeComponent.js';
import UserFooter from './admincomponents/UserFooter.js';
import Verification from './components/Verification.js';
import ConfirmEmail from './components/ConfirmEmail.js';

function App() {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !user.confirmed_at) {
      // Redirect unconfirmed users to the ConfirmEmail page
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
        isLoggedIn ? (
          isConfirmed ? (
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<WelcomeComponent />} />
                <Route path="/waitlist" element={<AdminWaitlist />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/confirm-email" element={<ConfirmEmail />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <UserFooter />
            </>
          ) : (
            <>
              <Navbar />
              <Routes>
                <Route path="/confirm-email" element={<ConfirmEmail />} />
                <Route path="*" element={<Navigate to="/confirm-email" replace />} />
              </Routes>
            </>
          )
        ) : (
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/waitlist" element={<WaitlistPage />} />
              <Route path="/infopage" element={<InfoPage />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
          </>
        )
      )}
    </div>
  );
}

export default App;