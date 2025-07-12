// components/AIRecommendations.js
import React, { useState, useContext } from "react";
import styled from 'styled-components';
import CuisineChat from "./CuisineChat";
import BarChat from "../cocktails//BarChat";
import GameNightPreferenceChat from "../gamenight/GameNightPreferenceChat"; // Add this import
import LoadingScreenUser from "./LoadingScreenUser.js";
import mixpanel from "mixpanel-browser";
import { UserContext } from "../context/user";
import { Users, Share, HelpCircle, CheckCircle, Clock, Vote, BookHeart, Flag, X, ExternalLink, MapPin, DollarSign, Globe, Zap, Calendar, Star } from 'lucide-react';

// Import all styled components from the styles file
import {
  Container,
  TopBar,
  Heading,
  PhaseIndicator,
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
  WarningBox,
  ErrorText,
  AvailabilitySection,
  AvailabilityTitle,
  AvailabilityGrid,
  DateCard,
  DateHeader,
  TimeSlots,
  TimeSlot,
  ParticipantAvailability,
  ParticipantNameAvailability,
  OverlapAnalysis,
  OverlapTitle,
  TimeOverlapItem,
  TimeText,
  AvailabilityBadge,
  RecommendationsList,
  ListItem,
  SelectedBadge,
  ContentWrapper,
  ListTop,
  ListName,
  ListMeta,
  ListBottom,
  LikeButton,
  VoteCount,
  DimOverlay,
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  CloseButton,
  ModalTitle,
  ModalSubtitle,
  ModalBody,
  Section,
  SectionHeader,
  SectionTitle,
  DetailGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  PhotoGallery,
  Photo,
  Description,
  Reason,
  ReasonTitle,
  ReasonText,
  WebsiteLink,
  GoogleMapContainer,
  MapLoadingContainer,
  MapLoadingSpinner,
  MapLoadingText,
  Button,
  ButtonRow,
  ModalProgressContainer,
  ModalProgressBarContainer,
  ModalProgressBar,
  ProgressInfo,
  ProgressLeft,
  ProgressPercentage,
  ReviewsContainer,
  ReviewItem,
  ReviewHeader,
  ReviewAuthor,
  ReviewRating,
  ReviewText
} from '../styles/ActivityStyles';

