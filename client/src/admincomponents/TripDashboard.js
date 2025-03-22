import React, { useState, useContext, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import StartNewAdventure from './StartNewAdventure';
import RestaurantChat from './RestaurantChat';
import CuisineChat from './CuisineChat';
import PostRestaurantPopup from './PostRestaurantPopup'; // Import the new popup

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
  background: linear-gradient(-45deg, #9b59b6, #bb80d5, #dab8f0, #ffffff);  min-height: 100vh;
  height: auto;
  width: 100%;
  animation: ${fadeIn} 0.8s ease-in-out, ${gradientAnimation} 15s ease infinite;
  padding-bottom: 40px;
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1.5rem;
  position: relative;
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
  const [activityIdCreated, setActivityIdCreated] = useState(null);
  const [showPostRestaurantPopup, setShowPostRestaurantPopup] = useState(false);
  const [showCuisineChat, setShowCuisineChat] = useState(false);
  const dashboardRef = useRef(null);

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

  // New onClose for RestaurantChat – called when RestaurantChat completes
  const handleRestaurantChatClose = (id) => {
    // Store the created activity ID
    setActivityIdCreated(id);
    // Instead of immediately closing, show the post-chat popup
    setShowPostRestaurantPopup(true);
    // Remove the RestaurantChat overlay
    setSelectedTrip(null);
  };

  return (
    <PageContainer ref={dashboardRef}>
      <DashboardContainer>
        <StartNewAdventure setShowActivities={setShowActivities} onTripSelect={handleTripSelect} />
      </DashboardContainer>
      {selectedTrip === 'Lets Eat' && (
        <>
          <DimmedOverlay />
          <RestaurantChat onClose={handleRestaurantChatClose} />
        </>
      )}

      {/* Render the PostRestaurantPopup once RestaurantChat is done */}
      {showPostRestaurantPopup && (
        <PostRestaurantPopup
          onChat={() => {
            setShowCuisineChat(true);
            setShowPostRestaurantPopup(false);
          }}
          onSkip={() => {
            setShowPostRestaurantPopup(false);
            // Optionally, update board state or set selected activity here if needed
            setSelectedActivityId(activityIdCreated);
          }}
        />
      )}

      {/* Render CuisineChat if user chooses to chat with Voxxy */}
      {showCuisineChat && (
        <CuisineChat
          activityId={activityIdCreated}
          onClose={() => {
            setShowCuisineChat(false);
            setSelectedActivityId(activityIdCreated); // Redirect back to board
          }}
          onChatComplete={() => {
            setShowCuisineChat(false);
            setSelectedActivityId(activityIdCreated); // Redirect back to board
          }}
        />
      )}
    </PageContainer>
  );
}

export default TripDashboard;