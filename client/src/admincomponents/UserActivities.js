import React, { useContext, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';
import PendingInvites from './PendingInvites';
import TripDashboard from './TripDashboard.js';
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
  box-sizing: border-box; 
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2rem 1rem;
  background-color: #201925;
  position: relative;
  text-align: left;

  @media (max-width: 768px) {
    padding: 0.5rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 50px;
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
  box-shadow: 0 2px 4px #8e44ad;
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
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.8s ease-in-out;

  @media (max-width: 768px) {
    padding: 1rem;
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

const FilterRow = styled.div`
  display: flex;
  margin-left: -1rem;
  margin-right: -1rem;
  gap: 1rem;
  padding: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const FilterButton = styled.button`
  flex-shrink: 0;
  padding: 0.6rem 1.2rem;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, #8e44ad, #6a1b9a)'
      : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, #7b3ea1, #5a1675)'
      : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const NewBoardButton = styled.button`
  flex-shrink: 0;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #1f7a8c, #295f72);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #17606f, #1f4f5b);
  }
`;

const CardGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem 0;
  }
`;

const ActivityCard = styled.div`
  background: #2C1E33;
  color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;
  max-width: 410px;
  height: auto;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5);
  }

  .content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  .type-label {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    background: #7b298d;
    padding: 4px 10px;
    border-radius: 999px;
    display: inline-block;
    width: fit-content;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .host-info,
  .date-time {
    font-size: 0.85rem;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-block;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    min-height: 140px;
  }
`;

function UserActivities() {
  const { user } = useContext(UserContext);

  const pendingInvitesCount = user?.participant_activities
    ?.filter(invite => !invite.accepted)
    .length || 0;

  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [showActivities, setShowActivities] = useState(false);
  const [filterType, setFilterType] = useState(pendingInvitesCount > 0 ? "invites" : "upcoming");
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
    ...(user?.participant_activities
      ?.filter(activity => activity.accepted)
      .map(p => p.activity) || [])
  ];
  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];
  const filteredActivities = uniqueActivities
    .filter(activity => (filterType === "upcoming" ? !activity.completed : activity.completed))
    .sort((a, b) => new Date(a.date_day) - new Date(b.date_day));

  if (selectedActivityId) {
    return (
      <>
        <ActivityDetailsPage activityId={selectedActivityId} onBack={handleBack} />
      </>
    )
  }

  if (showActivities) {
    return (
      <>
        <TripDashboard setShowActivities={setShowActivities} setSelectedActivityId={setSelectedActivityId} />
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
          <FilterRow>
            <FilterButton
              $active={filterType === "upcoming"}
              onClick={() => setFilterType("upcoming")}
            >
              Upcoming
            </FilterButton>

            <FilterButton
              $active={filterType === "past"}
              onClick={() => setFilterType("past")}
            >
              Past
            </FilterButton>

            <FilterButton
              $active={filterType === "invites"}
              onClick={() => setFilterType("invites")}
            >
              Invites {pendingInvitesCount > 0 ? `(${pendingInvitesCount})` : ""}
            </FilterButton>

            <NewBoardButton onClick={() => setShowActivities(true)}>
              + New
            </NewBoardButton>
          </FilterRow>

          {filterType === "invites" ? (
            <PendingInvites />
          ) : filteredActivities.length > 0 ? (
            <CardGrid>
              {filteredActivities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="content">

                    <div className="type-label">
                      {activity.activity_type} {activity.emoji}
                    </div>

                    <h3>{activity.activity_name}</h3>

                    <div className="host-info">
                      <span>Host: {activity.user?.name || "Host: Unknown"}</span>
                    </div>

                    <div className="date-time">
                      {activity.date_day ? `📆 ${activity.date_day}` : "📆 TBD"}{" "}
                      {activity.date_time
                        ? `⏰ ${extractHoursAndMinutes(activity.date_time)}`
                        : "⏰ TBD"}
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