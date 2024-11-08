import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/HomePage';
import WaitlistPage from './components/WaitlistPage';
import VapiAssistant from './components/VapiAssistant';
import ContactPage from './components/Contact';
import InfoPage from './components/InfoPage';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/waitlist' element={<WaitlistPage />} />
        <Route path='/demo' element={<VapiAssistant />} />
        <Route path='/contact' element={<ContactPage />} />
        <Route path='/infopage' element={<InfoPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;