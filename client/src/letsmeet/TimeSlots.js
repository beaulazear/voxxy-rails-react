import React, { useState, useContext, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { format, parseISO } from 'date-fns';
import { Users, Share, Clock, Trash, CheckCircle, Flag, Cog, Calendar, X, UserCheck, Brain, Star, TrendingUp } from 'lucide-react';
import LetsMeetScheduler from './LetsMeetScheduler';
import LoadingScreenUser from "../admincomponents/LoadingScreenUser";
import { UserContext } from "../context/user";

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
`;

const fadeInNoTransform = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulse = keyframes`
  0%, 100% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.05); }
`;

const Container = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: #fff;
  animation: ${fadeInNoTransform} 0.8s ease-in-out,
             ${gradientAnimation} 15s ease infinite;
`;

const TopBar = styled.div`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  display: flex;
`;

const Heading = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  margin: 0 auto;
  text-align: center;
`;

const PhaseIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }
`;

const PhaseIcon = styled.div`
  color: #cc31e8;
`;

const PhaseContent = styled.div`
  flex: 1;
  text-align: left;
`;

const PhaseTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const PhaseSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #ccc;
`;

const ProgressBarContainer = styled.div`
  background: #333;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: #cc31e8;
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const PreferencesCard = styled.div`
  background: linear-gradient(135deg, #9051e1 0%, #cc31e8 100%);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const PreferencesIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const PreferencesTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
`;

const PreferencesText = styled.p`
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
  line-height: 1.5;
`;

const PreferencesButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 auto;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

const SubmittedCard = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const SubmittedIcon = styled.div`
  color: #28a745;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const SubmittedTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  color: #28a745;
`;

const SubmittedText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #ccc;
  line-height: 1.5;
  text-align: left;
`;

const ResubmitButton = styled.button`
  background: transparent;
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 auto;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(40, 167, 69, 0.1);
    transform: translateY(-1px);
  }
`;

const OrganizerSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const OrganizerTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
`;

const ParticipantsList = styled.div`
  margin-bottom: 1.5rem;
`;

const ParticipantItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParticipantName = styled.span`
  font-size: 0.9rem;
`;

const ParticipantStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${({ $submitted }) => $submitted ? '#28a745' : '#ffc107'};
`;

const FullWidthButton = styled.button`
  width: 100%;
  background: ${({ $primary }) => ($primary ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'transparent')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid rgba(204, 49, 232, 0.3)')};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    ${({ $primary }) =>
    $primary
      ? `background: linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(204, 49, 232, 0.3);`
      : `background: rgba(204, 49, 232, 0.1); color: #cc31e8; transform: translateY(-1px);`}
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  color: #d9534f;
  text-align: center;
  font-style: italic;
  margin-bottom: 1rem;
`;

// AI Recommendations Styles
const AISection = styled.div`
  background: linear-gradient(135deg, rgba(204, 49, 232, 0.1) 0%, rgba(144, 81, 225, 0.1) 100%);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const AITitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: #cc31e8;
  font-family: 'Montserrat', sans-serif;
  text-align: left;
`;

const RecommendationCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  text-align: left;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(204, 49, 232, 0.3);
    transform: translateY(-1px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RecommendationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const RecommendationTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  flex: 1;
`;

const ParticipantCount = styled.div`
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid rgba(40, 167, 69, 0.3);
`;

const RecommendationReason = styled.p`
  margin: 0 0 1.25rem 0;
  font-size: 0.9rem;
  color: #ccc;
  line-height: 1.5;
  text-align: left;
`;

const ProsCons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-top: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ProsConsSection = styled.div`
  text-align: left;
`;

const ProsConsTitle = styled.h5`
  margin: 0 0 0.75rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $type }) => $type === 'pros' ? '#28a745' : '#ffc107'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
`;

const ProsConsList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.85rem;
  color: #ccc;
  line-height: 1.4;
