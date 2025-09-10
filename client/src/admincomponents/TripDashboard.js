import React, { useState, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import StartNewAdventure from './StartNewAdventure';
import UnifiedActivityChat from './UnifiedActivityChat';
import GameNightChat from '../gamenight/GameNightChat';

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1A1625 0%, #2D1B47 100%);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    animation: none;
  }
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1A1625 0%, #2D1B47 100%);
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
  background: linear-gradient(135deg, #1A1625 0%, #2D1B47 100%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    will-change: auto;
  }
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
  transition: background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  @media (hover: hover) {
    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
  
  &:active {
    background-color: rgba(255, 255, 255, 0.15);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
      dashboardRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, []);

  const handleTripSelect = (tripName) => {
    switch (tripName) {
      case 'Lets Eat':
        setSelectedTrip('Unified');
        break;
      case 'Night Out':
        setSelectedTrip('Unified');
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

      {/* Unified Activity Chat Modal */}
      {selectedTrip === 'Unified' && (
        <ModalOverlay>
          <ModalHeader>
            <ModalTitle>Create Your Plan</ModalTitle>
            <CloseButton onClick={() => handleFormClose()}>
              <XIcon />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <UnifiedActivityChat 
              onClose={handleFormClose}
              onSubmit={async (data) => {
                // Handle submission here
                console.log('Activity data:', data);
                // You can integrate with your existing API here
                handleFormClose();
              }}
            />
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

export default React.memo(TripDashboard);