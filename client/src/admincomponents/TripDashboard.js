import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import StartNewAdventure from './StartNewAdventure';
import RestaurantChat from './RestaurantChat';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1.5rem;
  position: relative; /* Needed for proper stacking of child elements */
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
  background: rgba(0, 0, 0, 0.5); /* Dimmed background */
  z-index: 998; /* Lower than the chat box */
`;

function TripDashboard() {
  const { user } = useContext(UserContext);
  const [selectedTrip, setSelectedTrip] = useState(null);

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

  return (
    <>
      <DashboardContainer>
        <StartNewAdventure onTripSelect={handleTripSelect} />
      </DashboardContainer>
      {/* Conditionally render the chat with an overlay */}
      {selectedTrip === 'Lets Eat' && (
        <>
          <DimmedOverlay />
          <RestaurantChat onClose={() => setSelectedTrip(null)} />
        </>
      )}
    </>
  );
}

export default TripDashboard;