`;

const ProsConsItem = styled.li`
  margin-bottom: 0.5rem;
  text-align: left;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TimeSlotsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const TimeSlotCard = styled.div`
  background: ${({ $selected, $recommended }) =>
    $selected ? 'rgba(40, 167, 69, 0.2)' :
      $recommended ? 'rgba(204, 49, 232, 0.15)' :
        'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected, $recommended }) =>
    $selected ? '1px solid #28a745' :
      $recommended ? '1px solid #cc31e8' :
        '1px solid rgba(255, 255, 255, 0.1)'};
  padding: 1rem;
  border-radius: 0.75rem;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $selected, $recommended }) =>
    $selected ? 'rgba(40, 167, 69, 0.3)' :
      $recommended ? 'rgba(204, 49, 232, 0.2)' :
        'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #28a745;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  color: #fff;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 8px rgba(204, 49, 232, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 2;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const TimeSlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  padding-right: ${({ $hasRecommendation }) => $hasRecommendation ? '6rem' : '0'};
  position: relative;
`;

const TimeSlotDate = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: #fff;
`;

const TimeSlotTime = styled.div`
  font-size: 0.9rem;
  color: #ccc;
  margin-top: 0.25rem;
`;

const TimeSlotActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TimeSlotStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
`;

const StatLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #ccc;
`;

const StatValue = styled.div`
  color: ${({ $type }) =>
    $type === 'availability' ? '#28a745' : '#fff'};
  font-weight: 500;
`;

const AvailabilityCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #28a745;
  font-size: 0.875rem;
`;

const DeleteButton = styled.button`
  background: rgba(220, 38, 127, 0.2);
  border: 1px solid rgba(220, 38, 127, 0.3);
  color: #dc267f;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(220, 38, 127, 0.3);
    transform: scale(1.05);
  }
`;

// Modal Styles matching AIRecommendations
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cc31e8;
    border-radius: 2px;
  }
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const ModalTitle = styled.h2`
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
`;

const ModalSubtitle = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem 2rem 2rem;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ModalProgressContainer = styled.div`
  margin: 1rem 0;
`;

const ModalProgressBarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

const ModalProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const ProgressInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ccc;
  font-size: 0.85rem;
`;

const ProgressLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressPercentage = styled.div`
  color: #cc31e8;
  font-weight: 600;
`;

const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  color: #ffc107;
  font-size: 0.85rem;
  margin: 1rem 0;
`;

