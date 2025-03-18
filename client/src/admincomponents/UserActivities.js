import React, { useContext, useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';
import PendingInvites from './PendingInvites';
import TripDashboard from './TripDashboard.js';
import VoxxyFooter from '../components/VoxxyFooter.js';
import Profile from './Profile.js';
import Woman from '../assets/Woman.jpg'
import YourCommunity from './YourCommunity.js';
import NoBoardsDisplay from './NoBoardsDisplay.js';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: .5px;
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeIn} 0.8s ease-in-out;
  
  @media (min-width: 100px) {
    pading: 5rem;
  }
`;

const HeroContainer = styled.div`
  padding: 0rem 2rem;
  text-align: left;
  max-width: 1500px;

  @media (max-width: 768px) {
    padding: 0rem .5rem .0rem;
    margin-top: 0px;
    margin-bottom: 0px;
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
    font-size: 1.5rem;
    font-weight: 800;
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
  background: linear-gradient(-45deg, #9b59b6, #bb80d5, #dab8f0, #ffffff);;
`

const IntroText = styled.h2`
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: bold;
  color: #000;
  text-align: left;
  margin: 0;
  padding: 0;
  max-width: 600px; 
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    text-align: left;
    padding-left: 0.5rem;
  }
`;

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
  const [showProfile, setShowProfile] = useState(false)
  const [intro, setIntro] = useState("");
  const [filterType, setFilterType] = useState("upcoming"); // 🔹 Sorting state

  const topRef = useRef(null)

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const defaultIntros = [
      "Your next adventure starts now! Let’s make some memories. 🎉",
      "From group chat chaos to actual plans—Voxxy’s got you. 😉",
      "Ditch the ‘we should hang out’ texts. Let's make it happen! ✨",
      "Less typing, more doing. Ready to Voxxy? 🚀",
      "Your squad deserves better than ‘someday.’ Let’s plan it! 🌎",
      "No more ghosted plans. Get together, for real this time. 👻",
      "Planning made fun, not frustrating. Welcome to Voxxy! 🎭",
      "Why talk about it when you can DO it? Let’s go! 🚦",
      "Good vibes, great company, better plans. That’s Voxxy. 🍾",
      "Hit ‘start’ on your next great memory. Voxxy it up! 🔥",
    ];

    if (user?.name) {
      const personalizedIntros = [
        `Hey ${user.name}, your next adventure starts now! 🎉`,
        `${user.name}, let's turn those group chat plans into reality. 😉`,
        `Time to make things happen, ${user.name}! ✨`,
        `Less texting, more action, ${user.name}. Ready to go? 🚀`,
        `Your squad deserves better, ${user.name}. Let's plan it! 🌎`,
        `No more ghosted plans, ${user.name}. Let’s do this! 👻`,
        `Planning made fun, not frustrating, right ${user.name}? 🎭`,
        `Why talk about it when you can DO it, ${user.name}? 🚦`,
        `Good vibes, great company, and better plans—just for you, ${user.name}. 🍾`,
        `Time to hit ‘start’ on your next great memory, ${user.name}! 🔥`
      ];
      setIntro(personalizedIntros[Math.floor(Math.random() * personalizedIntros.length)]);
    } else {
      setIntro(defaultIntros[Math.floor(Math.random() * defaultIntros.length)]);
    }
  }, [user]);

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
        <VoxxyFooter handleBack={handleBack} handleShowProfile={handleShowProfile} handleShowActivities={handleShowActivities} />
      </>
    )
  }

  if (showActivities) {
    return (
      <>
        <TripDashboard setShowActivities={setShowActivities} setSelectedActivityId={setSelectedActivityId} />;
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
        <DashboardContainer ref={topRef}>
          <HeroContainer>
            <IntroText>{intro}</IntroText>
          </HeroContainer>
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
      <VoxxyFooter handleBack={handleBack} handleShowProfile={handleShowProfile} handleShowActivities={handleShowActivities} />
    </>
  );
}

export default UserActivities;