import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';
import PendingInvites from './PendingInvites';

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

const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  padding: 0;
  max-width: 250px;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
  }

  .emoji {
    font-size: 4rem;
    margin-top: 1rem;
    line-height: 1;
  }

  h3 {
    font-size: clamp(1rem, 1.2vw, 1.5rem);
    color: #333;
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
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const navigate = useNavigate()

  const handleActivityClick = (activity) => {
    setSelectedActivityId(activity.id); // Pass only the ID
  };

  const handleBack = () => {
    setSelectedActivityId(null);
  };

  const allActivities = [
    ...(user?.activities || []), 
    ...(user?.participant_activities?.filter(activity => activity.accepted).map(p => p.activity) || []) // ✅ Extract the `activity` object
  ];

  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];

  const renderActivityCard = (activity) => (
    <ActivityCard key={activity.id} onClick={() => handleActivityClick(activity)}>
      <div className="emoji">{activity.emoji || '🌀'}</div>
      <h3>{activity.activity_name}</h3>
    </ActivityCard>
  );

  if (selectedActivityId) {
    return (
      <ActivityDetailsPage
        activityId={selectedActivityId}
        onBack={handleBack}
      />
    );
  }
  console.log(uniqueActivities)
  return (
    <DashboardContainer>
      <PendingInvites />
      <SectionTitle>Your Boards</SectionTitle>
      <CardGrid>
        {uniqueActivities.length > 0 ? (
          uniqueActivities.map(renderActivityCard)
        ) : (
          <ActivityCard onClick={() => navigate('/activities')}>
            <div className="emoji">➕</div>
            <h3>Start a New Board</h3>
          </ActivityCard>
        )}
      </CardGrid>
    </DashboardContainer>
  );
}

export default UserActivities;