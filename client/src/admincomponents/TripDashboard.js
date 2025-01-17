import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import SkiTripChat from './SkiTripChat';
import ActivityDetailsModal from './ActivityDetailsModal';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: bold;
  margin: 0;
  text-align: left;
`;

const SubTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  text-align: left;
  color: #555;
`;

const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  aspect-ratio: 1 / 1.2;
  padding: 0; /* Remove unnecessary padding */
  max-width: 250px;
  overflow: hidden;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-5px);
  }

  img {
    width: 100%;
    height: 70%; /* Takes up most of the space */
    object-fit: cover;
    border-radius: 8px 8px 0 0; /* Rounded only at the top */
  }

  h3 {
    font-size: clamp(1rem, 1.2vw, 1.5rem); /* Larger font size */
    color: #333;
    line-height: 1.2;
    margin-top: auto; /* Pushes the header to the bottom */
    padding: 0.3rem;
  }

  button {
    font-size: 0.9rem;
    background: #e942f5;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.4rem 0.7rem;
    margin: 0.5rem 0;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: #c32cb5;
    }
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  align-items: stretch;
  justify-content: start;
  margin: 1rem 0;
  box-sizing: border-box;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
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

  @media (max-width: 768px) {
    h1 {
      font-size: 6vw;
    }
  }
`;

function TripDashboard() {
  const { user } = useContext(UserContext);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedActivity(null);
  };

  const handleTripSelect = (tripName) => {
    if (tripName === 'Ski Trip') {
      setSelectedTrip('Ski Trip');
    } else {
      alert(`Selected Trip: ${tripName}`);
    }
  };

  if (selectedTrip === 'Ski Trip') return <SkiTripChat />;
  if (!user) {
    return (
      <LoadingScreen>
        <h1>Loading User Data...</h1>
      </LoadingScreen>
    );
  }

  const renderActivityCard = (activity) => (
    <ActivityCard key={activity.id} onClick={() => handleActivityClick(activity)}>
      <img src={activity.image || '/assets/ski-trip-icon.png'} alt={activity.activity_name} />
      <h3>{activity.activity_name}</h3>
    </ActivityCard>
  );

  return (
    <DashboardContainer>
      <SectionTitle>Hello {user.name || 'User'}, your adventure awaits</SectionTitle>
      <SubTitle>Active Boards</SubTitle>
      <CardGrid>
        {user.activities?.length > 0 ? (
          <>
            {user.activities.map(renderActivityCard)}
            <ActivityCard>
              <img src="/assets/request-a-trip-icon.png" alt="Start a New Board" />
              <h3>Start a New Board</h3>
            </ActivityCard>
          </>
        ) : (
          <>
            <ActivityCard>
              <img src="/assets/request-a-trip-icon.png" alt="Start a New Board" />
              <h3>Start a New Board</h3>
            </ActivityCard>
          </>
        )}
      </CardGrid>
      <SectionTitle>Start a new adventure..</SectionTitle>
      <CardGrid>
        {[
          { name: 'Ski Trip', icon: '/assets/ski-trip-icon.png' },
          { name: 'Choose a Destination', icon: '/assets/choose-destination-icon.png' },
          { name: 'Game Night', icon: '/assets/game-night-icon.png' },
          { name: 'Dinner Plans', icon: '/assets/dinner-plans-icon.png' },
          { name: 'Suggest an Adventure', icon: '/assets/request-a-trip-icon.png' },
        ].map(({ name, icon }) => (
          <ActivityCard key={name} onClick={() => handleTripSelect(name)}>
            <img src={icon} alt={name} />
            <h3>{name}</h3>
          </ActivityCard>
        ))}
      </CardGrid>
      <ActivityDetailsModal
        activity={selectedActivity}
        isVisible={isModalVisible}
        onClose={closeModal}
      />
    </DashboardContainer>
  );
}

export default TripDashboard;