const Button = styled.button`
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  
  background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
      : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $primary }) => ($primary ? 'white' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid rgba(204, 49, 232, 0.3)')};
  
  &:hover:not(:disabled) { 
    transform: translateY(-1px);
    box-shadow: ${({ $primary }) =>
    $primary
      ? '0 4px 12px rgba(204, 49, 232, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)'};
    background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
      : 'rgba(255, 255, 255, 0.08)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

export default function TimeSlots({ onEdit, currentActivity, pinned, setPinned, toggleVote, handleTimeSlotDelete, isOwner, setCurrentActivity }) {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showMoveToVotingModal, setShowMoveToVotingModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const { id, responses, collecting, voting, finalized, selected_time_slot_id } = currentActivity;

  const totalParticipants = currentActivity.participants.length + 1;
  const availabilityResponses = responses.filter(r => r.notes === "LetsMeetAvailabilityResponse");
  const responseRate = (availabilityResponses.length / totalParticipants) * 100;

  const currentUserResponse = availabilityResponses.find(r =>
    r.user_id === user.id || r.email === user.email
  );

  // Check if we have saved recommendations in the time slots
  const hasExistingRecommendations = pinned.some(slot =>
    slot.recommendation && Object.keys(slot.recommendation).length > 0
  );

  // Auto-load AI recommendations when entering voting phase if they don't exist yet
  React.useEffect(() => {
    if (voting && !collecting && !finalized && !hasExistingRecommendations && !loadingAI && aiRecommendations.length === 0) {
      const fetchAI = async () => {
        setLoadingAI(true);
        try {
          const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
          const aiResponse = await fetch(`${API_URL}/activities/${id}/time_slots/ai_recommendations`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            setAiRecommendations(aiData.recommendations || []);
          }
        } catch (aiError) {
          console.error("Failed to fetch AI recommendations:", aiError);
        } finally {
          setLoadingAI(false);
        }
      };
      fetchAI();
    }
  }, [voting, collecting, finalized, hasExistingRecommendations, loadingAI, aiRecommendations.length, id]);

  const moveToVotingPhase = async () => {
    setLoading(true);
    setError("");

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

      const availabilityMap = {};
      availabilityResponses.forEach(({ availability }) => {
        if (availability.open === true) return;
        Object.entries(availability).forEach(([date, times]) => {
          if (!Array.isArray(times)) return;
          if (!availabilityMap[date]) availabilityMap[date] = {};
          times.forEach(time => {
            availabilityMap[date][time] = (availabilityMap[date][time] || 0) + 1;
          });
        });
      });

      const allSlots = [];
      Object.entries(availabilityMap).forEach(([date, times]) => {
        Object.entries(times).forEach(([time, count]) => {
          allSlots.push({ date, time, count });
        });
      });

      const topSlots = allSlots
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const pinnedPromises = topSlots.map(slot =>
        fetch(`${API_URL}/activities/${id}/time_slots`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: slot.date,
            time: slot.time
          }),
        })
      );

      const pinnedResults = await Promise.all(pinnedPromises);
      const newPinnedSlots = await Promise.all(
        pinnedResults.map(res => res.json())
      );

      const activityUpdateResponse = await fetch(`${API_URL}/activities/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: {
            collecting: false,
            voting: true
          }
        }),
      });

      if (!activityUpdateResponse.ok) {
        throw new Error("Failed to update activity phase");
      }

      setPinned(newPinnedSlots);

      setUser(prev => ({
        ...prev,
        activities: prev.activities.map(act =>
          act.id === id
            ? { ...act, collecting: false, voting: true, finalized: false }
            : act
        ),
        participant_activities: prev.participant_activities.map(part =>
          part.activity.id === id
            ? {
              ...part,
              activity: { ...part.activity, collecting: false, voting: true, finalized: false }
            }
            : part
        )
      }));

      setCurrentActivity(prev => ({
        ...prev,
        collecting: false,
        voting: true,
        finalized: false
      }));

      // Fetch AI recommendations
      setLoadingAI(true);
      try {
        const aiResponse = await fetch(`${API_URL}/activities/${id}/time_slots/ai_recommendations`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          setAiRecommendations(aiData.recommendations || []);
        }
      } catch (aiError) {
        console.error("Failed to fetch AI recommendations:", aiError);
      } finally {
        setLoadingAI(false);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowMoveToVotingModal(false);
    }
  };

  const finalizeActivity = async () => {
    setShowFinalizeModal(false);
  };

  const handleAvailabilityUpdate = (newResponse, newComment) => {
    setCurrentActivity(prev => {
      const otherResponses = prev.responses?.filter(r =>
        !(r.notes === "LetsMeetAvailabilityResponse" && (r.user_id === user.id || r.email === user.email))
      ) || [];

      return {
        ...prev,
        responses: [...otherResponses, newResponse],
        comments: [...(prev.comments || []), newComment]
      };
    });
  };

  const shareUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${currentActivity.id}/share`;

  const handleClick = () => {
    window.open(
      shareUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Helper function to check if a time slot is recommended
  const isRecommended = (slot) => {
    return slot.recommendation && Object.keys(slot.recommendation).length > 0;
  };

  if (loading) return <LoadingScreenUser autoDismiss={false} />;

  if (collecting && !voting) {
    return (
      <Container>
        <TopBar>
          <Heading>Submit Your Availability</Heading>
        </TopBar>

        {error && <ErrorText>{error}</ErrorText>}

        <PhaseIndicator>
          <PhaseIcon><Calendar size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Collecting Availability</PhaseTitle>
            <PhaseSubtitle>{availabilityResponses.length}/{totalParticipants} participants have submitted</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={responseRate} />
        </ProgressBarContainer>

        {isOwner && (
          <OrganizerSection>
            <OrganizerTitle><Cog size={20} style={{ marginBottom: '4px' }} /> Organizer Controls</OrganizerTitle>
            <ParticipantsList>
              {currentActivity.participants.concat([{ id: user.id, name: currentActivity.user?.name || 'You' }]).map((participant, index) => {
                const hasSubmitted = availabilityResponses.some(r =>
                  r.user_id === participant.id || r.email === participant.email
                );
                return (
                  <ParticipantItem key={index}>
                    <ParticipantName>{participant.name || participant.email}</ParticipantName>
                    <ParticipantStatus $submitted={hasSubmitted}>
                      {hasSubmitted ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {hasSubmitted ? 'Submitted' : 'Waiting'}
                    </ParticipantStatus>
                  </ParticipantItem>
                );
              })}
            </ParticipantsList>
            <FullWidthButton $primary onClick={() => setShowMoveToVotingModal(true)}>
              <TrendingUp size={20} />
              Generate Results & AI Recommendations
            </FullWidthButton>
          </OrganizerSection>
        )}

        {!currentUserResponse ? (
          <PreferencesCard>
            <PreferencesIcon><Calendar size={48} /></PreferencesIcon>
            <PreferencesTitle>Submit Your Availability!</PreferencesTitle>
            <PreferencesText>
              Help us find the perfect time by sharing when you're available to meet.
            </PreferencesText>
            <PreferencesButton onClick={() => setShowScheduler(true)}>
              <Calendar size={20} />
              Set Your Availability
            </PreferencesButton>
          </PreferencesCard>
        ) : (
          <SubmittedCard>
            <SubmittedIcon><CheckCircle size={48} /></SubmittedIcon>
            <SubmittedTitle>Thank you for submitting your availability!</SubmittedTitle>
            <SubmittedText>
              The organizer will generate time slot results and AI recommendations shortly. You can update your availability if needed.
            </SubmittedText>
            <ResubmitButton onClick={() => setShowScheduler('update')}>
              <Calendar size={18} />
              Update Availability
            </ResubmitButton>
          </SubmittedCard>
        )}

        {showScheduler && (
          <LetsMeetScheduler
            onClose={() => setShowScheduler(false)}
            responseSubmitted={!!currentUserResponse}
            currentActivity={currentActivity}
            activityId={currentActivity.id}
            isUpdate={showScheduler === 'update'}
            onAvailabilityUpdate={handleAvailabilityUpdate}
          />
        )}

        {showMoveToVotingModal && (
          <ModalOverlay onClick={() => setShowMoveToVotingModal(false)}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Generate time slot results?</ModalTitle>
                <ModalSubtitle>Generate time slots with availability counts and AI recommendations</ModalSubtitle>
                <CloseButton onClick={() => setShowMoveToVotingModal(false)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <Section>
                  <ModalProgressContainer>
                    <ModalProgressBarContainer>
                      <ModalProgressBar $percent={responseRate} />
                    </ModalProgressBarContainer>
                    <ProgressInfo>
                      <ProgressLeft>
                        <Users size={16} />
                        <span>{availabilityResponses.length}/{totalParticipants} users submitted</span>
                      </ProgressLeft>
                      <ProgressPercentage>{Math.round(responseRate)}%</ProgressPercentage>
                    </ProgressInfo>
                  </ModalProgressContainer>

                  {responseRate < 50 && (
                    <WarningBox>
                      <span>⚠️ Less than 50% of participants have submitted their availability. Consider waiting for more responses to get better time slots and AI recommendations.</span>
                    </WarningBox>
                  )}
                </Section>

                <ButtonRow>
                  <Button onClick={() => setShowMoveToVotingModal(false)}>
                    Cancel
                  </Button>
                  <Button $primary onClick={moveToVotingPhase}>
                    <Brain size={16} />
                    Generate Results & AI Analysis
                  </Button>
                </ButtonRow>
              </ModalBody>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Container>
    );
  }

  if (voting && !collecting && !finalized) {
    return (
      <Container>
        <TopBar>
          <Heading>Time Slot Results</Heading>
        </TopBar>

        <PhaseIndicator>
          <PhaseIcon><TrendingUp size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Results Generated</PhaseTitle>
            <PhaseSubtitle>Time slots ranked by availability with AI recommendations</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        {error && <ErrorText>{error}</ErrorText>}

        {loadingAI && (
          <AISection>
            <AITitle>
              <Brain size={20} />
              Generating AI Recommendations...
            </AITitle>
            <p style={{ color: '#ccc', margin: 0 }}>Analyzing group availability patterns...</p>
          </AISection>
        )}

        {!loadingAI && aiRecommendations.length > 0 && (
          <AISection>
            <AITitle>
              <Brain size={20} />
              AI Recommendations
            </AITitle>
            {aiRecommendations.map((rec, index) => (
              <RecommendationCard key={index}>
                <RecommendationHeader>
                  <RecommendationTitle>{rec.title}</RecommendationTitle>
                  <ParticipantCount>
                    {rec.participants_available}/{totalParticipants} available
                  </ParticipantCount>
                </RecommendationHeader>
                <RecommendationReason>{rec.reason}</RecommendationReason>
                <ProsCons>
                  <ProsConsSection>
                    <ProsConsTitle $type="pros">Pros</ProsConsTitle>
                    <ProsConsList>
                      {rec.pros?.map((pro, i) => (
                        <ProsConsItem key={i}>{pro}</ProsConsItem>
                      ))}
                    </ProsConsList>
                  </ProsConsSection>
                  <ProsConsSection>
                    <ProsConsTitle $type="cons">Considerations</ProsConsTitle>
                    <ProsConsList>
                      {rec.cons?.map((con, i) => (
                        <ProsConsItem key={i}>{con}</ProsConsItem>
                      ))}
                    </ProsConsList>
                  </ProsConsSection>
                </ProsCons>
              </RecommendationCard>
            ))}
          </AISection>
        )}

        {/* Show saved recommendations if they exist but no fresh AI data */}
        {!loadingAI && aiRecommendations.length === 0 && pinned.some(slot => slot.recommendation && Object.keys(slot.recommendation).length > 0) && (
          <AISection>
            <AITitle>
              <Brain size={20} />
              AI Recommendations
            </AITitle>
            {pinned
              .filter(slot => slot.recommendation && Object.keys(slot.recommendation).length > 0)
              .map((slot, index) => (
                <RecommendationCard key={index}>
                  <RecommendationHeader>
                    <RecommendationTitle>{slot.recommendation.title}</RecommendationTitle>
                    <ParticipantCount>
                      {slot.recommendation.participants_available}/{totalParticipants} available
                    </ParticipantCount>
                  </RecommendationHeader>
                  <RecommendationReason>{slot.recommendation.reason}</RecommendationReason>
                  <ProsCons>
                    <ProsConsSection>
                      <ProsConsTitle $type="pros">Pros</ProsConsTitle>
                      <ProsConsList>
                        {slot.recommendation.pros?.map((pro, i) => (
                          <ProsConsItem key={i}>{pro}</ProsConsItem>
                        ))}
                      </ProsConsList>
                    </ProsConsSection>
                    <ProsConsSection>
                      <ProsConsTitle $type="cons">Considerations</ProsConsTitle>
                      <ProsConsList>
                        {slot.recommendation.cons?.map((con, i) => (
                          <ProsConsItem key={i}>{con}</ProsConsItem>
                        ))}
                      </ProsConsList>
                    </ProsConsSection>
                  </ProsCons>
                </RecommendationCard>
              ))}
          </AISection>
        )}

        {isOwner && (
          <OrganizerSection>
            <OrganizerTitle><Cog style={{ marginBottom: '4px' }} size={20} /> Organizer Controls</OrganizerTitle>
            <FullWidthButton $primary onClick={onEdit}>
              <Flag size={20} />
              Finalize Activity
            </FullWidthButton>
          </OrganizerSection>
        )}

        <TimeSlotsList>
          {[...pinned]
            .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))
            .map((slot) => {
              const dateObj = parseISO(slot.date);
              const formattedDate = format(dateObj, 'MMM do');
              const [h, m] = slot.time.slice(11, 16).split(':');
              const timeObj = new Date();
              timeObj.setHours(+h, +m);
              const formattedTime = format(timeObj, 'h:mm a');

              const recommended = isRecommended(slot);

              return (
                <TimeSlotCard key={slot.id} $recommended={recommended}>
                  {recommended && (
                    <RecommendedBadge>
                      <Star size={16} />
                      <span>AI PICK</span>
                    </RecommendedBadge>
                  )}
                  <TimeSlotHeader $hasRecommendation={recommended}>
                    <div>
                      <TimeSlotDate>{formattedDate}</TimeSlotDate>
                      <TimeSlotTime>{formattedTime}</TimeSlotTime>
                    </div>
                    <TimeSlotActions>
                      <AvailabilityCount>
                        <UserCheck size={16} />
                        {slot.votes_count || 0}
                      </AvailabilityCount>
                      {isOwner && (
                        <DeleteButton onClick={() => handleTimeSlotDelete(slot.id)}>
                          <Trash size={16} />
                        </DeleteButton>
                      )}
                    </TimeSlotActions>
                  </TimeSlotHeader>

                  <TimeSlotStats>
                    <StatRow>
                      <StatLabel>
                        <UserCheck size={16} />
                        Participants Available
                      </StatLabel>
                      <StatValue $type="availability">{slot.votes_count || 0}/{totalParticipants}</StatValue>
                    </StatRow>
                  </TimeSlotStats>
                </TimeSlotCard>
              );
            })}
        </TimeSlotsList>

        {showFinalizeModal && (
          <ModalOverlay onClick={() => setShowFinalizeModal(false)}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Finalize activity?</ModalTitle>
                <ModalSubtitle>Select the winning time slot and end the scheduling process</ModalSubtitle>
                <CloseButton onClick={() => setShowFinalizeModal(false)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <ButtonRow>
                  <Button onClick={() => setShowFinalizeModal(false)}>
                    Cancel
                  </Button>
                  <Button $primary onClick={finalizeActivity}>
                    <Flag size={16} />
                    Finalize Activity
                  </Button>
                </ButtonRow>
              </ModalBody>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Container>
    );
  }

  if (finalized) {
    return (
      <Container>
        <TopBar>
          <Heading>Activity Finalized</Heading>
        </TopBar>

        <PhaseIndicator style={{ cursor: 'pointer' }} onClick={handleClick}>
          <PhaseIcon><Share size={24} /> </PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Share Finalized Activity Link!</PhaseTitle>
            <PhaseSubtitle>Click here to view & share finalized activity.</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        {error && <ErrorText>{error}</ErrorText>}

        <TimeSlotsList>
          {[...pinned]
            .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))
            .map((slot) => {
              const isSelected = slot.id === selected_time_slot_id;
              const dateObj = parseISO(slot.date);
              const formattedDate = format(dateObj, 'MMM do');
              const [h, m] = slot.time.slice(11, 16).split(':');
              const timeObj = new Date();
              timeObj.setHours(+h, +m);
              const formattedTime = format(timeObj, 'h:mm a');

              return (
                <TimeSlotCard key={slot.id} $selected={isSelected}>
                  {isSelected && (
                    <SelectedBadge>
                      <CheckCircle size={16} />
                      <span>SELECTED</span>
                    </SelectedBadge>
                  )}
                  <TimeSlotHeader $hasRecommendation={false}>
                    <div>
                      <TimeSlotDate>{formattedDate}</TimeSlotDate>
                      <TimeSlotTime>{formattedTime}</TimeSlotTime>
                    </div>
                    <TimeSlotActions>
                      <AvailabilityCount>
                        <UserCheck size={16} />
                        {slot.votes_count || 0}
                      </AvailabilityCount>
                    </TimeSlotActions>
                  </TimeSlotHeader>

                  <TimeSlotStats>
                    <StatRow>
                      <StatLabel>
                        <UserCheck size={16} />
                        Were Available
                      </StatLabel>
                      <StatValue $type="availability">{slot.votes_count || 0}/{totalParticipants}</StatValue>
                    </StatRow>
                  </TimeSlotStats>
                </TimeSlotCard>
              );
            })}
        </TimeSlotsList>
      </Container >
    );
  }

  return (
    <Container>
      <TopBar>
        <Heading>Time Scheduling</Heading>
      </TopBar>
      <p>Activity is not in collecting or voting phase.</p>
    </Container>
  );
}