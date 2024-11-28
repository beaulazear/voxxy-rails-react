import './App.css';
import React, { useContext } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from "./context/user.js";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/HomePage';
import WaitlistPage from './components/WaitlistPage';
import VapiAssistant from './components/VapiAssistant';
import InfoPage from './components/InfoPage';
// import SignUp from './components/SignUp.js';
import Login from './components/Login';
import AdminWaitlist from './admincomponents/AdminWaitlist';
import LoadingScreen from './components/LoadingScreen';
import WelcomeComponent from './admincomponents/WelcomeComponent.js';
import UserFooter from './admincomponents/UserFooter.js';
import Steph from './admincomponents/Steph.js';
import SkiTrip from './admincomponents/SkiTrip.js'
import Lexilia from './admincomponents/Lexilia.js'

function App() {

  const { user, loading } = useContext(UserContext);

  const isLoggedIn = user && user.username && Object.keys(user).length > 0;

  return (
    <div className="App">
      {loading ? (
        <LoadingScreen />
      ) : (
        isLoggedIn ? (
          <>
            <Navbar />
            <Routes>
              <Route path='/' element={<WelcomeComponent />} />
              <Route path='/waitlist' element={<AdminWaitlist />} />
              <Route path='/demo' element={<VapiAssistant />} />
              <Route path='/64a0203a922a52f49ba0c49f2e9b2d18' element={<Steph />} />
              <Route path='/206a463a50a761f16ab4fe5c66076178' element={<SkiTrip />} />
              <Route path='/7b3612ef799bce4c212e7888d68baeae' element={<Lexilia />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <UserFooter />
          </>
        ) : (
          <>
            <Navbar />
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/waitlist' element={<WaitlistPage />} />
              <Route path='/demo' element={<VapiAssistant />} />
              <Route path='/infopage' element={<InfoPage />} />
              {/* <Route path='/signup' element={<SignUp />} /> */}
              <Route path='/login' element={<Login />} />
              <Route path='/64a0203a922a52f49ba0c49f2e9b2d18' element={<Steph />} />
              <Route path='/206a463a50a761f16ab4fe5c66076178' element={<SkiTrip />} />
              <Route path='/7b3612ef799bce4c212e7888d68baeae' element={<Lexilia />} />
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