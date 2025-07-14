import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import Countdown from 'react-countdown';
import { UserContext } from '../context/user';
// Remove TripDashboard import since it's now its own route
import YourCommunity from './YourCommunity.js';
import NoBoardsDisplay from './NoBoardsDisplay.js';
import { HelpCircle, X, User, Users, CalendarDays, Clock } from 'lucide-react';
import LetsEat from '../assets/LetsEat.png';
import LetsMeet from '../assets/LetsMeet.png';
import LetsDrink from '../assets/LetsDrink.png';
import VoxxyFooter from '../components/VoxxyFooter.js'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const progressFill = keyframes`
  0%   { width: 0%; box-shadow: 0 0 0 rgba(207,56,221,0); }
  50%  { box-shadow: 0 0 20px rgba(207,56,221,0.8); }
  100% { width: var(--progress-width); box-shadow: 0 0 25px rgba(207,56,221,1); }
`;

const progressShine = keyframes`
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const progressPulse = keyframes`
  0%,100% { opacity: 0.9; box-shadow: 0 0 20px rgba(207,56,221,0.6); }
  50%     { opacity: 1;   box-shadow: 0 0 30px rgba(207,56,221,1); }
`;

const gentlePulse = keyframes`
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.02); }
`;

const subtleGlow = keyframes`
  0%,100% { box-shadow: 0 0 15px rgba(207,56,221,0.4); }
  50%     { box-shadow: 0 0 20px rgba(207,56,221,0.6); }
`;

const HeroContainer = styled.div`
  width: 100%; box-sizing: border-box;
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 2rem 1rem; background-color: #201925; position: relative; text-align: left;
  @media (max-width: 768px) {
    padding: 0.5rem; flex-direction: column; align-items: flex-start;
  }
`;

const ProgressOverlay = styled.div`
  position: absolute; top: 3rem; right: 0; bottom: 30%; left: 0;
  background: linear-gradient(135deg, rgba(32,25,37,0.95), rgba(64,51,71,0.95), rgba(42,30,46,0.95));
  backdrop-filter: blur(12px); border: 1px solid rgba(207,56,221,0.3);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 1rem; color: #f4f0f5;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px rgba(207,56,221,0.2);
`;

const ProgressHeader = styled.div`
  text-align: center; margin-bottom: 1rem;
`;

const ProgressStage = styled.div`
  font-size: 0.8rem; font-weight: 600; color: #d394f5;
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
`;

const ProgressBarContainer = styled.div`
  width: 85%; height: 16px; background: rgba(64,51,71,0.8);
  border-radius: 8px; overflow: hidden; margin-bottom: 1rem;
  border: 2px solid rgba(207,56,221,0.5); position: relative;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 15px rgba(207,56,221,0.4);
`;

const ProgressBar = styled.div`
  height: 100%; background: linear-gradient(90deg,#cf38dd,#d394f5,#b954ec);
  border-radius: 6px; position: relative; transition: width 0.8s ease;
  animation: ${progressFill} 2s ease-out; --progress-width: ${p => p.$progress}%;
  width: ${p => p.$progress}%; box-shadow: 0 0 15px rgba(207,56,221,0.8);
  overflow: hidden;
  &::after {
    content: ''; position: absolute; top:0; left:0; width:100%; height:100%;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);
    animation: ${progressShine} 2s ease-in-out 1; animation-delay:0.5s;
  }
  ${p => p.$isActive && css`
    animation: ${progressFill} 2s ease-out, ${progressPulse} 3s ease-in-out infinite 2s;
    &::after { animation: ${progressShine} 3s ease-in-out infinite 2s; }
  `}
`;

const ProgressSubtitle = styled.div`
  font-size: 0.85rem; color: #d8cce2; text-align: center; margin-top: 0.5rem;
  font-weight: 500; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); line-height:1.3;
