import React, { useState, useContext, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import StartNewAdventure from './StartNewAdventure';
import RestaurantChat from './RestaurantChat';
import CuisineChat from './CuisineChat';
import PostRestaurantPopup from './PostRestaurantPopup';
import mixpanel from 'mixpanel-browser';

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
  const [activityIdCreated, setActivityIdCreated] = useState(null);
  const [showPostRestaurantPopup, setShowPostRestaurantPopup] = useState(false);
  const [showCuisineChat, setShowCuisineChat] = useState(false);
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  const handleRestaurantChatClose = (id) => {
    if (id) {
      setActivityIdCreated(id);
      setSelectedTrip(null);
      setShowPostRestaurantPopup(true);
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
          <RestaurantChat onClose={handleRestaurantChatClose} />
        </>
      )}

      {showPostRestaurantPopup && (
        <PostRestaurantPopup
          onChat={() => {
            setShowCuisineChat(true);
            setShowPostRestaurantPopup(false);
          }}
          onSkip={() => {
            if (process.env.NODE_ENV === 'production') {
              mixpanel.track('Chat Skipped', {
                name: user.name,
              });
            }
            setShowPostRestaurantPopup(false);
            setSelectedActivityId(activityIdCreated);
          }}
        />
      )}

      {showCuisineChat && (
        <CuisineChat
          activityId={activityIdCreated}
          onClose={() => {
            setShowCuisineChat(false);
            setSelectedActivityId(activityIdCreated);
          }}
          onChatComplete={() => {
            setShowCuisineChat(false);
            setSelectedActivityId(activityIdCreated);
          }}
        />
      )}
    </PageContainer>
  );
}

export default TripDashboard;