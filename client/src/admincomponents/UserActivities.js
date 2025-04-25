import React, { useContext, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';
import PendingInvites from './PendingInvites';
import TripDashboard from './TripDashboard.js';
import Woman from '../assets/Woman.jpg'
import YourCommunity from './YourCommunity.js';
import NoBoardsDisplay from './NoBoardsDisplay.js';
import { HelpCircle, X } from 'lucide-react';

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

const HeroContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2rem 1rem;
  background-color: #201925;
  position: relative;
  text-align: left;

  @media (max-width: 768px) {
    padding: .5rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeroTitle = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: bold;
  color: #fff;
  margin: 0 auto;
`;

const HeroSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #fff;
  margin: 0.5rem 0 0;
`;

const HelpIcon = styled.div`
  position: absolute;
  top: 1.5rem;      /* tweak this to vertically align with your title */
  right: 1rem;      /* distance from the right edge */
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #fff;

  &:hover {
    opacity: 0.8;
  }
`;

const HelpOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
`;

const HelpPopup = styled.div`
  position: fixed;
  top: 5rem;
  right: 1rem;
  background: #fff;
  background-color: #2C1E33;
  padding: 1rem;
  width: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 4px #fff;
  z-index: 1001;

  @media (max-width: 600px) {
    right: 0.5rem;
    width: 260px;
  }
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #fff;
`;

const PopupTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #fff;
`;

const PopupList = styled.ol`
  margin: 0;
  padding-left: 1.2rem;
  text-align: left;
  color: #fff;

  li {
    margin-bottom: 0.75rem;

    strong {
      display: block;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.3;
    }
  }
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: .5px;
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeIn} 0.8s ease-in-out;

  @media (max-width: 768px) {
    padding: 1rem;
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
  margin-bottom: 1rem;

  &::-webkit-scrollbar {
    display: none;
  }

  scrollbar-width: none;

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
  height: 200px; /* Slightly increased for better spacing */
  width: 240px; /* Increased for better text layout */
  flex-shrink: 0;
  overflow: hidden;
  color: white;
  background-image: ${({ $emoji }) =>
    `url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><text x='10' y='30' font-size='30' fill='rgba(255,255,255,1)'>${$emoji || '🍜'}</text><text x='50' y='70' font-size='30' fill='rgba(255,255,255,1)'>${$emoji || '🍜'}</text></svg>")`};
  background-size: 75px 75px;
  background-repeat: repeat;
  background-color: white;
  scroll-snap-align: center;
  text-align: left;
  backdrop-filter: blur(5px); /* Softens emoji background */

  &:hover {
    transform: translateY(4px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  }

  .content {
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    width: 100%;
    padding: 1rem;
  }

  h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    color: white;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px 14px;
    border-radius: 19px;
    max-width: 100%;
    text-align: center;
    width: fit-content;
    backdrop-filter: blur(2px);
  }

  .host-info {
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    font-weight: bold;
    color: #fff;
    background: rgba(0, 0, 0, 0.8);
    padding: 6px 12px;
    border-radius: 8px;
    position: absolute;
    bottom: 50px;
    left: 8px;
    backdrop-filter: blur(3px);
    width: fit-content;
    right: auto;
  }

  .host-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid white;
    margin-right: 5px;
  }

  .date-time {
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
    background: rgba(0, 0, 0, .8);
    padding: 6px 12px;
    border-radius: 6px;
    position: absolute;
    bottom: 10px;
    left: 8px;
    text-align: center;
    backdrop-filter: blur(3px);
    width: calc(90% - 16px);
    right: auto;
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
  padding-top: 80px;
  background-color: #201925;
`

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2.5rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: flex-start;

  @media (max-width: 768px) {
    padding: 1rem;
    justify-content: center;
  }
`;

const FilterButton = styled.button`
  padding: 0.7rem 1.4rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: ${({ $active }) => ($active ? '#6a1b9a' : 'rgba(255, 255, 255, 0.2)')};
  border: 2px solid white;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  backdrop-filter: blur(8px);

  &:hover {
    background: white;
    color: #8e44ad;
  }

  @media (max-width: 600px) {
    /* 🔹 Smaller buttons for mobile */
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  @media (max-width: 400px) {
    /* 🔹 Even smaller buttons for very small screens */
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
`;

function UserActivities() {
  const { user } = useContext(UserContext);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [showActivities, setShowActivities] = useState(false);
  const [filterType, setFilterType] = useState("upcoming");
  const [helpVisible, setHelpVisible] = useState(false);

  const topRef = useRef(null)

  const handleActivityClick = (activity) => {
    setSelectedActivityId(activity.id);
  };

  const handleBack = () => {
    setSelectedActivityId(null);
    setShowActivities(false)
  };

  const toggleHelp = () => setHelpVisible(v => !v);

  function extractHoursAndMinutes(isoString) {
    if (!isoString) return "Time: TBD";
    return isoString.slice(11, 16);
  }

  const allActivities = [
    ...(user?.activities || []),
    ...(user?.participant_activities?.filter(activity => activity.accepted).map(p => p.activity) || [])
  ];

  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];

  const filteredActivities = uniqueActivities
    .filter(activity => (filterType === "upcoming" ? !activity.completed : activity.completed)) // ✅ Filtering Logic
    .sort((a, b) => {
      const dateA = a.date_day ? new Date(a.date_day).setHours(0, 0, 0, 0) : Infinity;
      const dateB = b.date_day ? new Date(b.date_day).setHours(0, 0, 0, 0) : Infinity;
      return dateA - dateB;
    });

  if (selectedActivityId) {
    return (
      <>
        <ActivityDetailsPage activityId={selectedActivityId} onBack={handleBack} />;
      </>
    )
  }

  if (showActivities) {
    return (
      <>
        <TripDashboard setShowActivities={setShowActivities} setSelectedActivityId={setSelectedActivityId} />;
      </>
    )
  }


  return (
    <>
      <Padding>
        <DashboardContainer ref={topRef}>
          <HeroContainer>
            <TextContainer>
              <HeroTitle>Welcome back, {user.name}! 👋</HeroTitle>
              <HeroSubtitle>What are you planning today?</HeroSubtitle>
            </TextContainer>
            <HelpIcon onClick={toggleHelp}>
              <HelpCircle size={24} />
            </HelpIcon>
          </HeroContainer>

          {helpVisible && (
            <HelpOverlay onClick={toggleHelp}>
              <HelpPopup onClick={e => e.stopPropagation()}>
                <PopupHeader>
                  <PopupTitle>How to use this page</PopupTitle>
                  <CloseButton onClick={toggleHelp}>
                    <X size={16} />
                  </CloseButton>
                </PopupHeader>
                <PopupList>
                  <li>
                    <strong>Add People to the Board</strong>
                    <p>Click on a board and use the 'Add Guest' button to invite others to collaborate on your plans.</p>
                  </li>
                  <li>
                    <strong>Take the Preference Quiz</strong>
                    <p>Click 'Take Quiz' in any board to help us personalize recommendations based on everyone's preferences.</p>
                  </li>
                  <li>
                    <strong>View Itinerary</strong>
                    <p>Open a board and check the itinerary section to see all planned activities and details.</p>
                  </li>
                  <li>
                    <strong>Manage Tasks</strong>
                    <p>Use the task list in each board to track action items and assign responsibilities.</p>
                  </li>
                </PopupList>
              </HelpPopup>
            </HelpOverlay>
          )}
          <PendingInvites />
          <ButtonContainer>
            <FilterButton
              $active={filterType === "upcoming"}
              onClick={() => setFilterType("upcoming")}
            >
              Upcoming Boards
            </FilterButton>
            <FilterButton
              $active={filterType === "past"}
              onClick={() => setFilterType("past")}
            >
              Past Boards
            </FilterButton>
          </ButtonContainer>

          {filteredActivities.length > 0 ? (
            <CardGrid>
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  $emoji={activity.emoji}
                >
                  <div className="content">
                    <h3>{activity.activity_name}</h3>
                    <div className="host-info">
                      {activity.user ? (
                        <>
                          <img className="host-avatar" src={activity.user.avatar || Woman} alt={activity.user.name || "Unknown User"} />
                          <span>{activity.user.name}</span>
                        </>
                      ) : (
                        <span>Host: Unknown</span>
                      )}
                    </div>
                    <div className="date-time">
                      {activity.date_day ? (
                        <span> 📆 {activity.date_day}</span>
                      ) : (
                        <span> 📆 Date: TBD</span>
                      )}
                      {activity.date_time ? (
                        <span> ⏰ {extractHoursAndMinutes(activity.date_time)}</span>) : (
                        <span> ⏰ Time: TBD</span>
                      )}
                    </div>
                  </div>
                </ActivityCard>
              ))}
            </CardGrid>
          ) : (
            <NoBoardsDisplay onCreateBoard={() => setShowActivities(true)} />
          )}
          <YourCommunity />
        </DashboardContainer>
      </Padding>
    </>
  );
}

export default UserActivities;