`;

const CountdownContainer = styled.div`
  position: absolute; top: 3rem; right: 0; bottom: 30%; left: 0;
  background: linear-gradient(135deg, rgba(32,25,37,0.95), rgba(64,51,71,0.95), rgba(42,30,46,0.95));
  backdrop-filter: blur(12px); border: 1px solid rgba(207,56,221,0.3);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: 'Montserrat', monospace; font-size: 2rem; font-weight:700; color:#f4f0f5;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px rgba(207,56,221,0.2);
  @media (max-width: 768px) { font-size:1.6rem; }
`;

const CountdownHeader = styled.div`
  display:flex; flex-direction:column; align-items:center; margin-bottom:1rem;
`;

const CountdownTitle = styled.div`
  font-size:0.75rem; font-weight:600; color:#d394f5; letter-spacing:0.5px;
  text-transform:uppercase; text-shadow:2px 2px 4px rgba(0,0,0,0.8);
  font-family:'Montserrat',sans-serif; text-align:center;
`;

const TextContainer = styled.div`
  display:flex; flex-direction:column; padding-right:50px;
`;

const HeroTitle = styled.h2`
  font-family:'Montserrat',sans-serif;
  font-size:clamp(1.8rem,4vw,2.5rem); font-weight:bold; color:#fff; margin:0 auto;
`;

const HeroSubtitle = styled.p`
  font-family:'Inter',sans-serif;
  font-size:clamp(1rem,2.5vw,1.25rem); color:#fff; margin:0.5rem 0 0;
`;

const HelpIcon = styled.div`
  position:absolute; top:1.5rem; right:1rem; display:flex; align-items:center;
  cursor:pointer; color:#fff;
  &:hover { opacity:0.8; }
`;

const HelpOverlay = styled.div`
  position:fixed; top:0; left:0; width:100%; height:100%; z-index:1000;
`;

const HelpPopup = styled.div`
  position:fixed; top:5rem; right:1rem; width:300px; padding:1rem;
  background-color:#2C1E33; border-radius:8px; box-shadow:0 2px 4px #8e44ad; z-index:1001;
  @media(max-width:600px){ right:0.5rem; width:260px; }
`;

const PopupHeader = styled.div`
  display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color:#fff;
`;

const PopupTitle = styled.h4`
  margin:0; font-size:1rem; font-weight:bold; color:#fff;
`;

const CloseButton = styled.button`
  background:transparent; border:none; cursor:pointer; padding:0; color:#fff;
`;

const PopupList = styled.ol`
  margin:0; padding-left:1.2rem; text-align:left; color:#fff;
  li { margin-bottom:0.75rem;
    strong { display:block; font-size:0.95rem; margin-bottom:0.25rem; }
    p { margin:0; font-size:0.9rem; line-height:1.3; }
  }
`;

const DashboardContainer = styled.div`
  display:flex; flex-direction:column; padding:2rem; gap:.5px;
  max-width:1200px; margin:0 auto 1rem; animation:${fadeIn} 0.8s ease-in-out;
  @media(max-width:768px){ padding:1rem; }
