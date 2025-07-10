import React, { useState, useContext, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Users, Share, Clock, CheckCircle, Flag, Calendar, X, UserCheck, Brain, Star, TrendingUp } from 'lucide-react';
import LetsMeetScheduler from './LetsMeetScheduler';
import LoadingScreenUser from "../admincomponents/LoadingScreenUser";
import { UserContext } from "../context/user";
import {
  Container,
  TopBar,
  Heading,
  PhaseIndicator,
  PhaseIndicatorButton,
  PhaseIcon,
  PhaseContent,
  PhaseTitle,
  PhaseSubtitle,
  ProgressBarContainer,
  ProgressBar,
  PreferencesCard,
  PreferencesIcon,
  PreferencesTitle,
  PreferencesText,
  PreferencesButton,
  SubmittedCard,
  SubmittedIcon,
  SubmittedTitle,
  SubmittedText,
  ResubmitButton,
  ErrorText,
  AISection,
  AITitle,
  RecommendationCard,
  RecommendationHeader,
  RecommendationTitle,
  ParticipantCount,
  RecommendationReason,
  ProsCons,
  ProsConsSection,
  ProsConsTitle,
  ProsConsList,
  ProsConsItem,
  TimeSlotsList,
  TimeSlotCard,
  SelectedBadge,
  RecommendedBadge,
  TimeSlotHeader,
  TimeSlotDate,
  TimeSlotTime,
  TimeSlotActions,
  TimeSlotStats,
  StatRow,
  StatLabel,
  StatValue,
  AvailabilityCount,

  ModalOverlay,
  ModalContainer,
  ModalHeader,
  CloseButton,
  ModalTitle,
  ModalSubtitle,
  ModalBody,
  Section,
  ModalProgressContainer,
  ModalProgressBarContainer,
  ModalProgressBar,
  ProgressInfo,
  ProgressLeft,
  ProgressPercentage,
  WarningBox,
  Button,
  ButtonRow
} from '../styles/TimeSlotStyles';

