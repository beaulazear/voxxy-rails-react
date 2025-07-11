import React, { useState, useContext, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Users, Share, CheckCircle, Flag, Calendar, X, UserCheck, Brain, Star, TrendingUp } from 'lucide-react';
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

import {
  UnifiedCardsList,
  UnifiedCard,
  CardBadge,
  CardHeader,
  CardContent,
  CardTitle,
  CardSubtitle,
  CardStats,
  StatItem,
  StatNumber,
  LoadingSection,
  DetailModalOverlay,
  DetailModalContainer,
  DetailModalHeader,
  DetailModalTitle,
  DetailModalSubtitle,
  DetailModalAvailability,
  DetailModalCloseButton,
  DetailModalBody,
  DetailModalDescription,
  ProConsContainer,
  ProConsSection,
  ProConsTitle,
  ProConsList,
  ProsConsItem
} from '../styles/UnifiedCardStyles';

export default function TimeSlots({ onEdit, currentActivity, pinned, setPinned, toggleVote, isOwner, setCurrentActivity }) {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showMoveToVotingModal, setShowMoveToVotingModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { id, responses, collecting, voting, finalized, selected_time_slot_id } = currentActivity;

  const availabilityResponses = responses.filter(r => r.notes === "LetsMeetAvailabilityResponse");

  const invitedParticipantEmails = new Set(currentActivity.participants.map(p => p.email));
  const guestResponses = availabilityResponses.filter(r =>
    r.email && !invitedParticipantEmails.has(r.email) && r.email !== user.email
  );

  const totalParticipants = 1 + currentActivity.participants.length + guestResponses.length; // owner + invited + guests
  const responseRate = (availabilityResponses.length / totalParticipants) * 100;

  const currentUserResponse = availabilityResponses.find(r =>
    r.user_id === user.id || r.email === user.email
  );

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

  const formatDateTime = (dateStr, timeStr) => {
    try {
      const dateObj = parseISO(dateStr);
      const formattedDate = format(dateObj, 'MMMM do, yyyy');

      let timeOnly;
      if (!timeStr) {
        console.error('timeStr is null/undefined');
        return { formattedDate: 'Invalid Date', formattedTime: 'Invalid Time' };
      }

      if (timeStr.includes('T')) {
        timeOnly = timeStr.slice(11, 16);
      } else {
        timeOnly = timeStr.substring(0, 5);
      }

      const [h, m] = timeOnly.split(':');
      if (!h || !m) {
        console.error('Invalid time format:', timeOnly);
        return { formattedDate, formattedTime: 'Invalid Time' };
      }

      const timeObj = new Date();
      timeObj.setHours(parseInt(h), parseInt(m));
      const formattedTime = format(timeObj, 'h:mm a');

      return { formattedDate, formattedTime };
    } catch (error) {
      console.error('formatDateTime error:', error, { dateStr, timeStr });
      return { formattedDate: 'Invalid Date', formattedTime: 'Invalid Time' };
    }
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCard(null);
  };

  const getRecommendationPriority = (title) => {
    const priorities = {
      'Best Overall Choice': 1,
      'Alternative Option': 2,
      'Compromise Choice': 3
    };
    return priorities[title] || 999; // Unknown titles go to the end
  };

  const createUnifiedCardsList = () => {
    const cards = [];

    // Add AI recommendations first (sorted by priority)
    if (aiRecommendations.length > 0) {
      // Sort recommendations by priority: Best -> Alternative -> Compromise
      const sortedRecommendations = [...aiRecommendations].sort((a, b) =>
        getRecommendationPriority(a.title) - getRecommendationPriority(b.title)
      );

      sortedRecommendations.forEach((rec, index) => {
        const slot = pinned.find(slot => slot.id === rec.time_slot_id);
        const dateTime = rec.date && rec.time
          ? formatDateTime(rec.date, rec.time)
          : (slot ? formatDateTime(slot.date, slot.time) : null);

        cards.push({
          id: `rec-${index}`,
          type: 'recommendation',
          title: rec.title,
          description: rec.reason,
          pros: rec.pros || [],
          cons: rec.cons || [],
          dateTime: dateTime || { formattedDate: 'TBD', formattedTime: 'TBD' },
          availableCount: rec.participants_available || (slot ? slot.votes_count : 0),
          totalParticipants,
          slot,
          recommendation: rec
        });
      });
    } else if (hasExistingRecommendations) {
      // Handle existing recommendations stored in time slots (also sorted)
      const slotsWithRecommendations = pinned.filter(slot =>
        slot.recommendation && Object.keys(slot.recommendation).length > 0
      );

      const uniqueRecommendations = slotsWithRecommendations
        .map(slot => ({ ...slot.recommendation, slot }))
        .filter((rec, index, arr) =>
          arr.findIndex(r => r.title === rec.title) === index
        )
        .sort((a, b) => getRecommendationPriority(a.title) - getRecommendationPriority(b.title));

      uniqueRecommendations.forEach((rec, index) => {
        const dateTime = formatDateTime(rec.slot.date, rec.slot.time);

        cards.push({
          id: `stored-rec-${index}`,
          type: 'recommendation',
          title: rec.title,
          description: rec.reason,
          pros: rec.pros || [],
          cons: rec.cons || [],
          dateTime,
          availableCount: rec.slot.votes_count || 0,
          totalParticipants,
          slot: rec.slot,
          recommendation: rec
        });
      });
    }

    // Add regular time slots (excluding those that are already recommendations)
    const regularSlots = pinned.filter(slot => {
      const hasAIRec = aiRecommendations.some(rec => rec.time_slot_id === slot.id);
      const hasStoredRec = slot.recommendation && Object.keys(slot.recommendation).length > 0;
      return !hasAIRec && !hasStoredRec;
    });

    regularSlots
      .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))
      .forEach((slot) => {
        const dateTime = formatDateTime(slot.date, slot.time);

        cards.push({
          id: `slot-${slot.id}`,
          type: 'timeslot',
          title: null,
          description: null,
          pros: [],
          cons: [],
          dateTime,
          availableCount: slot.votes_count || 0,
          totalParticipants,
          slot,
          isSelected: slot.id === selected_time_slot_id
        });
      });

    return cards;
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
            <PhaseSubtitle>Select a recommendation to view its detailed AI analysis.</PhaseSubtitle>
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
          <LoadingSection>
            <h3>
              <Brain size={20} />
              Generating AI Recommendations...
            </h3>
            <p>Analyzing group availability patterns...</p>
          </LoadingSection>
        )}

        {!loadingAI && (
          <>
            <UnifiedCardsList>
              {createUnifiedCardsList().map((card) => (
                <UnifiedCard
                  key={card.id}
                  $isRecommendation={card.type === 'recommendation'}
                  $selected={card.isSelected}
                  onClick={() => handleCardClick(card)}
                >
                  {card.type === 'recommendation' && (
                    <CardBadge $type="recommendation">
                      <Star size={12} />
                      <span>AI PICK</span>
                    </CardBadge>
                  )}

                  {card.isSelected && (
                    <CardBadge $type="selected">
                      <CheckCircle size={12} />
                      <span>SELECTED</span>
                    </CardBadge>
                  )}

                  <CardHeader>
                    <CardContent>
                      {card.title && (
                        <CardTitle $isRecommendation={card.type === 'recommendation'}>
                          {card.title}
                        </CardTitle>
                      )}

                      <CardSubtitle>
                        <Calendar size={16} />
                        {card.dateTime ?
                          `${card.dateTime.formattedDate} at ${card.dateTime.formattedTime}` :
                          'Date/time pending'
                        }
                      </CardSubtitle>
                    </CardContent>

                    <AvailabilityCount>
                      <UserCheck size={16} />
                      {card.availableCount}
                    </AvailabilityCount>
                  </CardHeader>

                  <CardStats>
                    <StatItem>
                      <UserCheck size={16} />
                      <span>
                        <StatNumber>{card.availableCount}</StatNumber>
                        /{card.totalParticipants} participants available
                      </span>
                    </StatItem>
                  </CardStats>
                </UnifiedCard>
              ))}
            </UnifiedCardsList>

            {/* Detail Modal */}
            {showDetailModal && selectedCard && (
              <DetailModalOverlay onClick={closeDetailModal}>
                <DetailModalContainer onClick={(e) => e.stopPropagation()}>
                  <DetailModalHeader>
                    <DetailModalTitle>
                      {selectedCard.title || 'Time Slot Details'}
                    </DetailModalTitle>
                    <DetailModalSubtitle>
                      <Calendar size={20} />
                      {selectedCard.dateTime.formattedDate} at {selectedCard.dateTime.formattedTime}
                    </DetailModalSubtitle>
                    <DetailModalAvailability>
                      <UserCheck size={16} />
                      {selectedCard.availableCount}/{selectedCard.totalParticipants} participants available
                    </DetailModalAvailability>
                    <DetailModalCloseButton onClick={closeDetailModal}>
                      <X size={20} />
                    </DetailModalCloseButton>
                  </DetailModalHeader>

                  <DetailModalBody>
                    {selectedCard.description && (
                      <DetailModalDescription>
                        {selectedCard.description}
                      </DetailModalDescription>
                    )}

                    {selectedCard.type === 'recommendation' && (selectedCard.pros.length > 0 || selectedCard.cons.length > 0) && (
                      <ProConsContainer>
                        {selectedCard.pros.length > 0 && (
                          <ProConsSection>
                            <ProConsTitle $type="pros">
                              ✓ Pros
                            </ProConsTitle>
                            <ProConsList>
                              {selectedCard.pros.map((pro, i) => (
                                <ProsConsItem key={i} $type="pros">{pro}</ProsConsItem>
                              ))}
                            </ProConsList>
                          </ProConsSection>
                        )}

                        {selectedCard.cons.length > 0 && (
                          <ProConsSection>
                            <ProConsTitle $type="cons">
                              ⚠ Considerations
                            </ProConsTitle>
                            <ProConsList>
                              {selectedCard.cons.map((con, i) => (
                                <ProsConsItem key={i} $type="cons">{con}</ProsConsItem>
                              ))}
                            </ProConsList>
                          </ProConsSection>
                        )}
                      </ProConsContainer>
                    )}
                  </DetailModalBody>
                </DetailModalContainer>
              </DetailModalOverlay>
            )}
          </>
        )}

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

        <UnifiedCardsList>
          {createUnifiedCardsList().map((card) => (
            <UnifiedCard
              key={card.id}
              $isRecommendation={card.type === 'recommendation'}
              $selected={card.isSelected}
              onClick={() => handleCardClick(card)}
            >
              {card.type === 'recommendation' && (
                <CardBadge $type="recommendation">
                  <Star size={12} />
                  <span>AI PICK</span>
                </CardBadge>
              )}

              {card.isSelected && (
                <CardBadge $type="selected">
                  <CheckCircle size={12} />
                  <span>SELECTED</span>
                </CardBadge>
              )}

              <CardHeader>
                <CardContent>
                  {card.title && (
                    <CardTitle $isRecommendation={card.type === 'recommendation'}>
                      {card.title}
                    </CardTitle>
                  )}

                  <CardSubtitle>
                    <Calendar size={16} />
                    {card.dateTime.formattedDate} at {card.dateTime.formattedTime}
                  </CardSubtitle>
                </CardContent>

                <AvailabilityCount>
                  <UserCheck size={16} />
                  {card.availableCount}
                </AvailabilityCount>
              </CardHeader>

              <CardStats>
                <StatItem>
                  <UserCheck size={16} />
                  <span>
                    <StatNumber>{card.availableCount}</StatNumber>
                    /{card.totalParticipants} participants {finalized ? 'were' : ''} available
                  </span>
                </StatItem>
              </CardStats>
            </UnifiedCard>
          ))}
        </UnifiedCardsList>

        {/* Detail Modal */}
        {showDetailModal && selectedCard && (
          <DetailModalOverlay onClick={closeDetailModal}>
            <DetailModalContainer onClick={(e) => e.stopPropagation()}>
              <DetailModalHeader>
                <DetailModalTitle>
                  {selectedCard.title || 'Time Slot Details'}
                  {selectedCard.type === 'recommendation' && (
                    <span style={{ color: '#cc31e8', marginLeft: '0.5rem' }}>
                      <Star size={20} />
                    </span>
                  )}
                </DetailModalTitle>
                <DetailModalSubtitle>
                  <Calendar size={20} />
                  {selectedCard.dateTime.formattedDate} at {selectedCard.dateTime.formattedTime}
                </DetailModalSubtitle>
                <DetailModalAvailability>
                  <UserCheck size={16} />
                  {selectedCard.availableCount}/{selectedCard.totalParticipants} participants were available
                </DetailModalAvailability>
                <DetailModalCloseButton onClick={closeDetailModal}>
                  <X size={20} />
                </DetailModalCloseButton>
              </DetailModalHeader>

              <DetailModalBody>
                {selectedCard.description && (
                  <DetailModalDescription>
                    {selectedCard.description}
                  </DetailModalDescription>
                )}

                {selectedCard.type === 'recommendation' && (selectedCard.pros.length > 0 || selectedCard.cons.length > 0) && (
                  <ProConsContainer>
                    {selectedCard.pros.length > 0 && (
                      <ProConsSection>
                        <ProConsTitle $type="pros">
                          ✓ Pros
                        </ProConsTitle>
                        <ProConsList>
                          {selectedCard.pros.map((pro, i) => (
                            <ProsConsItem key={i} $type="pros">{pro}</ProsConsItem>
                          ))}
                        </ProConsList>
                      </ProConsSection>
                    )}

                    {selectedCard.cons.length > 0 && (
                      <ProConsSection>
                        <ProConsTitle $type="cons">
                          ⚠ Considerations
                        </ProConsTitle>
                        <ProConsList>
                          {selectedCard.cons.map((con, i) => (
                            <ProsConsItem key={i} $type="cons">{con}</ProsConsItem>
                          ))}
                        </ProConsList>
                      </ProConsSection>
                    )}
                  </ProConsContainer>
                )}
              </DetailModalBody>
            </DetailModalContainer>
          </DetailModalOverlay>
        )}
      </Container>
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