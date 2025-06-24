import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { format, parseISO } from 'date-fns';
import { Users, Share, HeartPulse, Clock, Trash, CheckCircle, Vote, Flag, Cog, Calendar, X, Zap, UserCheck } from 'lucide-react';
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
  background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected }) => $selected ? '1px solid #28a745' : '1px solid rgba(255, 255, 255, 0.1)'};
  padding: 1rem;
  border-radius: 0.75rem;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
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

const TimeSlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
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
    $type === 'votes' ? '#e25555' :
      $type === 'available' ? '#28a745' : '#fff'};
  font-weight: 500;
`;

const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: ${(props) => (props.$liked ? "#e25555" : "#ccc")};
  cursor: pointer;
  font-size: 0.875rem;
  & svg {
    fill: ${(props) => (props.$liked ? "#e25555" : "none")};
  }
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const VoteCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ccc;
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

  const { id, responses, collecting, voting, finalized, selected_time_slot_id } = currentActivity;

  const totalParticipants = currentActivity.participants.length + 1;
  const availabilityResponses = responses.filter(r => r.notes === "LetsMeetAvailabilityResponse");
  const responseRate = (availabilityResponses.length / totalParticipants) * 100;
  const currentUserResponse = availabilityResponses.find(r => r.user_id === user.id);

  const participantsWithVotes = new Set();
  pinned.forEach(slot => {
    if (slot.voter_ids && Array.isArray(slot.voter_ids)) {
      slot.voter_ids.forEach(voterId => {
        participantsWithVotes.add(voterId);
      });
    }
  });
  const votingRate = (participantsWithVotes.size / totalParticipants) * 100;

  // Availability counts are now calculated on the backend

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
        !(r.notes === "LetsMeetAvailabilityResponse" && r.user_id === user.id)
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
      shareUrl,    // your URL
      '_blank',                 // open in new tab
      'noopener,noreferrer'     // recommended for security
    );
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
                const hasSubmitted = availabilityResponses.some(r => r.user_id === participant.id);
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
              <Vote size={20} />
              Move to Voting Phase
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
              The organizer will gather the best time slots shortly. You can update your availability if needed.
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
                <ModalTitle>Move to voting phase?</ModalTitle>
                <ModalSubtitle>Generate time slots and start group voting</ModalSubtitle>
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
                      <span>⚠️ Less than 50% of participants have submitted their availability. Consider waiting for more responses to get better time slots.</span>
                    </WarningBox>
                  )}
                </Section>

                <ButtonRow>
                  <Button onClick={() => setShowMoveToVotingModal(false)}>
                    Cancel
                  </Button>
                  <Button $primary onClick={moveToVotingPhase}>
                    <Zap size={16} />
                    Generate Time Slots
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
          <Heading>Vote on Time Slots</Heading>
        </TopBar>

        <PhaseIndicator>
          <PhaseIcon><Vote size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Voting Phase</PhaseTitle>
            <PhaseSubtitle>{participantsWithVotes.size}/{totalParticipants} participants have voted</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={votingRate} />
        </ProgressBarContainer>

        {error && <ErrorText>{error}</ErrorText>}

        {isOwner && (
          <OrganizerSection>
            <OrganizerTitle><Cog style={{ marginBottom: '4px' }} size={20} /> Organizer Controls</OrganizerTitle>
            <ParticipantsList>
              {currentActivity.participants.concat([{ id: user.id, name: currentActivity.user?.name || 'You' }]).map((participant, index) => {
                const hasVoted = Array.from(participantsWithVotes).includes(participant.id);
                return (
                  <ParticipantItem key={index}>
                    <ParticipantName>{participant.name || participant.email}</ParticipantName>
                    <ParticipantStatus $submitted={hasVoted}>
                      {hasVoted ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {hasVoted ? 'Voted' : 'Waiting'}
                    </ParticipantStatus>
                  </ParticipantItem>
                );
              })}
            </ParticipantsList>
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

              // Use availability count from backend
              const availabilityCount = slot.availability_count || 0;

              return (
                <TimeSlotCard key={slot.id}>
                  <TimeSlotHeader>
                    <div>
                      <TimeSlotDate>{formattedDate}</TimeSlotDate>
                      <TimeSlotTime>{formattedTime}</TimeSlotTime>
                    </div>
                    <TimeSlotActions>
                      <VoteButton
                        $liked={slot.user_voted}
                        onClick={() => toggleVote(slot)}
                      >
                        {slot.user_voted ? '❤️' : '🤍'} {slot.votes_count || 0}
                      </VoteButton>
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
                        <HeartPulse size={16} />
                        Votes
                      </StatLabel>
                      <StatValue $type="votes">{slot.votes_count || 0}</StatValue>
                    </StatRow>
                    <StatRow>
                      <StatLabel>
                        <UserCheck size={16} />
                        Available
                      </StatLabel>
                      <StatValue $type="available">{availabilityCount}</StatValue>
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
                <ModalSubtitle>Select the winning time slot and end voting</ModalSubtitle>
                <CloseButton onClick={() => setShowFinalizeModal(false)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <Section>
                  <ModalProgressContainer>
                    <ModalProgressBarContainer>
                      <ModalProgressBar $percent={votingRate} />
                    </ModalProgressBarContainer>
                    <ProgressInfo>
                      <ProgressLeft>
                        <Users size={16} />
                        <span>{participantsWithVotes.size}/{totalParticipants} users voted</span>
                      </ProgressLeft>
                      <ProgressPercentage>{Math.round(votingRate)}%</ProgressPercentage>
                    </ProgressInfo>
                  </ModalProgressContainer>

                  {votingRate < 50 && (
                    <WarningBox>
                      <span>⚠️ Less than 50% of participants have voted. Consider waiting for more votes before finalizing.</span>
                    </WarningBox>
                  )}
                </Section>

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

              // Use availability count from backend
              const availabilityCount = slot.availability_count || 0;

              return (
                <TimeSlotCard key={slot.id} $selected={isSelected}>
                  {isSelected && (
                    <SelectedBadge>
                      <CheckCircle size={16} />
                      <span>SELECTED</span>
                    </SelectedBadge>
                  )}
                  <TimeSlotHeader>
                    <div>
                      <TimeSlotDate>{formattedDate}</TimeSlotDate>
                      <TimeSlotTime>{formattedTime}</TimeSlotTime>
                    </div>
                    <TimeSlotActions>
                      <VoteCount>
                        <HeartPulse size={16} />
                        {slot.votes_count || 0}
                      </VoteCount>
                    </TimeSlotActions>
                  </TimeSlotHeader>

                  <TimeSlotStats>
                    <StatRow>
                      <StatLabel>
                        <HeartPulse size={16} />
                        Final Votes
                      </StatLabel>
                      <StatValue $type="votes">{slot.votes_count || 0}</StatValue>
                    </StatRow>
                    <StatRow>
                      <StatLabel>
                        <UserCheck size={16} />
                        Were Available
                      </StatLabel>
                      <StatValue $type="available">{availabilityCount}</StatValue>
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