export default function TimeSlots({ onEdit, currentActivity, pinned, setPinned, toggleVote, isOwner, setCurrentActivity }) {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showMoveToVotingModal, setShowMoveToVotingModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const { id, responses, collecting, voting, finalized, selected_time_slot_id } = currentActivity;

  // Calculate total participants including guests who responded
  const availabilityResponses = responses.filter(r => r.notes === "LetsMeetAvailabilityResponse");

  // Count unique participants: invited participants + owner + guest responses
  const invitedParticipantEmails = new Set(currentActivity.participants.map(p => p.email));
  const guestResponses = availabilityResponses.filter(r =>
    r.email && !invitedParticipantEmails.has(r.email) && r.email !== user.email
  );

  const totalParticipants = 1 + currentActivity.participants.length + guestResponses.length; // owner + invited + guests
  const responseRate = (availabilityResponses.length / totalParticipants) * 100;

  const currentUserResponse = availabilityResponses.find(r =>
    r.user_id === user.id || r.email === user.email
  );

  // Check if we have saved recommendations in the time slots
  const hasExistingRecommendations = pinned.some(slot =>
    slot.recommendation && Object.keys(slot.recommendation).length > 0
  );

  useEffect(() => {
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

  // Helper function to format date and time for AI recommendations
  const formatDateTime = (dateStr, timeStr) => {
    const dateObj = parseISO(dateStr);
    const formattedDate = format(dateObj, 'MMMM do, yyyy');

    const [h, m] = timeStr.slice(11, 16).split(':');
    const timeObj = new Date();
    timeObj.setHours(+h, +m);
    const formattedTime = format(timeObj, 'h:mm a');

    return { formattedDate, formattedTime };
  };

  // Helper function to find time slot for AI recommendation
  const findTimeSlotForRecommendation = (rec) => {
    return pinned.find(slot =>
      slot.recommendation &&
      slot.recommendation.title === rec.title
    );
  };

  if (loading) return <LoadingScreenUser autoDismiss={false} />;

  if (collecting && !voting) {
    return (
      <Container>
        <TopBar>
          <Heading>Collecting Availability</Heading>
        </TopBar>

        {error && <ErrorText>{error}</ErrorText>}

        <PhaseIndicator>
          <PhaseIcon><Calendar size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Submit Your Availability</PhaseTitle>
            <PhaseSubtitle>{availabilityResponses.length}/{totalParticipants} participants have submitted</PhaseSubtitle>
          </PhaseContent>
          {isOwner && (
            <PhaseIndicatorButton onClick={() => setShowMoveToVotingModal(true)}>
              <TrendingUp size={16} />
              Generate Results
            </PhaseIndicatorButton>
          )}
        </PhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={responseRate} />
        </ProgressBarContainer>

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
            <SubmittedTitle>Availability Submitted!</SubmittedTitle>
            <SubmittedText>
              Waiting for the organizer to generate results and AI recommendations.
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
                    Generate Results
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
          <Heading>Results Generated</Heading>
        </TopBar>

        <PhaseIndicator>
          <PhaseIcon><TrendingUp size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Time Slot Results</PhaseTitle>
            <PhaseSubtitle>Time slots ranked by availability with AI recommendations</PhaseSubtitle>
          </PhaseContent>
          {isOwner && (
            <PhaseIndicatorButton onClick={onEdit}>
              <Flag size={16} />
              Finalize Activity
            </PhaseIndicatorButton>
          )}
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

        {/* Consolidated AI Recommendations Section */}
        {!loadingAI && (aiRecommendations.length > 0 || pinned.some(slot => slot.recommendation && Object.keys(slot.recommendation).length > 0)) && (
          <AISection>
            <AITitle>
              <Brain size={20} />
              AI Recommendations
            </AITitle>
            {aiRecommendations.length > 0 ? (
              aiRecommendations.map((rec, index) => {
                const slot = findTimeSlotForRecommendation(rec);
                const dateTime = slot ? formatDateTime(slot.date, slot.time) : null;

                return (
                  <RecommendationCard key={index}>
                    <RecommendationHeader>
                      <RecommendationTitle>{rec.title}</RecommendationTitle>
                      <ParticipantCount>
                        {slot ? (slot.votes_count || 0) : rec.participants_available}/{totalParticipants} available
                      </ParticipantCount>
                    </RecommendationHeader>
                    {dateTime && (
                      <div style={{
                        color: '#cc31e8',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Calendar size={16} />
                        {dateTime.formattedDate} at {dateTime.formattedTime}
                      </div>
                    )}
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
                      {rec.cons && rec.cons.length > 0 && (
                        <ProsConsSection>
                          <ProsConsTitle $type="cons">Considerations</ProsConsTitle>
                          <ProsConsList>
                            {rec.cons.map((con, i) => (
                              <ProsConsItem key={i}>{con}</ProsConsItem>
                            ))}
                          </ProsConsList>
                        </ProsConsSection>
                      )}
                    </ProsCons>
                  </RecommendationCard>
                );
              })
            ) : (
              (() => {
                const slotsWithRecommendations = pinned.filter(slot =>
                  slot.recommendation && Object.keys(slot.recommendation).length > 0
                );

                const uniqueRecommendations = slotsWithRecommendations
                  .map(slot => ({ ...slot.recommendation, slot }))
                  .filter((rec, index, arr) =>
                    arr.findIndex(r => r.title === rec.title) === index
                  );

                return uniqueRecommendations.map((rec, index) => {
                  const dateTime = formatDateTime(rec.slot.date, rec.slot.time);

                  return (
                    <RecommendationCard key={index}>
                      <RecommendationHeader>
                        <RecommendationTitle>{rec.title}</RecommendationTitle>
                        <ParticipantCount>
                          {rec.slot.votes_count || 0}/{totalParticipants} available
                        </ParticipantCount>
                      </RecommendationHeader>
                      <div style={{
                        color: '#cc31e8',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Calendar size={16} />
                        {dateTime.formattedDate} at {dateTime.formattedTime}
                      </div>
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
                        {rec.cons && rec.cons.length > 0 && (
                          <ProsConsSection>
                            <ProsConsTitle $type="cons">Considerations</ProsConsTitle>
                            <ProsConsList>
                              {rec.cons.map((con, i) => (
                                <ProsConsItem key={i}>{con}</ProsConsItem>
                              ))}
                            </ProsConsList>
                          </ProsConsSection>
                        )}
                      </ProsCons>
                    </RecommendationCard>
                  );
                });
              })()
            )}
          </AISection>
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
                  <TimeSlotHeader>
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
                  <TimeSlotHeader>
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