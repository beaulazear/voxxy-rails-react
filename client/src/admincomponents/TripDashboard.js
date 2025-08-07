import React, { useState, useContext, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import StartNewAdventure from './StartNewAdventure';
import RestaurantChat from './RestaurantChat';
import CocktailsChat from '../cocktails/CocktailsChat';
import LetsMeetForm from '../letsmeet/LetsMeetForm';
import GameNightChat from '../gamenight/GameNightChat';

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

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #201925;
  animation: ${fadeIn} 0.8s ease-in-out;
  display: flex;
  flex-direction: column;
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #201925;
  min-height: 100vh;
`;

const LoadingTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #201925;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(64, 51, 71, 0.3);
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

// Removed unused PlaceholderText component

// X Icon Component (simple SVG)
const XIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function LoadingScreen() {
  return (
    <LoadingContainer>
      <LoadingTitle>Loading User Data...</LoadingTitle>
    </LoadingContainer>
  );
}

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
    console.log(`🎯 Selected trip: ${tripName}`);

    switch (tripName) {
      case 'Lets Eat':
        setSelectedTrip('Restaurant');
        break;
      case 'Lets Meet':
        setSelectedTrip('Meeting');
        break;
      case 'Night Out':
        setSelectedTrip('Night Out');
        break;
      case 'Game Night':
        setSelectedTrip('Game Night');
        break;
      case 'Find a Destination':
        alert('Coming Soon!\nThis feature is currently in development and will be available soon.');
        break;
      default:
        alert(`${tripName} will be available soon!`);
    }
  };

  const handleFormClose = (newActivityId) => {
    if (newActivityId) {
      setSelectedTrip(null);
      setSelectedActivityId(newActivityId);
    } else {
      setSelectedTrip(null);
    }
  };

  const handleBack = () => {
    if (setShowActivities) {
      setShowActivities(false);
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <LoadingScreen />
      </PageContainer>
    );
  }

  return (
    <PageContainer ref={dashboardRef}>
      <StartNewAdventure
        onTripSelect={handleTripSelect}
        onBack={handleBack}
      />

      {/* Restaurant Chat Modal */}
      {selectedTrip === 'Restaurant' && (
        <ModalOverlay>
          <ModalHeader>
            <ModalTitle>Plan Your Meal</ModalTitle>
            <CloseButton onClick={() => handleFormClose()}>
              <XIcon />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <RestaurantChat onClose={handleFormClose} />
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Lets Meet Modal */}
      {selectedTrip === 'Meeting' && (
        <ModalOverlay>
          <ModalHeader>
            <ModalTitle>Schedule a Meeting</ModalTitle>
            <CloseButton onClick={() => handleFormClose()}>
              <XIcon />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <LetsMeetForm onClose={handleFormClose} />
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Cocktails Chat Modal */}
      {selectedTrip === 'Night Out' && (
        <ModalOverlay>
          <ModalHeader>
            <ModalTitle>Plan Your Night Out</ModalTitle>
            <CloseButton onClick={() => handleFormClose()}>
              <XIcon />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <CocktailsChat onClose={handleFormClose} />
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Game Night Chat Modal */}
      {selectedTrip === 'Game Night' && (
        <ModalOverlay>
          <ModalHeader>
            <ModalTitle>Setup Game Night</ModalTitle>
            <CloseButton onClick={() => handleFormClose()}>
              <XIcon />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <GameNightChat onClose={handleFormClose} />
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}

export default TripDashboard;