// Helper functions
const generateGoogleMapsEmbedUrl = (address, apiKey) => {
  if (!address || !apiKey) {
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=15`;
  return url;
};

const safeJsonParse = (data, fallback = []) => {
  if (!data) return fallback;

  // If it's already an array/object, return it
  if (typeof data === 'object') return data;

  // If it's a string, try to parse it
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse JSON data:', e);
      return fallback;
    }
  }

  return fallback;
};

const getPhotoUrl = (photo) => {
  if (!photo) return null;

  // Check for backend-generated photo URLs (preferred)
  if (photo.photo_url) {
    return photo.photo_url;
  }

  // Fallback: if it's already a direct URL
  if (typeof photo === 'string' && (photo.startsWith('http') || photo.startsWith('https'))) {
    return photo;
  }

  // If we only have photo_reference but no generated URL, we can't display it securely
  return null;
};

const analyzeAvailability = (responses) => {
  const availabilityData = {};
  const participantCount = {};

  responses.forEach(response => {
    const availability = response.availability || {};
    const participantName = response.user?.name || response.email || 'Anonymous';

    Object.entries(availability).forEach(([date, times]) => {
      if (!availabilityData[date]) {
        availabilityData[date] = {};
        participantCount[date] = 0;
      }
      participantCount[date]++;

      times.forEach(time => {
        if (!availabilityData[date][time]) {
          availabilityData[date][time] = [];
        }
        availabilityData[date][time].push(participantName);
      });
    });
  });

  return { availabilityData, participantCount };
};

// New styled component for enhanced phase indicator with integrated button
const EnhancedPhaseIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(20px);
  gap: 1rem;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PhaseIndicatorContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const PhaseActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }

  @media (max-width: 767px) {
    width: 100%;
    justify-content: center;
  }
`;

// Truncated review component
const TruncatedReview = ({ review, maxLength = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = review.text && review.text.length > maxLength;

  const displayText = shouldTruncate && !isExpanded
    ? review.text.substring(0, maxLength) + '...'
    : review.text;

  return (
    <ReviewItem>
      <ReviewHeader>
        <ReviewAuthor>{review.author_name || 'Anonymous'}</ReviewAuthor>
        <ReviewRating>
          {review.rating && (
            <>
              <Star size={14} fill="currentColor" />
              {review.rating}/5
            </>
          )}
        </ReviewRating>
      </ReviewHeader>
      <ReviewText style={{ textAlign: 'left' }}>
        {displayText}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontWeight: '600',
              marginLeft: '0.5rem',
              padding: 0,
              textDecoration: 'underline'
            }}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </ReviewText>
    </ReviewItem>
  );
};

const AvailabilityDisplay = ({ responses, activity }) => {
  if (!activity.allow_participant_time_selection) return null;

  const responsesWithAvailability = responses.filter(r =>
    r.availability && Object.keys(r.availability).length > 0
  );

  if (responsesWithAvailability.length === 0) {
    return (
      <AvailabilitySection>
        <AvailabilityTitle>
          <Calendar size={20} />
          Time Preferences
        </AvailabilityTitle>
        <p style={{ color: '#ccc', margin: 0 }}>
          No availability submitted yet. Participants will share their preferred times along with their preferences.
        </p>
      </AvailabilitySection>
    );
  }

  const { availabilityData, participantCount } = analyzeAvailability(responsesWithAvailability);

  return (
    <AvailabilitySection>
      <AvailabilityTitle>
        <Calendar size={20} />
        Group Availability ({responsesWithAvailability.length} responses)
      </AvailabilityTitle>

      <AvailabilityGrid>
        {responsesWithAvailability.map((response, index) => (
          <ParticipantAvailability key={index}>
            <ParticipantNameAvailability>
              {response.user?.name || response.email || 'Anonymous'}
            </ParticipantNameAvailability>
            <AvailabilityGrid>
              {Object.entries(response.availability || {}).map(([date, times]) => (
                <DateCard key={date}>
                  <DateHeader>{new Date(date).toLocaleDateString()}</DateHeader>
                  <TimeSlots>
                    {times.map((time, i) => (
                      <TimeSlot key={i}>{time}</TimeSlot>
                    ))}
                  </TimeSlots>
                </DateCard>
              ))}
            </AvailabilityGrid>
          </ParticipantAvailability>
        ))}
      </AvailabilityGrid>

      {Object.keys(availabilityData).length > 0 && (
        <OverlapAnalysis>
          <OverlapTitle>
            📊 Best Times (Most Available)
          </OverlapTitle>
          {Object.entries(availabilityData).map(([date, timeData]) => {
            const sortedTimes = Object.entries(timeData)
              .sort(([, a], [, b]) => b.length - a.length)
              .slice(0, 5);

            return (
              <DateCard key={date} style={{ marginBottom: '1rem', background: 'rgba(40, 167, 69, 0.1)' }}>
                <DateHeader style={{ color: '#28a745' }}>
                  {new Date(date).toLocaleDateString()}
                  <span style={{ fontWeight: 'normal', marginLeft: '0.5rem' }}>
                    ({participantCount[date]} participant{participantCount[date] !== 1 ? 's' : ''})
                  </span>
                </DateHeader>
                {sortedTimes.map(([time, participants]) => {
                  const percentage = (participants.length / responsesWithAvailability.length) * 100;
                  return (
                    <TimeOverlapItem key={time}>
                      <TimeText>{time}</TimeText>
                      <AvailabilityBadge $percentage={percentage}>
                        {participants.length}/{responsesWithAvailability.length} available ({Math.round(percentage)}%)
                      </AvailabilityBadge>
                    </TimeOverlapItem>
                  );
                })}
              </DateCard>
            );
          })}
        </OverlapAnalysis>
      )}
    </AvailabilitySection>
  );
};

export default function AIRecommendations({
  activity,
  pinnedActivities,
  setPinnedActivities,
  setPinned,
  setRefreshTrigger,
  isOwner,
  onEdit,
}) {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMoveToVotingModal, setShowMoveToVotingModal] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  React.useEffect(() => {
    if (mapLoading && showDetailModal) {
      const timer = setTimeout(() => {
        setMapLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [mapLoading, showDetailModal]);

  const { id, responses, activity_location, date_notes, collecting, voting, finalized, selected_pinned_activity_id } = activity;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

  // Determine activity type for dynamic text and API calls
  const activityType = activity.activity_type || 'Restaurant';
  const isCocktailsActivity = activityType === 'Cocktails';
  const isGameNightActivity = activityType === 'Game Night'; // Add this line

  // Dynamic text based on activity type
  const getActivityText = () => {
    if (isCocktailsActivity) {
      return {
        submitTitle: 'Submit Your Bar Preferences',
        submitDescription: 'Help us find the perfect bar by sharing your drink preferences and atmosphere needs',
        planningTitle: 'Bar Planning',
        votingTitle: 'Vote on Bars',
        finalizedTitle: 'Activity Finalized',
        preferencesQuiz: 'Take Bar Preferences Quiz',
        resubmitPreferences: 'Resubmit Bar Preferences',
        reasonTitle: 'Why This Bar?',
        apiEndpoint: '/api/openai/bar_recommendations'
      };
    }

    // Add Game Night case
    if (isGameNightActivity) {
      return {
        submitTitle: 'Submit Your Game Preferences',
        submitDescription: 'Help us find the perfect games by sharing your game preferences and group dynamics',
        planningTitle: 'Game Night Planning',
        votingTitle: 'Vote on Games',
        finalizedTitle: 'Game Night Finalized',
        preferencesQuiz: 'Take Game Preferences Quiz',
        resubmitPreferences: 'Resubmit Game Preferences',
        reasonTitle: 'Why This Game?',
        apiEndpoint: '/api/openai/game_recommendations'
      };
    }

    // Default Restaurant case
    return {
      submitTitle: 'Submit Your Preferences',
      submitDescription: 'Help us find the perfect restaurant by sharing your food preferences and dietary needs',
      planningTitle: 'Restaurant Planning',
      votingTitle: 'Vote on Restaurants',
      finalizedTitle: 'Activity Finalized',
      preferencesQuiz: 'Take Preferences Quiz',
      resubmitPreferences: 'Resubmit Preferences',
      reasonTitle: 'Why This Restaurant?',
      apiEndpoint: '/api/openai/restaurant_recommendations'
    };
  };

  const activityText = getActivityText();

  const allParticipants = activity.participants || [];
  const totalParticipants = allParticipants.length + 1;

  const currentUserResponse = user ? responses.find(r =>
    r.user_id === user.id || r.email === user.email
  ) : null;
  const responseRate = (responses.length / totalParticipants) * 100;

  const participantsWithVotes = new Set();
  pinnedActivities.forEach(pin => {
    (pin.voters || []).forEach(voter => {
      participantsWithVotes.add(voter.id);
    });
  });
  const votingRate = (participantsWithVotes.size / totalParticipants) * 100;

  const handleStartChat = () => {
    if (process.env.NODE_ENV === "production" && user) {
      let trackingEvent = "Chat with Voxxy Clicked";
      if (isCocktailsActivity) trackingEvent = "Bar Chat with Voxxy Clicked";
      if (isGameNightActivity) trackingEvent = "Game Night Chat with Voxxy Clicked";
      mixpanel.track(trackingEvent, { activity: id });
    }
    setShowChat(true);
  };

  const moveToVotingPhase = async () => {
    setLoading(true);
    setError("");

    try {
      // Use dynamic API endpoint based on activity type
      const res = await fetch(
        `${API_URL}${activityText.apiEndpoint}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses: responses.map(r => r.notes).join("\n\n"),
            activity_location,
            date_notes,
            activity_id: id,
          }),
        }
      );

      if (!res.ok) throw new Error("❌ Error fetching recommendations");
      const { recommendations: recs } = await res.json();

      const pinnedActivityPromises = recs.map(rec =>
        fetch(`${API_URL}/activities/${id}/pinned_activities`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pinned_activity: {
              title: rec.name,
              description: rec.description || "",
              hours: rec.hours || "",
              price_range: rec.price_range || "",
              address: rec.address || "",
              votes: [],
              voters: [],
              reason: rec.reason || "",
              website: rec.website || "",
              // Remove photos and reviews - backend will fetch them automatically
            },
          }),
        })
      );

      let pinnedTimeSlotPromises = [];
      if (activity.allow_participant_time_selection) {
        const availabilityMap = {};
        responses.forEach(response => {
          const availability = response.availability;
          if (!availability) return;

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

        pinnedTimeSlotPromises = topSlots.map(slot =>
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
      }

      const [pinnedActivityResults, pinnedTimeSlotResults] = await Promise.all([
        Promise.all(pinnedActivityPromises),
        Promise.all(pinnedTimeSlotPromises)
      ]);

      const newPinnedActivities = await Promise.all(
        pinnedActivityResults.map(res => res.json())
      );

      const newTimeSlots = await Promise.all(
        pinnedTimeSlotResults.map(res => res.json())
      );

      await fetch(`${API_URL}/activities/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collecting: false,
          voting: true
        }),
      });

      if (user && setUser) {
        setUser(prevUser => ({
          ...prevUser,
          activities: prevUser.activities.map(act =>
            act.id === id
              ? { ...act, collecting: false, voting: true }
              : act
          )
        }));
      }

      setPinnedActivities(newPinnedActivities);
      setPinned(newTimeSlots)
      setRefreshTrigger(f => !f);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowMoveToVotingModal(false);
    }
  };

  const handleLike = (pin) => {
    if (!user) return;

    if (process.env.NODE_ENV === "production") {
      mixpanel.track("Pinned Activity Voted On", { user: user.id });
    }
    const hasLiked = (pin.voters || []).some(v => v.id === user.id);

    if (hasLiked) {
      const vote = (pin.votes || []).find(v => v.user_id === user.id)
      if (!vote) return;
      fetch(`${API_URL}/pinned_activities/${pin.id}/votes/${vote.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setPinnedActivities((prev) =>
              prev.map((a) =>
                a.id === pin.id
                  ? {
                    ...a,
                    votes: data.votes,
                    voters: data.voters,
                  }
                  : a
              )
            );
            setRefreshTrigger(f => !f)
          }
        });
    } else {
      fetch(`${API_URL}/pinned_activities/${pin.id}/votes`, {
        method: "POST",
        credentials: "include",
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setPinnedActivities((prev) =>
              prev.map((a) =>
                a.id === pin.id
                  ? {
                    ...a,
                    votes: data.votes,
                    voters: data.voters,
                  }
                  : a
              )
            );
            setRefreshTrigger(f => !f)
          }
        });
    }
  };

  function openDetail(rec) {
    setSelectedRec(rec);
    setShowDetailModal(true);
    setMapLoading(true);
  }

  function closeDetail() {
    setShowDetailModal(false);
    setSelectedRec(null);
  }

  const shareUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${activity.id}/share`;
  const sharePlanUrlClick = () => {
    window.open(
      shareUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (loading) return <LoadingScreenUser autoDismiss={false} />;

  if (collecting && !voting) {
    return (
      <Container>
        <TopBar>
          <Heading>{activityText.submitTitle}</Heading>
        </TopBar>

        {error && <ErrorText>{error}</ErrorText>}

        <EnhancedPhaseIndicator>
          <PhaseIndicatorContent>
            <PhaseIcon><HelpCircle size={24} /></PhaseIcon>
            <PhaseContent>
              <PhaseTitle>Group Status</PhaseTitle>
              <PhaseSubtitle>
                {responses.length}/{totalParticipants} participants have submitted
                {activity.allow_participant_time_selection && " preferences & availability"}
              </PhaseSubtitle>
            </PhaseContent>
          </PhaseIndicatorContent>

          {isOwner && (
            <PhaseActionButton onClick={() => setShowMoveToVotingModal(true)}>
              <Vote size={20} />
              Move to Voting Phase
            </PhaseActionButton>
          )}
        </EnhancedPhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={responseRate} />
        </ProgressBarContainer>

        <AvailabilityDisplay responses={responses} activity={activity} />

        {user && !currentUserResponse ? (
          <PreferencesCard>
            <PreferencesIcon><BookHeart size={48} /></PreferencesIcon>
            <PreferencesTitle>Submit Your Preferences!</PreferencesTitle>
            <PreferencesText>
              {activityText.submitDescription}
              {activity.allow_participant_time_selection && " and your availability"}.
            </PreferencesText>
            <PreferencesButton onClick={handleStartChat}>
              <HelpCircle size={20} />
              {activity.allow_participant_time_selection ? `${activityText.preferencesQuiz} & Availability` : activityText.preferencesQuiz}
            </PreferencesButton>
          </PreferencesCard>
        ) : user && currentUserResponse ? (
          <SubmittedCard>
            <SubmittedIcon><CheckCircle size={48} /></SubmittedIcon>
            <SubmittedTitle>Thank you for submitting your response!</SubmittedTitle>
            <SubmittedText>
              The organizer will gather recommendations shortly. You can resubmit your preferences
              {activity.allow_participant_time_selection && " and availability"} if you'd like to make changes.
            </SubmittedText>
            <ResubmitButton onClick={handleStartChat}>
              <HelpCircle size={18} />
              {activity.allow_participant_time_selection ? `${activityText.resubmitPreferences} & Availability` : activityText.resubmitPreferences}
            </ResubmitButton>
          </SubmittedCard>
        ) : null}

        {/* Updated chat component rendering */}
        {showChat && user && (
          <>
            <DimOverlay onClick={() => setShowChat(false)} />
            {isCocktailsActivity ? (
              <BarChat
                activityId={id}
                onClose={() => setShowChat(false)}
                onChatComplete={async () => {
                  setRefreshTrigger(f => !f);
                  setShowChat(false);
                }}
              />
            ) : isGameNightActivity ? (
              <GameNightPreferenceChat
                activityId={id}
                onClose={() => setShowChat(false)}
                onChatComplete={async () => {
                  setRefreshTrigger(f => !f);
                  setShowChat(false);
                }}
              />
            ) : (
              <CuisineChat
                activityId={id}
                onClose={() => setShowChat(false)}
                onChatComplete={async () => {
                  setRefreshTrigger(f => !f);
                  setShowChat(false);
                }}
              />
            )}
          </>
        )}

        {showMoveToVotingModal && (
          <ModalOverlay onClick={() => setShowMoveToVotingModal(false)}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Move to voting phase?</ModalTitle>
                <ModalSubtitle>Generate recommendations and start group voting</ModalSubtitle>
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
                        <span>{responses.length}/{totalParticipants} users submitted</span>
                      </ProgressLeft>
                      <ProgressPercentage>{Math.round(responseRate)}%</ProgressPercentage>
                    </ProgressInfo>
                  </ModalProgressContainer>

                  {responseRate < 50 && (
                    <WarningBox>
                      <span>⚠️ Less than 50% of participants have submitted their preferences. Consider waiting for more responses to get better recommendations.</span>
                    </WarningBox>
                  )}
                </Section>

                <ButtonRow>
                  <Button onClick={() => setShowMoveToVotingModal(false)}>
                    Cancel
                  </Button>
                  <Button $primary onClick={moveToVotingPhase}>
                    <Zap size={16} />
                    Generate Recommendations
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
          <Heading>{activityText.votingTitle}</Heading>
        </TopBar>

        <EnhancedPhaseIndicator>
          <PhaseIndicatorContent>
            <PhaseIcon><Vote size={24} /></PhaseIcon>
            <PhaseContent>
              <PhaseTitle>Voting Phase</PhaseTitle>
              <PhaseSubtitle>{participantsWithVotes.size}/{totalParticipants} participants have voted. After everyone has voted, your organizer can finalize the activity plans. ✨</PhaseSubtitle>
            </PhaseContent>
          </PhaseIndicatorContent>

          {isOwner && (
            <PhaseActionButton onClick={onEdit}>
              <Flag size={20} />
              Finalize Activity
            </PhaseActionButton>
          )}
        </EnhancedPhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={votingRate} />
        </ProgressBarContainer>

        {error && <ErrorText>{error}</ErrorText>}

        <RecommendationsList>
          {[...pinnedActivities]
            .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
            .map((p) => (
              <ListItem key={p.id}>
                <ContentWrapper onClick={() => openDetail(p)}>
                  <ListTop>
                    <ListName>{p.title}</ListName>
                    <ListMeta>{p.price_range || "N/A"}</ListMeta>
                  </ListTop>
                  <ListBottom>
                    <div style={{ textAlign: 'left' }}>
                      {isGameNightActivity ? (
                        <>
                          <div>{p.hours || "N/A"}</div> {/* Play time */}
                          <div>{p.address || "N/A"}</div> {/* Player count */}
                        </>
                      ) : (
                        <>
                          <div>{p.hours || "N/A"}</div>
                          <div>{p.address || "N/A"}</div>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {user && (
                        <LikeButton
                          onClick={e => { e.stopPropagation(); handleLike(p); }}
                          $liked={(p.voters || []).some(v => v.id === user.id)}
                        >
                          {(p.voters || []).some(v => v.id === user.id) ? "❤️" : "🤍"} {(p.votes || []).length}
                        </LikeButton>
                      )}
                      {!user && (
                        <VoteCount>
                          ❤️ {(p.votes || []).length}
                        </VoteCount>
                      )}
                    </div>
                  </ListBottom>
                </ContentWrapper>
              </ListItem>
            ))}
        </RecommendationsList>

        {showDetailModal && selectedRec && (
          <ModalOverlay onClick={closeDetail}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{selectedRec.title || selectedRec.name}</ModalTitle>
                <CloseButton onClick={closeDetail}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <DetailGrid>
                  {isGameNightActivity ? (
                    // Game-specific details
                    <>
                      <DetailItem>
                        <Users size={16} />
                        <DetailLabel>Players:</DetailLabel>
                        <DetailValue>{selectedRec.address || "N/A"}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <Clock size={16} />
                        <DetailLabel>Play Time:</DetailLabel>
                        <DetailValue>{selectedRec.hours || "N/A"}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DollarSign style={{ color: '#D4AF37' }} size={16} />
                        <DetailLabel>Price:</DetailLabel>
                        <DetailValue>{selectedRec.price_range || "N/A"}</DetailValue>
                      </DetailItem>
                    </>
                  ) : (
                    // Restaurant/Bar details (existing)
                    <>
                      <DetailItem>
                        <DollarSign style={{ color: '#D4AF37' }} size={16} />
                        <DetailLabel>Price:</DetailLabel>
                        <DetailValue>{selectedRec.price_range || "N/A"}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <Clock size={16} />
                        <DetailLabel>Hours:</DetailLabel>
                        <DetailValue>{selectedRec.hours || "N/A"}</DetailValue>
                      </DetailItem>
                    </>
                  )}
                </DetailGrid>

                {selectedRec.description && (
                  <Section>
                    <SectionHeader>
                      <HelpCircle size={20} />
                      <SectionTitle>About</SectionTitle>
                    </SectionHeader>
                    <Description>
                      {selectedRec.description}
                      {selectedRec.website && (
                        <>
                          <br /><br />
                          <WebsiteLink href={selectedRec.website} target="_blank" rel="noopener noreferrer">
                            <Globe size={16} />
                            Visit Website
                            <ExternalLink size={14} />
                          </WebsiteLink>
                        </>
                      )}
                    </Description>
                  </Section>
                )}

                {selectedRec.reason && (
                  <Reason style={{ marginBottom: '1rem' }}>
                    <ReasonTitle>{activityText.reasonTitle}</ReasonTitle>
                    <ReasonText>{selectedRec.reason}</ReasonText>
                  </Reason>
                )}

                {/* Conditionally show location/map section only for non-game activities */}
                {!isGameNightActivity && selectedRec.address && (
                  <Section>
                    <SectionHeader>
                      <MapPin size={20} />
                      <SectionTitle>Location</SectionTitle>
                    </SectionHeader>
                    <Description>{selectedRec.address}</Description>

                    {GOOGLE_MAPS_API_KEY ? (
                      <div style={{ position: 'relative' }}>
                        {mapLoading && (
                          <MapLoadingContainer>
                            <MapLoadingSpinner />
                            <MapLoadingText>Loading map...</MapLoadingText>
                          </MapLoadingContainer>
                        )}
                        <GoogleMapContainer style={{ display: mapLoading ? 'none' : 'block' }}>
                          <iframe
                            title={`Map showing location of ${selectedRec.title || selectedRec.name}`}
                            src={generateGoogleMapsEmbedUrl(selectedRec.address, GOOGLE_MAPS_API_KEY)}
                            allowFullScreen
                            loading="lazy"
                            onLoad={() => {
                              console.log('Map iframe loaded');
                              setTimeout(() => setMapLoading(false), 500);
                            }}
                            onError={() => {
                              console.log('Map failed to load');
                              setMapLoading(false);
                            }}
                          />
                        </GoogleMapContainer>
                      </div>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: '0.75rem',
                        color: '#ffc107',
                        fontSize: '0.85rem',
                        marginTop: '1rem'
                      }}>
                        ⚠️ Google Maps API key not found. Check your environment variables.
                      </div>
                    )}
                  </Section>
                )}

                {/* Enhanced photos section with backend-generated URLs - hide for games */}
                {!isGameNightActivity && (() => {
                  const photos = safeJsonParse(selectedRec.photos, []);
                  const validPhotos = photos.filter(photo => getPhotoUrl(photo));

                  return validPhotos.length > 0 && (
                    <Section>
                      <SectionHeader>
                        <span>📸</span>
                        <SectionTitle>Photos ({validPhotos.length})</SectionTitle>
                      </SectionHeader>
                      <PhotoGallery>
                        {validPhotos.map((photo, i) => {
                          const photoUrl = getPhotoUrl(photo);
                          return (
                            <Photo
                              key={i}
                              src={photoUrl}
                              alt={`Photo of ${selectedRec.title || selectedRec.name}`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          );
                        })}
                      </PhotoGallery>
                    </Section>
                  );
                })()}

                {!isGameNightActivity && (() => {
                  const reviews = safeJsonParse(selectedRec.reviews, []);
                  return reviews.length > 0 && (
                    <Section>
                      <SectionHeader>
                        <Star size={20} />
                        <SectionTitle>Reviews</SectionTitle>
                      </SectionHeader>
                      <ReviewsContainer>
                        {reviews.slice(0, 3).map((review, i) => (
                          <TruncatedReview key={i} review={review} />
                        ))}
                      </ReviewsContainer>
                    </Section>
                  );
                })()}
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
          <Heading>{activityText.finalizedTitle}</Heading>
        </TopBar>

        <PhaseIndicator style={{ cursor: 'pointer' }} onClick={sharePlanUrlClick}>
          <PhaseIcon><Share size={24} /> </PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Share Finalized Activity Link!</PhaseTitle>
            <PhaseSubtitle>Click here to view & share finalized activity.</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        {error && <ErrorText>{error}</ErrorText>}

        <RecommendationsList>
          {[...pinnedActivities]
            .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
            .map((p) => {
              const isSelected = p.id === selected_pinned_activity_id;
              return (
                <ListItem key={p.id} $selected={isSelected}>
                  {isSelected && (
                    <SelectedBadge>
                      <CheckCircle size={16} />
                      <span>SELECTED</span>
                    </SelectedBadge>
                  )}
                  <ContentWrapper onClick={() => openDetail(p)}>
                    <ListTop>
                      <ListName>{p.title}</ListName>
                      <ListMeta>{p.price_range || "N/A"}</ListMeta>
                    </ListTop>
                    <ListBottom>
                      <div style={{ textAlign: 'left' }}>
                        {isGameNightActivity ? (
                          <>
                            <div>{p.hours || "N/A"}</div> {/* Play time */}
                            <div>{p.address || "N/A"}</div> {/* Player count */}
                          </>
                        ) : (
                          <>
                            <div>{p.hours || "N/A"}</div>
                            <div>{p.address || "N/A"}</div>
                          </>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <VoteCount>
                          ❤️ {(p.votes || []).length}
                        </VoteCount>
                      </div>
                    </ListBottom>
                  </ContentWrapper>
                </ListItem>
              );
            })}
        </RecommendationsList>

        {showDetailModal && selectedRec && (
          <ModalOverlay onClick={closeDetail}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{selectedRec.title || selectedRec.name}</ModalTitle>
                <CloseButton onClick={closeDetail}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <DetailGrid>
                  {isGameNightActivity ? (
                    <>
                      <DetailItem>
                        <Users size={16} />
                        <DetailLabel>Players:</DetailLabel>
                        <DetailValue>{selectedRec.address || "N/A"}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <Clock size={16} />
                        <DetailLabel>Play Time:</DetailLabel>
                        <DetailValue>{selectedRec.hours || "N/A"}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DollarSign style={{ color: '#D4AF37' }} size={16} />
                        <DetailLabel>Price:</DetailLabel>
                        <DetailValue>{selectedRec.price_range || "N/A"}</DetailValue>
                      </DetailItem>
                    </>
                  ) : (
                    <>
                      <DetailItem>
                        <DollarSign style={{ color: '#D4AF37' }} size={16} />
                        <DetailLabel>Price:</DetailLabel>
                        <DetailValue>{selectedRec.price_range || "N/A"}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <Clock size={16} />
                        <DetailLabel>Hours:</DetailLabel>
                        <DetailValue>{selectedRec.hours || "N/A"}</DetailValue>
                      </DetailItem>
                    </>
                  )}
                </DetailGrid>

                {selectedRec.description && (
                  <Section>
                    <SectionHeader>
                      <HelpCircle size={20} />
                      <SectionTitle>About</SectionTitle>
                    </SectionHeader>
                    <Description>
                      {selectedRec.description}
                      {selectedRec.website && (
                        <>
                          <br /><br />
                          <WebsiteLink href={selectedRec.website} target="_blank" rel="noopener noreferrer">
                            <Globe size={16} />
                            Visit Website
                            <ExternalLink size={14} />
                          </WebsiteLink>
                        </>
                      )}
                    </Description>
                  </Section>
                )}

                {selectedRec.reason && (
                  <Reason style={{ marginBottom: '1rem' }}>
                    <ReasonTitle>{activityText.reasonTitle}</ReasonTitle>
                    <ReasonText>{selectedRec.reason}</ReasonText>
                  </Reason>
                )}

                {/* Conditionally show location section only for non-game activities */}
                {!isGameNightActivity && selectedRec.address && (
                  <Section>
                    <SectionHeader>
                      <MapPin size={20} />
                      <SectionTitle>Location</SectionTitle>
                    </SectionHeader>
                    <Description>{selectedRec.address}</Description>

                    {GOOGLE_MAPS_API_KEY ? (
                      <div style={{ position: 'relative' }}>
                        {mapLoading && (
                          <MapLoadingContainer>
                            <MapLoadingSpinner />
                            <MapLoadingText>Loading map...</MapLoadingText>
                          </MapLoadingContainer>
                        )}
                        <GoogleMapContainer style={{ display: mapLoading ? 'none' : 'block' }}>
                          <iframe
                            title={`Map showing location of ${selectedRec.title || selectedRec.name}`}
                            src={generateGoogleMapsEmbedUrl(selectedRec.address, GOOGLE_MAPS_API_KEY)}
                            allowFullScreen
                            loading="lazy"
                            onLoad={() => {
                              console.log('Map iframe loaded');
                              setTimeout(() => setMapLoading(false), 500);
                            }}
                            onError={() => {
                              console.log('Map failed to load');
                              setMapLoading(false);
                            }}
                          />
                        </GoogleMapContainer>
                      </div>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: '0.75rem',
                        color: '#ffc107',
                        fontSize: '0.85rem',
                        marginTop: '1rem'
                      }}>
                        ⚠️ Google Maps API key not found. Check your environment variables.
                      </div>
                    )}
                  </Section>
                )}

                {/* Enhanced photos section for finalized view - hide for games */}
                {!isGameNightActivity && (() => {
                  const photos = safeJsonParse(selectedRec.photos, []);
                  const validPhotos = photos.filter(photo => getPhotoUrl(photo));

                  return validPhotos.length > 0 && (
                    <Section>
                      <SectionHeader>
                        <span>📸</span>
                        <SectionTitle>Photos ({validPhotos.length})</SectionTitle>
                      </SectionHeader>
                      <PhotoGallery>
                        {validPhotos.map((photo, i) => {
                          const photoUrl = getPhotoUrl(photo);
                          return (
                            <Photo
                              key={i}
                              src={photoUrl}
                              alt={`Photo of ${selectedRec.title || selectedRec.name}`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          );
                        })}
                      </PhotoGallery>
                    </Section>
                  );
                })()}

                {!isGameNightActivity && (() => {
                  const reviews = safeJsonParse(selectedRec.reviews, []);
                  return reviews.length > 0 && (
                    <Section>
                      <SectionHeader>
                        <Star size={20} />
                        <SectionTitle>Reviews</SectionTitle>
                      </SectionHeader>
                      <ReviewsContainer>
                        {reviews.slice(0, 3).map((review, i) => (
                          <TruncatedReview key={i} review={review} />
                        ))}
                      </ReviewsContainer>
                    </Section>
                  );
                })()}
              </ModalBody>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <TopBar>
        <Heading>{activityText.planningTitle}</Heading>
      </TopBar>
      <p>Activity is not in collecting or voting phase.</p>
    </Container>
  );
}