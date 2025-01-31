import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';

const SectionTitle = styled.p`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  margin: 0;
  text-align: left;
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

const ActivityCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ active }) => (active ? '#fff' : '#e0e0e0')};
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  padding: 0;
  max-width: 250px;
  overflow: hidden;
  pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  opacity: ${({ active }) => (active ? '1' : '0.6')};

  &:hover {
    transform: ${({ active }) => (active ? 'translateY(-5px)' : 'none')};
  }

  .emoji {
    font-size: 4rem;
    margin-top: 1rem;
    line-height: 1;
  }

  h3 {
    font-size: clamp(1rem, 1.2vw, 1.5rem);
    color: ${({ active }) => (active ? '#333' : '#888')};
    line-height: 1.2;
    margin-top: auto;
    padding: 0.3rem;
  }
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1.5rem;
`;

function UserActivities() {
  const { user } = useContext(UserContext);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
  };

  const handleBack = () => {
    setSelectedActivity(null);
  };
  
  const renderActivityCard = (activity) => (
    <ActivityCard key={activity.id} active={true} onClick={() => handleActivityClick(activity)}>
      <div className="emoji">{activity.emoji || '🌀'}</div>
      <h3>{activity.activity_name}</h3>
    </ActivityCard>
  );

  if (selectedActivity) {
    return (
      <ActivityDetailsPage
        activity={selectedActivity}
        onBack={handleBack}
      />
    );
  }

  return (
    <DashboardContainer>
      <SectionTitle>Your Boards</SectionTitle>
      <CardGrid>
        {user?.activities?.length > 0 ? (
          user.activities.map(renderActivityCard)
        ) : (
          <ActivityCard active={true}>
            <div className="emoji">➕</div>
            <h3>Start a New Board</h3>
          </ActivityCard>
        )}
      </CardGrid>
    </DashboardContainer>
  );
}

export default UserActivities;