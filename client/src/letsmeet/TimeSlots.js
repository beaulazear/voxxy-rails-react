import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { format, parseISO } from 'date-fns';
import { Users, Heart, Share, HeartPulse, Clock, Trash, CheckCircle, Vote, Flag, Cog, Calendar } from 'lucide-react';
import LetsMeetScheduler from './LetsMeetScheduler';
import LoadingScreenUser from "../admincomponents/LoadingScreenUser";
import { UserContext } from "../context/user";

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
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
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
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SubmittedCard = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
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
  border: 1px solid #28a745;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  
  &:hover {
    background: rgba(40, 167, 69, 0.1);
  }
`;

const OrganizerSection = styled.div`
  background: #2a1e30;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const OrganizerTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #fff;
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

const MoveToVotingButton = styled.button`
  width: 100%;
  background: #cc31e8;
  color: #fff;
  border: none;
  padding: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: #b22cc0;
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
  background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.2)' : '#2a1e30'};
  border: ${({ $selected }) => $selected ? '2px solid #28a745' : '1px solid rgba(255, 255, 255, 0.1)'};
  padding: 1rem;
  border-radius: 0.75rem;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.3)' : '#342540'};
    transform: translateY(-2px);
  }
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #28a745;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
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

const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${(props) => (props.$liked ? "#e25555" : "rgba(255, 255, 255, 0.2)")};
  color: ${(props) => (props.$liked ? "#e25555" : "#ccc")};
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const VoteCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ccc;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
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

const DimOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 900;
`;

const GenerateDim = styled(DimOverlay)`
  backdrop-filter: blur(6px);
`;

const GenerateModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #2a1e30;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  z-index: 1002;
  width: 90%;
  max-width: 24rem;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
`;

const ModalHeader = styled.div`
  text-align: left;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 500;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
`;

const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  padding: 1rem;
  border-radius: 0.5rem;
  color: #ffc107;
  font-size: 0.9rem;
  margin: 1rem 0;
`;

const FullWidthButton = styled.button`
  width: 100%;
  background: ${({ $primary }) => ($primary ? '#cc31e8' : 'transparent')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#6c63ff')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid #6c63ff')};
  padding: 1rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;

  &:hover {
    ${({ $primary }) =>
        $primary
            ? `background: #b22cc0;`
            : `background: rgba(108, 99, 255, 0.1); color: #6c63ff;`}
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
                        <OrganizerTitle><Cog size={20} /> Organizer Controls</OrganizerTitle>
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
                        <MoveToVotingButton onClick={() => setShowMoveToVotingModal(true)}>
                            <Vote size={20} />
                            Move to Voting Phase
                        </MoveToVotingButton>
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
                    <>
                        <GenerateDim onClick={() => setShowMoveToVotingModal(false)} />
                        <GenerateModal>
                            <ModalHeader>
                                <ModalTitle>Move to Voting Phase?</ModalTitle>
                            </ModalHeader>

                            <InfoRow>
                                <Users size={18} />
                                <span>{Math.round(responseRate)}% of participants have submitted availability</span>
                            </InfoRow>

                            {responseRate < 50 && (
                                <WarningBox>
                                    <span>⚠️ Less than 50% of participants have submitted their availability. Consider waiting for more responses to get better time slots.</span>
                                </WarningBox>
                            )}

                            <FullWidthButton $primary onClick={moveToVotingPhase}>
                                <Vote size={20} />
                                <div>
                                    <div>Generate Time Slots & Start Voting</div>
                                    <small>This will create the most popular time slots for voting</small>
                                </div>
                            </FullWidthButton>

                            <FullWidthButton onClick={() => setShowMoveToVotingModal(false)}>
                                Cancel
                            </FullWidthButton>
                        </GenerateModal>
                    </>
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
                        <OrganizerTitle><Cog size={20} /> Organizer Controls</OrganizerTitle>
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
                        <MoveToVotingButton onClick={onEdit}>
                            <Flag size={20} />
                            Finalize Activity
                        </MoveToVotingButton>
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
                                                {slot.user_voted ? <HeartPulse size={16} /> : <Heart size={16} />}
                                                {slot.votes_count || 0}
                                            </VoteButton>
                                            {isOwner && (
                                                <DeleteButton onClick={() => handleTimeSlotDelete(slot.id)}>
                                                    <Trash size={16} />
                                                </DeleteButton>
                                            )}
                                        </TimeSlotActions>
                                    </TimeSlotHeader>
                                </TimeSlotCard>
                            );
                        })}
                </TimeSlotsList>

                {showFinalizeModal && (
                    <>
                        <GenerateDim onClick={() => setShowFinalizeModal(false)} />
                        <GenerateModal>
                            <ModalHeader>
                                <ModalTitle>Finalize Activity?</ModalTitle>
                            </ModalHeader>

                            <InfoRow>
                                <Users size={18} />
                                <span>{Math.round(votingRate)}% of participants have voted</span>
                            </InfoRow>

                            {votingRate < 50 && (
                                <WarningBox>
                                    <span>⚠️ Less than 50% of participants have voted. Consider waiting for more votes before finalizing.</span>
                                </WarningBox>
                            )}

                            <FullWidthButton $primary onClick={finalizeActivity}>
                                <Flag size={20} />
                                <div>
                                    <div>Finalize Activity</div>
                                    <small>This will end the voting phase and select the winning time slot</small>
                                </div>
                            </FullWidthButton>

                            <FullWidthButton onClick={() => setShowFinalizeModal(false)}>
                                Cancel
                            </FullWidthButton>
                        </GenerateModal>
                    </>
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