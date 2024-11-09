import './App.css';
import React, { useContext } from "react";
import { Routes, Route } from 'react-router-dom';
import { UserContext } from "./context/user.js";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/HomePage';
import WaitlistPage from './components/WaitlistPage';
import VapiAssistant from './components/VapiAssistant';
import ContactPage from './components/Contact';
import InfoPage from './components/InfoPage';
import SignUp from './components/SignUp.js';
import Login from './components/Login';
import AdminWaitlist from './admincomponents/AdminWaitlist'

function App() {

  const { user } = useContext(UserContext);

  console.log(user)

  const isLoggedIn = user && user.username && Object.keys(user).length > 0;

  console.log(isLoggedIn)

  return (
    <div className="App">
      {isLoggedIn ? (
        <>
          <Navbar />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/waitlist' element={<AdminWaitlist />} />
            <Route path='/demo' element={<VapiAssistant />} />
          </Routes>
          <Footer />
        </>
      ) : (
        <>
          <Navbar />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/waitlist' element={<WaitlistPage />} />
            <Route path='/demo' element={<VapiAssistant />} />
            <Route path='/contact' element={<ContactPage />} />
            <Route path='/infopage' element={<InfoPage />} />
            <Route path='/signup' element={<SignUp />} />
            <Route path='/login' element={<Login />} />
          </Routes>
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;