`;

export const Button = styled.button`
  padding:0.5rem 1rem; background:linear-gradient(135deg,#cf38dd,#d394f5,#b954ec);
  color:#fff; border:none; border-radius:6px; cursor:pointer;
  font-size:1rem; font-weight:bold; transition:all 0.3s ease-in-out;
  box-shadow:0 4px 16px rgba(207,56,221,0.3);
  &:hover{
    background:linear-gradient(135deg,#bf2aca,#be7fdd,#a744d7);
    box-shadow:0 6px 20px rgba(207,56,221,0.5);
    transform:translateY(-2px);
  }
  @media(max-width:768px){ font-size:0.9rem; padding:0.4rem 0.8rem; }
`;

const Padding = styled.div`
  padding:80px 0 50px; background-color:#201925;
`;

const FilterRow = styled.div`
  display:flex; margin:0 -1rem; gap:1rem; padding:1rem; overflow-x:auto;
  scrollbar-width:none; -ms-overflow-style:none;
  &::-webkit-scrollbar{ display:none; }
`;

const FilterButton = styled.button`
  flex-shrink:0; padding:0.6rem 1.2rem;
  background:${p => p.$active
    ? 'linear-gradient(135deg,#cf38dd,#d394f5,#b954ec)'
    : 'rgba(255,255,255,0.1)'};
  color:#fff; border:${p => p.$active
    ? '2px solid rgba(207,56,221,0.8)' : 'none'};
  border-radius:999px; font-weight:600; cursor:pointer; transition:all 0.2s ease;
  box-shadow:${p => p.$active
    ? '0 4px 16px rgba(207,56,221,0.4)'
    : 'rgba(0,0,0,0.25) 0px 54px 55px,rgba(0,0,0,0.12) 0px -12px 30px,…'};
  &:hover{
    background:${p => p.$active
    ? 'linear-gradient(135deg,#bf2aca,#be7fdd,#a744d7)'
    : 'rgba(207,56,221,0.2)'};
    transform:translateY(-1px);
  }
`;

const NewBoardButton = styled.button`
  flex-shrink:0; padding:0.6rem 1.2rem;
  background:linear-gradient(135deg,#cf38dd,#d394f5);
  color:#fff; border:2px solid rgba(207,56,221,0.6);
  border-radius:999px; font-weight:600; cursor:pointer; transition:all 0.2s ease;
  box-shadow:0 4px 16px rgba(207,56,221,0.3);
  &:hover{
    background:linear-gradient(135deg,#bf2aca,#be7fdd);
    border-color:rgba(207,56,221,1);
    box-shadow:0 6px 20px rgba(207,56,221,0.5);
    transform:translateY(-1px);
  }
`;

const CardGrid = styled.div`
  width:100%; display:grid;
  grid-template-columns:repeat(auto-fit,minmax(240px,320px));
  gap:1rem; margin:0 auto; padding:1rem;
  @media(max-width:768px){
    grid-template-columns:1fr; padding:1rem 0;
  }
`;

export const ActivityCard = styled.div`
  position:relative; width:100%; padding-bottom:100%; margin:0 auto;
  border-radius:16px; overflow:hidden; cursor:pointer; border:2px solid rgba(207,56,221,0.4);
  background:linear-gradient(135deg,rgba(42,30,46,0.8),rgba(64,51,71,0.8));
  backdrop-filter:blur(8px); box-shadow:0 4px 16px rgba(207,56,221,0.2);
  transition:all 0.3s ease;
  &:hover{
    transform:translateY(-4px);
    border-color:rgba(207,56,221,0.8);
    box-shadow:0 8px 24px rgba(207,56,221,0.4);
    animation:${subtleGlow} 2s ease-in-out;
  }
  ${p => p.$isInvite && css`
    border:3px solid rgba(211,148,245,0.8);
    animation:${gentlePulse} 3s ease-in-out infinite;
    &:hover{
      border-color:rgba(185,84,236,1);
      animation:${subtleGlow} 1.5s ease-in-out infinite;
    }
  `}
`;

export const ImageContainer = styled.div`
  position:absolute; top:0; right:0; bottom:0; left:0;
  background-image:${p => `url("${p.$bgimage}")`};
  background-size:cover; background-position:center; transition:transform 0.5s ease;
  &::before{
    content:''; position:absolute; top:0; right:0; bottom:0; left:0;
    background:linear-gradient(135deg,rgba(207,56,221,0.1),rgba(211,148,245,0.1),rgba(185,84,236,0.1));
  }
  ${p => p.$isInvite && css`
    filter:brightness(1.2) saturate(1.3);
    &::before{
      background:linear-gradient(135deg,rgba(207,56,221,0.2),rgba(211,148,245,0.2),rgba(185,84,236,0.2));
    }
  `}
  ${ActivityCard}:hover & { transform:scale(1.1); }
`;

export const CardLabel = styled.div`
  position:absolute; bottom:0; width:100%; height:30%;
  background:linear-gradient(135deg,rgba(207,56,221,0.9),rgba(211,148,245,0.9),rgba(185,84,236,0.9));
  backdrop-filter:blur(12px); color:#f4f0f5; display:flex;
  flex-direction:column; justify-content:center; padding:0.75rem 1rem;
  border-top:2px solid rgba(244,240,245,0.3);
  ${p => p.$isInvite && css`
    background:linear-gradient(135deg,rgba(207,56,221,1),rgba(211,148,245,1),rgba(185,84,236,1));
    border-top-color:rgba(244,240,245,0.5);
  `}
  h3{
    margin:0; margin-top:1rem; font-size:1.3rem; font-weight:700;
    text-shadow:2px 2px 4px rgba(0,0,0,0.5); color:#f4f0f5;
  }
  .meta{
    font-size:0.8rem; margin-bottom:.5rem; display:flex;
    justify-content:space-between; text-shadow:1px 1px 2px rgba(0,0,0,0.4);
  }
`;

export const TypeTag = styled.div`
  position:absolute; top:0.5rem; right:0.5rem;
  background:linear-gradient(135deg,#cf38dd,#b954ec);
  padding:0.3rem 0.7rem; border-radius:999px; border:2px solid #f4f0f5;
  font-size:0.75rem; font-weight:700; color:#f4f0f5; text-transform:uppercase;
  box-shadow:0 0 12px rgba(207,56,221,0.5); text-shadow:1px 1px 2px rgba(0,0,0,0.5);
  ${p => p.$isInvite && css`
    background:linear-gradient(135deg,#d394f5,#cf38dd);
    box-shadow:0 0 18px rgba(211,148,245,0.7);
    border-color:#ffffff;
  `}
`;

export const HostTag = styled.div`
  position:absolute; top:0.5rem; left:0.5rem;
  background:linear-gradient(135deg,#b954ec,#cf38dd);
  padding:0.3rem 0.7rem; border-radius:999px; border:2px solid #f4f0f5;
  font-size:0.75rem; font-weight:700; color:#f4f0f5; text-transform:uppercase;
  box-shadow:0 0 12px rgba(185,84,236,0.5); text-shadow:1px 1px 2px rgba(0,0,0,0.5);
  ${p => p.$isInvite && css`
    background:linear-gradient(135deg,#d394f5,#b954ec);
    box-shadow:0 0 18px rgba(211,148,245,0.7);
    border-color:#ffffff;
  `}
`;

const InviteTag = styled.div`
  position:absolute; top:3rem; left:0.5rem;
  background:linear-gradient(135deg,#cf38dd,#d394f5,#b954ec);
  padding:0.4rem 0.8rem; border-radius:999px; border:3px solid #fff;
  font-size:0.75rem; font-weight:700; color:#f4f0f5; text-transform:uppercase;
  box-shadow:0 0 15px rgba(207,56,221,0.6); text-shadow:2px 2px 4px rgba(0,0,0,0.7);
  animation:${gentlePulse} 4s ease-in-out infinite;
`;

const ViewBoard = styled.div`
  font-size:0.85rem; font-weight:700; display:flex; align-items:center;
  cursor:pointer; color:#f4f0f5; text-shadow:1px 1px 2px rgba(0,0,0,0.5);
  &:hover{ color:rgba(244,240,245,0.8); transform:translateX(2px); }
  span{ margin-left:0.25rem; transition:transform 0.2s; }
  &:hover span{ transform:translateX(3px); }
`;

const CountdownText = styled.span`
  font-size:2.5rem; font-weight:800; letter-spacing:2px;
  background-image:linear-gradient(to right,rgba(207,56,221,0.9),rgba(211,148,245,0.9),rgba(185,84,236,0.9));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  text-shadow:2px 2px 8px rgba(0,0,0,0.2);
`;

const NoBoardsContainer = styled.div`
  border-radius:1rem; max-width:450px; padding-left:0.5rem;
  animation:${fadeIn} 0.8s ease-out;
`;

const Message = styled.p`
  font-family:'Inter',sans-serif;
  font-size:clamp(1rem,2.5vw,1.25rem);
  color:#fff; margin:0.5rem 0.5rem 0; text-align:left;
`;

const getActivityTypeConfig = (activityType) => {
  switch (activityType) {
    case 'Restaurant':
      return { tagText: 'Lets Eat!', fallbackImage: LetsEat };
    case 'Cocktails':
      return { tagText: 'Night Out!', fallbackImage: LetsDrink };
    case 'Meeting':
      return { tagText: 'Lets Meet!', fallbackImage: LetsMeet };
    case 'Game Night':
      return { tagText: 'Game Night!', fallbackImage: LetsMeet };
    default:
      return { tagText: 'Lets Go!', fallbackImage: LetsEat };
  }
};

const getActivityBackgroundImage = (activity) => {
  const selectedPin = activity.pinned_activities?.find(p => p.selected);
  if (selectedPin && selectedPin.photos?.length > 0) {
    const { photo_reference } = selectedPin.photos[0];
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`;
  }
  return getActivityTypeConfig(activity.activity_type).fallbackImage;
};

function UserActivities() {
  const { user, setUser } = useContext(UserContext);
  // Remove showActivities state since we're using routing now
  const [helpVisible, setHelpVisible] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const topRef = useRef(null);
  const processedRef = useRef(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const allActivities = [
      ...(user.activities || []),
      ...(user.participant_activities
        ?.filter(p => p.accepted)
        .map(p => p.activity) || [])
    ];
    const unique = [...new Map(allActivities.map(a => [a.id, a])).values()];

    unique.forEach(activity => {
      if (
        activity.activity_type === 'Meeting' &&
        activity.finalized &&
        !activity.completed &&
        !processedRef.current.has(activity.id)
      ) {
        const rawTime = activity.date_time?.slice(11, 19);
        if (activity.date_day && rawTime) {
          const [Y, M, D] = activity.date_day.split('-').map(Number);
          const [h, m, s] = rawTime.split(':').map(Number);
          const eventDate = new Date(Y, M - 1, D, h, m, s);

          if (eventDate < now) {
            fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}/mark_complete`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            })
              .then(res => {
                if (!res.ok) throw new Error('mark_complete failed');
                return res.json();
              })
              .then(updatedAct => {
                setUser(prev => {
                  if (!prev) return prev;
                  const newActs = prev.activities.map(a =>
                    a.id === updatedAct.id ? updatedAct : a
                  );
                  const newPart = prev.participant_activities.map(p =>
                    p.activity.id === updatedAct.id
                      ? { ...p, activity: updatedAct }
                      : p
                  );
                  return { ...prev, activities: newActs, participant_activities: newPart };
                });
              })
              .catch(console.error);
            processedRef.current.add(activity.id);
          }
        }
      }
    });
  }, [user, setUser]);

  const handleActivityClick = (activity) => {
    navigate(`/activity/${activity.id}`);
  };
  const toggleHelp = () => setHelpVisible(v => !v);

  const allActivities = [
    ...(user?.activities || []),
    ...(user?.participant_activities
      ?.filter(p => p.accepted)
      .map(p => p.activity) || [])
  ];
  const pendingInvitesCount = user?.participant_activities
    ?.filter(invite => !invite.accepted)
    .length || 0;
  const pendingInviteActivities = user?.participant_activities
    ?.filter(invite => !invite.accepted)
    .map(invite => invite.activity) || [];
  const uniqueActivities = [...new Map(allActivities.map(a => [a.id, a])).values()];

  const inProgressCount = uniqueActivities.filter(a => !a.finalized && !a.completed).length;
  const finalizedCount = uniqueActivities.filter(a => a.finalized).length;

  const [filterType, setFilterType] = useState(() => {
    if (pendingInvitesCount > 0) return "invites";
    if (inProgressCount > 0) return "inprogress";
    if (finalizedCount > 0) return "finalized";
    return "past";
  });

  useEffect(() => {
    setShowAllPast(false);
  }, [filterType]);

  const filteredActivities = (() => {
    if (filterType === "invites") return pendingInviteActivities;
    return uniqueActivities
      .filter(a => {
        switch (filterType) {
          case "inprogress": return !a.finalized && !a.completed;
          case "finalized": return a.finalized && !a.completed;
          case "past": return a.completed;
          default: return true;
        }
      })
      .sort((a, b) => new Date(a.date_day) - new Date(b.date_day));
  })();

  const pastActivities = uniqueActivities
    .filter(a => a.completed)
    .sort((a, b) => new Date(b.date_day) - new Date(a.date_day));

  const activitiesToRender =
    filterType === "past"
      ? (showAllPast ? pastActivities : pastActivities.slice(0, 3))
      : filteredActivities;

  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    const [year, month, day] = dateString.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const monthName = d.toLocaleString("en-US", { month: "long" });
    const dayNum = d.getDate();
    return `${monthName} ${dayNum}${getOrdinalSuffix(dayNum)}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "TBD";
    const timePortion = timeString.split("T")[1];
    const [rawHour, rawMin] = timePortion.split(":");
    let hour = parseInt(rawHour, 10);
    const suffix = hour >= 12 ? "pm" : "am";
    hour = hour % 12 || 12;
    return `${hour}:${rawMin} ${suffix}`;
  };

  const getProgressData = (activity) => {
    const pins = activity.pinned_activities || [];
    const ideas = pins.length;
    const hasSelectedPin = pins.some(p => p.selected);
    const hasDateTime = activity.date_day && activity.date_time;

    let stage = 'collecting',
      stageDisplay = 'Collecting Ideas',
      subtitle = 'Gathering the group\'s preferences',
      progress = 33;

    if (hasSelectedPin && hasDateTime) {
      stage = 'finalized';
      stageDisplay = activity.activity_type === 'Meeting' ? 'Ready to Meet' : 'Ready to Go';
      subtitle = 'All set for your activity!';
      progress = 100;
    } else if (ideas > 0) {
      stage = 'voting';
      stageDisplay = 'Voting Phase';
      subtitle = 'Vote on your recommendations';
      progress = 67;
    }

    return { stage, stageDisplay, subtitle, progress };
  };

  const isPendingInvite = (activity) =>
    pendingInviteActivities.some(inv => inv.id === activity.id);

  // Remove the conditional TripDashboard rendering - it's now handled by routing

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
                    <strong>✨ Create a New Board</strong>
                    <p>Kick things off by clicking "Create Board" to start planning your next adventure.</p>
                  </li>
                  <li>
                    <strong>📩 Accept Invitations</strong>
                    <p>See a board you've been invited to? Join in and start collaborating with your crew.</p>
                  </li>
                  <li>
                    <strong>🕰 Revisit Past Boards</strong>
                    <p>Scroll through your finalized activities to relive the moments or get inspo for what's next.</p>
                  </li>
                  <li>
                    <strong>🎭 Meet Your Voxxy Crew</strong>
                    <p>Tap into your community! The "Voxxy Crew" section shows everyone you've planned with before.</p>
                  </li>
                  <li>
                    <strong>⚙️ Edit Your Profile & Get Help</strong>
                    <p>Need to update your info or ask a question? Use the top-right nav bar to visit your profile or the Help Center.</p>
                  </li>
                </PopupList>
              </HelpPopup>
            </HelpOverlay>
          )}

          <FilterRow>
            {/* Update the navigation to use the new route */}
            <NewBoardButton onClick={() => navigate('/create-trip')}>+ New</NewBoardButton>
            <FilterButton $active={filterType === "inprogress"} onClick={() => setFilterType("inprogress")}>In Progress</FilterButton>
            <FilterButton $active={filterType === "finalized"} onClick={() => setFilterType("finalized")}>Finalized</FilterButton>
            <FilterButton $active={filterType === "past"} onClick={() => setFilterType("past")}>Past</FilterButton>
            <FilterButton $active={filterType === "invites"} onClick={() => setFilterType("invites")}>
              Invites {pendingInvitesCount > 0 ? `(${pendingInvitesCount})` : ''}
            </FilterButton>
          </FilterRow>

          {filteredActivities.length > 0 ? (
            <>
              <CardGrid>
                {activitiesToRender.map(activity => {
                  const isInvite = isPendingInvite(activity);
                  const isInProgress = !activity.finalized && !activity.completed && !isInvite;
                  const progressData = isInProgress ? getProgressData(activity) : null;

                  let eventDateTime = null;
                  if (activity.date_day && activity.date_time) {
                    const [Y, M, D] = activity.date_day.split('-').map(Number);
                    const [h, m, s] = activity.date_time.slice(11, 19).split(':').map(Number);
                    eventDateTime = new Date(Y, M - 1, D, h, m, s);
                  }

                  const isFinalized = activity.finalized === true && !activity.completed;
                  const bgUrl = getActivityBackgroundImage(activity);
                  const typeConfig = getActivityTypeConfig(activity.activity_type);

                  return (
                    <ActivityCard key={activity.id} onClick={() => handleActivityClick(activity)} $isInvite={isInvite}>
                      {isFinalized && eventDateTime && !isInvite ? (
                        <CountdownContainer>
                          <CountdownHeader>
                            <CountdownTitle>
                              {activity.activity_type} Starts In
                            </CountdownTitle>
                          </CountdownHeader>
                          <Countdown
                            date={eventDateTime}
                            renderer={({ days, hours, minutes, seconds, completed }) => {
                              if (completed) {
                                return <CountdownText>STARTED</CountdownText>;
                              }
                              const pad = n => String(n).padStart(2, '0');
                              return (
                                <CountdownText>
                                  {days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}
                                </CountdownText>
                              );
                            }}
                          />
                        </CountdownContainer>
                      ) : isInProgress && progressData ? (
                        <ProgressOverlay>
                          <ProgressHeader>
                            <ProgressStage>{progressData.stageDisplay}</ProgressStage>
                            <ProgressSubtitle>{progressData.subtitle}</ProgressSubtitle>
                          </ProgressHeader>
                          <ProgressBarContainer>
                            <ProgressBar $progress={progressData.progress} $isActive={progressData.progress < 100} />
                          </ProgressBarContainer>
                        </ProgressOverlay>
                      ) : (
                        <ImageContainer $bgimage={bgUrl} $isInvite={isInvite} />
                      )}

                      <HostTag $isInvite={isInvite}>
                        <User size={14} /> {activity.user?.name}
                      </HostTag>

                      {isInvite && <InviteTag>🎉 PENDING INVITE 🎉</InviteTag>}

                      <TypeTag $isInvite={isInvite}>
                        {activity.emoji} {typeConfig.tagText}
                      </TypeTag>

                      <CardLabel $isInvite={isInvite}>
                        <div className="meta">
                          <h3>{activity.activity_name}</h3>
                          <span>{activity.participants.length + 1}<Users size={18} /></span>
                        </div>
                        <div className="meta">
                          <span>
                            <CalendarDays size={20} /> {formatDate(activity.date_day)} · <Clock size={21} /> {formatTime(activity.date_time)}
                          </span>
                          <ViewBoard $isInvite={isInvite}>
                            {isInvite ? 'View invite' : isInProgress ? 'Continue planning' : 'View board'} <span>→</span>
                          </ViewBoard>
                        </div>
                      </CardLabel>
                    </ActivityCard>
                  );
                })}
              </CardGrid>
              {filterType === "past" && pastActivities.length > 3 && (
                <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                  <Button onClick={() => setShowAllPast(sa => !sa)}>
                    {showAllPast ? "Show Less" : "Display All"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            filterType === "invites" ? (
              <NoBoardsContainer>
                <Message>No pending invites!</Message>
              </NoBoardsContainer>
            ) : (
              <NoBoardsDisplay onCreateBoard={() => navigate('/create-trip')} />
            )
          )}

          {/* Update YourCommunity to use the new route as well */}
          <YourCommunity onCreateBoard={() => navigate('/create-trip')} />
        </DashboardContainer>
      </Padding>
      <VoxxyFooter />
    </>
  );
}

export default UserActivities;