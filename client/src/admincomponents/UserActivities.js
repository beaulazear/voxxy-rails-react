import React, { useContext, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';
import PendingInvites from './PendingInvites';
import Woman from '../assets/Woman.jpg';
import TripDashboard from './TripDashboard.js'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1.5rem;
  animation: ${fadeIn} 0.8s ease-in-out;
`;

// 🔹 Responsive Hero Section
const HeroSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);
  color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease-in-out;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem;
    gap: 1rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  img {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .welcome-text {
    display: flex;
    flex-direction: column;
    font-size: 1rem;
    font-weight: 500;

    span {
      font-size: 1.4rem;
      font-weight: 600;
      color: #fff;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    img {
      width: 45px;
      height: 45px;
    }

    .welcome-text span {
      font-size: 1.2rem;
    }
  }
`;

// 🔹 Responsive "New Board" Button
const AddTripButton = styled.button`
  background: #fff;
  color: #6a1b9a;
  font-weight: 600;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 4px 10px rgba(255, 255, 255, 0.2);

  &:hover {
    background: #ffebff;
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 250px;
    padding: 10px;
  }
`;

const SectionTitle = styled.p`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  margin: 0;
  text-align: left;
  font-weight: 600;
  color: #333;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  padding: 1rem;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  }

  .emoji {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #333;
  }
`;

function UserActivities() {
  const { user } = useContext(UserContext);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [showActivities, setShowActivities] = useState(false);

  const handleActivityClick = (activity) => {
    setSelectedActivityId(activity.id);
  };

  const handleBack = () => {
    setSelectedActivityId(null);
  };

  const allActivities = [
    ...(user?.activities || []),
    ...(user?.participant_activities?.filter(activity => activity.accepted).map(p => p.activity) || [])
  ];

  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];

  if (selectedActivityId) {
    return <ActivityDetailsPage activityId={selectedActivityId} onBack={handleBack} />;
  }

  if (showActivities) {
    return <TripDashboard setShowActivities={setShowActivities} />;
  }

  return (
    <DashboardContainer>
      <HeroSection>
        <UserInfo>
          <img src={user?.avatar || Woman} alt="User Avatar" />
          <div className="welcome-text">
            Welcome back, <span>{user?.name || "Explorer"}!</span>
          </div>
        </UserInfo>
        <AddTripButton onClick={() => setShowActivities(true)}>New Board</AddTripButton>
      </HeroSection>

      <PendingInvites />

      <SectionTitle>Your Boards</SectionTitle>
      <CardGrid>
        {uniqueActivities.length > 0 ? (
          uniqueActivities.map((activity) => (
            <ActivityCard key={activity.id} onClick={() => handleActivityClick(activity)}>
              <div className="emoji">{activity.emoji || '🌀'}</div>
              <h3>{activity.activity_name}</h3>
            </ActivityCard>
          ))
        ) : (
          <p>No boards yet! Start a new one now.</p>
        )}
        <ActivityCard onClick={() => setShowActivities(true)}>
          <div className="emoji">➕</div>
          <h3>Start a New Board</h3>
        </ActivityCard>
      </CardGrid>
    </DashboardContainer>
  );
}

export default UserActivities;