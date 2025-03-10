import React, { useContext, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';
import PendingInvites from './PendingInvites';
import TripDashboard from './TripDashboard.js';
import VoxxyFooter from '../components/VoxxyFooter.js';
import Profile from './Profile.js';
import Woman from '../assets/Woman.jpg'

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

const HeroContainer = styled.div`
  padding: 1.5rem 2.5rem 1rem;
  text-align: left;
  max-width: 1200px;

  @media (max-width: 768px) {
    padding: 0rem .5rem .5rem;
  }
`;

const WelcomeText = styled.h1`
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 700;
  margin-bottom: 0.3rem;
`;

const SubText = styled.p`
  font-size: 1.2rem;
  font-weight: 500;
  opacity: 0.9;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SectionTitle = styled.p`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  margin: 0;
  margin-bottom: 0;
  text-align: left;
  font-weight: 600;
  color: #333;
  padding: 1.5rem 2.5rem 1rem;
  text-align: left;
  max-width: 1200px;

  @media (max-width: 768px) {
    padding: 0rem .5rem .5rem;
  }
`;

const CardGrid = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0 1rem 10px; /* Add side padding for smooth scrolling */
  scroll-snap-type: x mandatory; 
  margin-left: -2rem;
  margin-right: -2rem;

  /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for Firefox */
  scrollbar-width: none;

  /* Hide scrollbar for Edge and IE */
  -ms-overflow-style: none;
`;


const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  padding: 1rem;
  cursor: pointer;
  position: relative;
  height: 180px;
  width: 220px;
  flex-shrink: 0;
  overflow: hidden;
  color: white;
  background-image: ${({ $emoji }) =>
    `url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><text x='10' y='30' font-size='30' fill='rgba(255,255,255,0.7)'>${$emoji || '🍜'}</text><text x='50' y='70' font-size='30' fill='rgba(255,255,255,0.7)'>${$emoji || '🍜'}</text></svg>")`};
  background-size: 50px 50px;
  background-repeat: repeat;
  scroll-snap-align: center;

  &:hover {
    transform: translateY(4px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  }

  .content {
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    padding: 1rem;
    text-align: center;
  }

  .emoji {
    font-size: 3rem;
    filter: drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.8));
  }

  h3 {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0;
    color: black;
    background: white;
    padding: 5px 10px;
    border-radius: 19px;
    max-width: 100%;
    text-align: center;
  }

  .host-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: bold;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    padding: 6px 10px;
    border-radius: 8px;
    width: 87%;
    justify-content: space-between;
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
  }

  .host-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid white;
  }

  .date-notes {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: 400;
  }
`;


const StartBoardCard = styled(ActivityCard)`
  background: rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(4px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
    background: rgba(0, 0, 0, 0.2);
  }

    h3 {
    font-size: 1.2rem;
    background: rgba(0, 0, 0, 0);
    filter: none;
  }
`;

export const Button = styled.button`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg,  #8e44ad, #6a1b9a);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s ease-in-out;

  &:hover {
    background: linear-gradient(135deg, #4e0f63, #6a1b8a);
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
`;

const Padding = styled.div`
  padding-bottom: 50px;
`

function UserActivities() {
  const { user } = useContext(UserContext);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [showActivities, setShowActivities] = useState(false);
  const [showProfile, setShowProfile] = useState(false)

  const handleActivityClick = (activity) => {
    setSelectedActivityId(activity.id);
  };

  const handleBack = () => {
    setSelectedActivityId(null);
    setShowActivities(false)
    setShowProfile(false)
  };

  const handleShowActivities = () => {
    setShowProfile(false)
    setSelectedActivityId(null);
    setShowActivities(true)
  }

  const handleShowProfile = () => {
    setSelectedActivityId(null);
    setShowActivities(false)
    setShowProfile(true)
  }

  const allActivities = [
    ...(user?.activities || []),
    ...(user?.participant_activities?.filter(activity => activity.accepted).map(p => p.activity) || [])
  ];

  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];

  if (selectedActivityId) {
    return (
      <>
        <ActivityDetailsPage activityId={selectedActivityId} onBack={handleBack} />;
        <VoxxyFooter handleBack={handleBack} handleShowProfile={handleShowProfile} handleShowActivities={handleShowActivities} />
      </>
    )
  }

  if (showActivities) {
    return (
      <>
        <TripDashboard setShowActivities={setShowActivities} />;
        <VoxxyFooter handleBack={handleBack} handleShowProfile={handleShowProfile} handleShowActivities={handleShowActivities} />
      </>
    )
  }

  if (showProfile) {
    return (
      <>
        <Profile />
        <VoxxyFooter handleBack={handleBack} handleShowProfile={handleShowProfile} handleShowActivities={handleShowActivities} />
      </>
    )
  }

  return (
    <>
      <Padding>
        <DashboardContainer>

          <HeroContainer>
            <WelcomeText>Welcome back, {user.name}!</WelcomeText>
            <SubText>
              Let's start planning together.
            </SubText>
            <Button onClick={handleShowActivities}>➕ New Board</Button>
          </HeroContainer>

          <PendingInvites />

          <SectionTitle>Your Boards</SectionTitle>
          <CardGrid>
            {uniqueActivities.length > 0 ? (
              uniqueActivities.map((activity) => (
                <ActivityCard key={activity.id} onClick={() => handleActivityClick(activity)} $emoji={activity.emoji}>
                  <div className="content">
                    <h3>{activity.activity_name}</h3>
                    <div className="emoji">{activity.emoji || '🌀'}</div>
                  </div>
                  <div className="host-info">
                    <img className="host-avatar" src={activity.user.avatar || Woman} alt={activity.user.name} />
                    <div>
                      {activity.user.name}
                      {activity.date_notes && <div className="date-notes">{activity.date_notes}</div>}
                    </div>
                  </div>
                </ActivityCard>
              ))
            ) : (
              <p>No boards yet! Start a new one now.</p>
            )}
            <StartBoardCard onClick={() => setShowActivities(true)}>
              <div className="content">
                <div className="emoji">➕</div>
                <h3>Start a New Board</h3>
              </div>
            </StartBoardCard>
          </CardGrid>
        </DashboardContainer>
      </Padding>
      <VoxxyFooter handleBack={handleBack} handleShowProfile={handleShowProfile} handleShowActivities={handleShowActivities} />
    </>
  );
}

export default UserActivities;