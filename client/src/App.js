import styled from 'styled-components';
import './App.css';
import HeroComponent from './components/HeroComponent';
import Navbar from './components/Navbar';
import InfoBoxes from './components/InfoBoxes';
import WaitlistForm from './components/WaitlistForm';
import mail from './mail.png';
import UserForm from './components/UserForm';
const FullWidthImage = styled.img`
  width: 100%;
  height: auto; /* Maintain aspect ratio */
  display: block; /* Remove any gaps around the image */
`;

function App() {
  return (
    <div className="App">
      <Navbar />
      <HeroComponent />
      <InfoBoxes />
      <FullWidthImage src={mail} alt="Mail" />
      <WaitlistForm />
      <UserForm />
    </div>
  );
}

export default App;
