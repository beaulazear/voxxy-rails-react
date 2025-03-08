import React, { useState, useContext, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import StartNewAdventure from './StartNewAdventure';
import RestaurantChat from './RestaurantChat';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1.5rem;
  position: relative;
  animation: ${fadeIn} 0.8s ease-in-out; /* Apply animation */
`;

const LoadingScreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  h1 {
    font-size: 4vw;
    font-weight: bold;
    margin: 0;
    background: linear-gradient(to right, #6c63ff, #e942f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const DimmedOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
`;

function TripDashboard({setShowActivities}) {
  const { user } = useContext(UserContext);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const dashboardRef = useRef(null); // Create a ref for the container

  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []); // Runs only when the component mounts

  const handleTripSelect = (tripName) => {
    if (tripName === 'Lets Eat') {
      setSelectedTrip('Lets Eat');
    } else {
      alert(`Selected Trip: ${tripName}`);
    }
  };

  if (!user) {
    return (
      <LoadingScreen>
        <h1>Loading User Data...</h1>
      </LoadingScreen>
    );
  }

  function handleClose() {
    setSelectedTrip(null)
    setShowActivities(false)
  }

  return (
    <div ref={dashboardRef} style={{background: 'linear-gradient(135deg, #6a1b9a, #8e44ad)',  minHeight: '100vh', height: 'auto', width: '100%', animation: 'fadeIn 0.8s ease-in-out', paddingBottom: '40px' }}>
      <DashboardContainer>
        <StartNewAdventure setShowActivities={setShowActivities} onTripSelect={handleTripSelect} />
      </DashboardContainer>
      {selectedTrip === 'Lets Eat' && (
        <>
          <DimmedOverlay />
          <RestaurantChat onClose={handleClose} />
        </>
      )}
    </div>
  );
}

export default TripDashboard;