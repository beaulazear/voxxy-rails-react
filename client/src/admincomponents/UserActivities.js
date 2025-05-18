import React, { useContext, useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Countdown from 'react-countdown';
import { UserContext } from '../context/user';
import ActivityDetailsPage from './ActivityDetailsPage';
import PendingInvites from './PendingInvites';
import TripDashboard from './TripDashboard.js';
import YourCommunity from './YourCommunity.js';
import NoBoardsDisplay from './NoBoardsDisplay.js';
import { HelpCircle, X, User, Users, CalendarDays, Clock } from 'lucide-react';
import groupmeals from '../assets/groupmeals.jpeg';
import LetsMeetCardThree from '../assets/LetsMeetCardThree.jpeg';

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

const CountdownContainer = styled.div`
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Digital-7 Mono', monospace;  /* pick your digital font or import one */
  font-size: 2.5rem;
  color: #fff;
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 320px));
  gap: 1rem;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem 0;
  }
`;

export const ActivityCard = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
`;

export const ImageContainer = styled.div`
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background-image: ${props => `url("${props.$bgimage}")`};
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
  
  ${ActivityCard}:hover & {
    transform: scale(1.1);
  }
`;

export const CardLabel = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 25%;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.75rem 1rem;

  h3 {
    margin: 0;
    margin-top: 1rem;
    font-size: 1.3rem;
    font-weight: 600;
    text-align: left;
  }

  .meta {
    font-size: 0.8rem;
    margin-bottom: .5rem;
    display: flex;
    justify-content: space-between;
  }
`;

export const TypeTag = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #7b298d;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 2px solid black;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
`;

export const HostTag = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: #7b298d;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 2px solid black;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
`;

const ViewBoard = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #CC31E8;

  &:hover {
    color: #7B298C;
  }

  span {
    margin-left: 0.25rem;
    transition: transform 0.2s;
  }
  &:hover span {
    transform: translateX(3px);
  }
`;

const CDTXT = styled.span`
  ${ActivityCard}:hover & {
    color: #7B298C;
  }
`

function UserActivities() {
  const { user, setUser } = useContext(UserContext);

  const pendingInvitesCount = user?.participant_activities
    ?.filter(invite => !invite.accepted)
    .length || 0;

  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [showActivities, setShowActivities] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const topRef = useRef(null)

  const processedRef = useRef(new Set())

  useEffect(() => {
    if (!user) return
    const now = new Date()

    const allActivities = [
      ...(user.activities || []),
      ...(user.participant_activities
         ?.filter(p => p.accepted)
         .map(p => p.activity) || [])
    ]
    const unique = [...new Map(allActivities.map(a => [a.id, a])).values()]

    unique.forEach(activity => {
      if (
        activity.activity_type === 'Meeting' &&
        activity.finalized &&
        !activity.completed &&
        !processedRef.current.has(activity.id)
      ) {
        const rawTime = activity.date_time?.slice(11, 19)  // "17:00:00"
        if (activity.date_day && rawTime) {
          const [Y, M, D] = activity.date_day.split('-').map(Number)
          const [h, m, s] = rawTime.split(':').map(Number)
          const eventDate = new Date(Y, M-1, D, h, m, s)

          if (eventDate < now) {
            fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}/mark_complete`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            })
              .then(res => {
                if (!res.ok) throw new Error('mark_complete failed')
                return res.json()
              })
              .then(updatedAct => {
                setUser(prev => {
                  if (!prev) return prev
                  const newActs = prev.activities.map(a =>
                    a.id === updatedAct.id ? updatedAct : a
                  )
                  const newPart = prev.participant_activities.map(p =>
                    p.activity.id === updatedAct.id
                      ? { ...p, activity: updatedAct }
                      : p
                  )
                  return { ...prev, activities: newActs, participant_activities: newPart }
                })
              })
              .catch(console.error)
            processedRef.current.add(activity.id)
          }
        }
      }
    })
  }, [user, setUser])

  const handleActivityClick = (activity) => {
    setSelectedActivityId(activity.id);
  };

  const handleBack = () => {
    setSelectedActivityId(null);
    setShowActivities(false)
  };

  const toggleHelp = () => setHelpVisible(v => !v);

  const allActivities = [
    ...(user?.activities || []),
    ...(user?.participant_activities
      ?.filter(activity => activity.accepted)
      .map(p => p.activity) || [])
  ];
  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];

  const inProgressCount = uniqueActivities.filter(a => a.finalized === false).length;
  const finalizedCount = uniqueActivities.filter(a => a.finalized === true).length;

  const [filterType, setFilterType] = useState(() => {
    if (pendingInvitesCount > 0) return "invites";
    if (inProgressCount > 0) return "inprogress";
    if (finalizedCount > 0) return "finalized";
    return "past";
  });

  const filteredActivities = uniqueActivities
    .filter(activity => {
      switch (filterType) {
        case "inprogress":
          return activity.finalized === false && activity.completed === false;
        case "finalized":
          return activity.finalized === true && activity.completed === false;
        case "past":
          return activity.completed;
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(a.date_day) - new Date(b.date_day));

  function getOrdinalSuffix(day) {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "TBD";
    const [year, month, day] = dateString.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const monthName = d.toLocaleString("en-US", { month: "long" });
    const dayNum = d.getDate();
    return `${monthName} ${dayNum}${getOrdinalSuffix(dayNum)}`;
  }

  function formatTime(timeString) {
    if (!timeString) return "TBD";
    const timePortion = timeString.split("T")[1];
    const [rawHour, rawMin] = timePortion.split(":");
    let hour = parseInt(rawHour, 10);
    const suffix = hour >= 12 ? "pm" : "am";
    hour = hour % 12 || 12;            // convert 0→12, 13→1, etc.
    return `${hour}:${rawMin} ${suffix}`;
  }

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
                    <strong>Vote on Recommendations</strong>
                    <p>Pin your favorite recommendations to save them to the board. Participants can view and vote on pinned activities to help the group decide.</p>
                  </li>
                </PopupList>
              </HelpPopup>
            </HelpOverlay>
          )}
          <FilterRow>
            <FilterButton
              $active={filterType === "finalized"}
              onClick={() => setFilterType("finalized")}
            >
              Finalized
            </FilterButton>

            <FilterButton
              $active={filterType === "inprogress"}
              onClick={() => setFilterType("inprogress")}
            >
              In Progress
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
            <PendingInvites handleActivityClick={handleActivityClick} />
          ) : filteredActivities.length > 0 ? (
            <CardGrid>
              {filteredActivities.map(activity => {
                const selectedPin = activity.pinned_activities?.find(p => p.selected);

                const isFinalizedMeeting =
                  activity.activity_type === 'Meeting' && activity.finalized === true;

                const rawTime = activity.date_time
                  ? activity.date_time.slice(11, 19)   // e.g. "17:00:00"
                  : null;

                // 2. split date_day and rawTime into numeric parts
                let eventDateTime = null;
                if (activity.date_day && rawTime) {
                  const [year, month, day] = activity.date_day.split('-').map(Number);    // e.g. [2025,5,21]
                  const [hour, minute, second] = rawTime.split(':').map(Number);          // e.g. [17,0,0]

                  // monthIndex is zero‑based in JS Date
                  eventDateTime = new Date(year, month - 1, day, hour, minute, second);
                }
                let bgUrl;
                if (selectedPin && selectedPin.photos?.length > 0) {
                  const { photo_reference } = selectedPin.photos[0];
                  bgUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`;
                } else {
                  bgUrl = activity.activity_type.toLowerCase() === 'meeting'
                    ? LetsMeetCardThree
                    : groupmeals;
                }

                return (
                  <ActivityCard
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                  >
                    {isFinalizedMeeting && eventDateTime ? (
                      <CountdownContainer>
                        <Countdown
                          date={eventDateTime}
                          renderer={({ days, hours, minutes, seconds, completed }) => {
                            if (completed) {
                              return <span>00:00:00</span>;
                            }
                            const pad = num => String(num).padStart(2, '0');
                            return (
                              <CDTXT>
                                {pad(hours + days * 24)}:{pad(minutes)}:{pad(seconds)}
                              </CDTXT>
                            );
                          }}
                        />
                      </CountdownContainer>
                    ) : (
                      <ImageContainer $bgimage={bgUrl} />
                    )}

                    <HostTag>
                      <User size={14} style={{ paddingBottom: '2px' }} />{' '}
                      {activity.user?.name}
                    </HostTag>

                    <TypeTag>
                      {activity.emoji} {activity.activity_type}
                    </TypeTag>

                    <CardLabel>
                      <div className='meta'>
                        <span><h3>{activity.activity_name}</h3></span>
                        <span style={{ marginTop: '1rem', fontSize: '16px' }}>
                          {activity.participants.length + 1}<Users style={{ paddingBottom: '3px' }} size={18} />
                        </span>
                      </div>
                      <div className="meta">
                        <span>
                          <CalendarDays style={{ paddingBottom: '2px' }} size={20} />{formatDate(activity.date_day) || 'TBD'} · <Clock style={{ paddingBottom: '2px' }} size={21} />{formatTime(activity.date_time) || 'TBD'}
                        </span>
                        <span><ViewBoard>View board <span>→</span></ViewBoard></span>
                      </div>

                    </CardLabel>
                  </ActivityCard>
                );
              })}
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