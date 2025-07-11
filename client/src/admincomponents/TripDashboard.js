import React, { useState, useContext, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import StartNewAdventure from './StartNewAdventure';
import RestaurantChat from './RestaurantChat';
import CocktailsChat from '../cocktails/CocktailsChat';
import LetsMeetForm from '../letsmeet/LetsMeetForm';

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

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const PageContainer = styled.div`
  width: 100%;
  animation: ${fadeIn} 0.8s ease-in-out, ${gradientAnimation} 15s ease infinite;
  padding-bottom: 50px;
  background-color: #201925;

  /* full-viewport stretch on desktop */
  @media (min-width: 850px) {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-height: 100vh;
  }
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

function TripDashboard({ setShowActivities, setSelectedActivityId }) {
  const { user } = useContext(UserContext);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleTripSelect = (tripName) => {
    switch (tripName) {
      case 'Lets Eat':
        setSelectedTrip('Lets Eat');
        break;

      case 'Lets Meet':
        setSelectedTrip('Lets Meet');
        break;

      case 'Night Out':
        setSelectedTrip('Night Out');
        break;

      default:
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

  const handleClose = (id) => {
    if (id) {
      setSelectedActivityId(id);
      setSelectedTrip(null);
    } else {
      setSelectedTrip(null);
    }
  };

  return (
    <PageContainer ref={dashboardRef}>
      <StartNewAdventure setShowActivities={setShowActivities} onTripSelect={handleTripSelect} />

      {selectedTrip === 'Lets Eat' && (
        <>
          <DimmedOverlay />
          <RestaurantChat onClose={handleClose} />
        </>
      )}

      {selectedTrip === 'Lets Meet' && (
        <>
          <LetsMeetForm onClose={handleClose} />
        </>
      )}

      {selectedTrip === 'Night Out' && (
        <>
          <DimmedOverlay />
          <CocktailsChat onClose={handleClose} />
        </>
      )}
    </PageContainer>
  );
}

export default TripDashboard;