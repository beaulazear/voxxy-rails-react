// components/AIRecommendations.js
import React, { useState, useContext } from "react";
import styled from 'styled-components';
import CuisineChat from "./CuisineChat";
import BarChat from "../cocktails//BarChat";
import GameNightPreferenceChat from "../gamenight/GameNightPreferenceChat"; // Add this import
import LoadingScreenUser from "./LoadingScreenUser.js";
import mixpanel from "mixpanel-browser";
import { UserContext } from "../context/user";
import { Users, Share, HelpCircle, CheckCircle, Clock, Vote, BookHeart, Flag, X, ExternalLink, MapPin, DollarSign, Globe, Zap, Calendar, Star, Heart, ChevronRight } from 'lucide-react';

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

const renderDetailGrid = (selectedRec, isGameNightActivity) => (
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
);

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

  if (photo.photo_url) {
    return photo.photo_url;
  }

  if (typeof photo === 'string' && (photo.startsWith('http') || photo.startsWith('https'))) {
    return photo;
  }

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

// Modern Card-Based Styles for Desktop
const RecommendationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin: 2rem 0;
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;

const RecommendationCard = styled.div`
  background: linear-gradient(135deg, #3A2D44 0%, #2C1E33 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  color: #fff;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
  line-height: 1.3;
`;

const CardBadge = styled.span`
  background: rgba(212, 175, 55, 0.2);
  color: #D4AF37;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-left: 12px;
`;

const CardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
`;

const CardMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  
  svg {
    color: #667eea;
    flex-shrink: 0;
  }
`;

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  flex-grow: 1;
`;

const CardReason = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
`;

const CardReasonTitle = styled.h4`
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CardReasonText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const CardActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.like {
    border-color: ${props => props.$liked ? '#28a745' : 'rgba(255, 255, 255, 0.2)'};
    color: ${props => props.$liked ? '#28a745' : 'rgba(255, 255, 255, 0.6)'};
    background: ${props => props.$liked ? 'rgba(40, 167, 69, 0.2)' : 'transparent'};
    
    &:hover {
      border-color: #28a745;
      color: #28a745;
      background: rgba(40, 167, 69, 0.2);
      transform: scale(1.1);
    }
  }
  
  &.flag {
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    
    &:hover {
      border-color: #ffc107;
      color: #ffc107;
      background: rgba(255, 193, 7, 0.2);
      transform: scale(1.1);
    }
  }
  
  &.favorite {
    &:hover {
      transform: scale(1.1);
    }
  }
`;

const VoteDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  
  svg {
    color: #e74c3c;
  }
`;

const ViewDetailsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(102, 126, 234, 0.2);
    transform: translateY(-1px);
  }
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #28a745;
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
`;

const ResultsSummary = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin: 2rem 0;
`;

const ResultsTitle = styled.h3`
  color: #fff;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateX(4px);
  }
`;

const ResultItemName = styled.span`
  color: #fff;
  font-weight: 500;
  flex: 1;
`;

const ResultItemBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  
  &.liked {
    background: rgba(40, 167, 69, 0.2);
    color: #28a745;
  }
  
  &.favorite {
    background: rgba(212, 175, 55, 0.2);
    color: #D4AF37;
  }
`;

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
  
  // Add state management for recommendations tracking like mobile
  const [likedRecommendations, setLikedRecommendations] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [flaggedRecommendations, setFlaggedRecommendations] = useState([]);
  const [favoriteRecommendations, setFavoriteRecommendations] = useState([]);

  const { id, responses, activity_location, date_notes, collecting, voting, finalized, selected_pinned_activity_id } = activity;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
  
  // Helper function to handle API calls with error handling
  const safeApiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

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

  const updatePinnedActivityVotes = (pinId, data) => {
    setPinnedActivities((prev) =>
      prev.map((a) =>
        a.id === pinId
          ? { ...a, votes: data.votes, voters: data.voters }
          : a
      )
    );
    setRefreshTrigger(f => !f);
  };

  const handleLike = async (pin) => {
    if (!user) return;

    if (process.env.NODE_ENV === "production") {
      mixpanel.track("Pinned Activity Voted On", { user: user.id });
    }
    
    const hasLiked = (pin.voters || []).some(v => v.id === user.id);
    const vote = hasLiked ? (pin.votes || []).find(v => v.user_id === user.id) : null;

    try {
      let data;
      if (hasLiked && vote) {
        data = await safeApiCall(`${API_URL}/pinned_activities/${pin.id}/votes/${vote.id}`, {
          method: "DELETE",
        });
        // Remove from liked recommendations
        setLikedRecommendations(prev => prev.filter(rec => rec.id !== pin.id));
      } else if (!hasLiked) {
        data = await safeApiCall(`${API_URL}/pinned_activities/${pin.id}/votes`, {
          method: "POST",
        });
        // Add to liked recommendations
        setLikedRecommendations(prev => {
          if (!prev.some(rec => rec.id === pin.id)) {
            return [...prev, pin];
          }
          return prev;
        });
      }
      
      if (data.success) updatePinnedActivityVotes(pin.id, data);
    } catch (error) {
      setError('Failed to update vote. Please try again.');
    }
  };
  
  const handleFlag = async (pin) => {
    if (!user) return;
    
    try {
      await safeApiCall(`${API_URL}/pinned_activities/${pin.id}/toggle_flag`, {
        method: 'POST',
      });
      
      // Add to flagged recommendations
      setFlaggedRecommendations(prev => {
        if (!prev.some(rec => rec.id === pin.id)) {
          return [...prev, pin];
        }
        return prev;
      });
      
      // Remove from liked if it was liked
      setLikedRecommendations(prev => prev.filter(rec => rec.id !== pin.id));
      
      alert('Recommendation flagged successfully.');
      
    } catch (error) {
      console.error('Error flagging recommendation:', error);
      setError('Failed to flag recommendation. Please try again.');
    }
  };
  
  const handleFavorite = async (pin) => {
    if (!user) return;
    
    try {
      await safeApiCall(`${API_URL}/pinned_activities/${pin.id}/toggle_favorite`, {
        method: 'POST',
      });
      
      const isFavorite = favoriteRecommendations.some(rec => rec.id === pin.id);
      
      if (isFavorite) {
        // Remove from favorites
        setFavoriteRecommendations(prev => prev.filter(rec => rec.id !== pin.id));
      } else {
        // Add to favorites and automatically like it
        setFavoriteRecommendations(prev => {
          if (!prev.some(rec => rec.id === pin.id)) {
            return [...prev, { ...pin, isFavorite: true }];
          }
          return prev;
        });
        
        // Automatically like when favoriting (like mobile)
        const hasLiked = (pin.voters || []).some(v => v.id === user.id);
        if (!hasLiked) {
          handleLike(pin);
        }
      }
      
    } catch (error) {
      console.error('Error favoriting recommendation:', error);
      setError('Failed to favorite recommendation. Please try again.');
    }
  };
  
  const handleCompleteActivity = async () => {
    if (favoriteRecommendations.length === 0) {
      alert('Please mark at least one recommendation as a favorite before completing.');
      return;
    }
    
    const confirmComplete = window.confirm(
      `Save ${favoriteRecommendations.length} favorite${favoriteRecommendations.length !== 1 ? 's' : ''} and mark this activity as completed?`
    );
    
    if (!confirmComplete) return;
    
    try {
      // Mark activity as completed
      await safeApiCall(`${API_URL}/activities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          completed: true,
          voting: false
        }),
      });
      
      alert('Activity completed successfully! Your favorites have been saved.');
      setRefreshTrigger(f => !f);
      
    } catch (error) {
      console.error('Error completing activity:', error);
      setError('Failed to complete activity. Please try again.');
    }
  };

  function openDetail(rec) {
    setSelectedRec(rec);
    setShowDetailModal(true);
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
              <PhaseTitle>Collecting Preferences</PhaseTitle>
              <PhaseSubtitle>
                {responses.length}/{totalParticipants} submitted
              </PhaseSubtitle>
            </PhaseContent>
          </PhaseIndicatorContent>

          {isOwner && (
            <PhaseActionButton onClick={() => setShowMoveToVotingModal(true)}>
              <Vote size={20} />
              Generate Recommendations
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
              <PhaseTitle>Vote on Recommendations</PhaseTitle>
              <PhaseSubtitle>
                {favoriteRecommendations.length > 0 
                  ? `${favoriteRecommendations.length} favorite${favoriteRecommendations.length !== 1 ? 's' : ''} selected` 
                  : 'Like and favorite recommendations to complete'
                }
              </PhaseSubtitle>
            </PhaseContent>
          </PhaseIndicatorContent>

          <div style={{ display: 'flex', gap: '12px' }}>
            {user && favoriteRecommendations.length > 0 && (
              <PhaseActionButton 
                onClick={handleCompleteActivity}
                style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}
              >
                <CheckCircle size={20} />
                Complete Activity
              </PhaseActionButton>
            )}
            {isOwner && (
              <PhaseActionButton onClick={onEdit}>
                <Flag size={20} />
                Finalize for Group
              </PhaseActionButton>
            )}
          </div>
        </EnhancedPhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={votingRate} />
        </ProgressBarContainer>

        {error && <ErrorText>{error}</ErrorText>}

        <RecommendationsGrid>
          {[...pinnedActivities]
            .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
            .map((p) => (
              <RecommendationCard key={p.id} onClick={() => openDetail(p)}>
                <CardHeader>
                  <CardTitle>{p.title}</CardTitle>
                  <CardBadge>{p.price_range || "$"}</CardBadge>
                </CardHeader>
                
                <CardMeta>
                  {isGameNightActivity ? (
                    <>
                      <CardMetaItem>
                        <Users size={16} />
                        <span>Players: {p.address || "N/A"}</span>
                      </CardMetaItem>
                      <CardMetaItem>
                        <Clock size={16} />
                        <span>Play Time: {p.hours || "N/A"}</span>
                      </CardMetaItem>
                    </>
                  ) : (
                    <>
                      <CardMetaItem>
                        <Clock size={16} />
                        <span>{p.hours || "Hours not available"}</span>
                      </CardMetaItem>
                      <CardMetaItem>
                        <MapPin size={16} />
                        <span>{p.address || "Address not available"}</span>
                      </CardMetaItem>
                    </>
                  )}
                </CardMeta>
                
                {p.description && (
                  <CardDescription>{p.description}</CardDescription>
                )}
                
                {p.reason && (
                  <CardReason>
                    <CardReasonTitle>
                      <Zap size={14} />
                      Why this choice?
                    </CardReasonTitle>
                    <CardReasonText>{p.reason}</CardReasonText>
                  </CardReason>
                )}
                
                <CardFooter>
                  <ViewDetailsButton onClick={(e) => { e.stopPropagation(); openDetail(p); }}>
                    View Details
                    <ChevronRight size={14} />
                  </ViewDetailsButton>
                  
                  <CardActions>
                    {user && (
                      <>
                        <CardActionButton
                          className="like"
                          onClick={(e) => { e.stopPropagation(); handleLike(p); }}
                          $liked={(p.voters || []).some(v => v.id === user.id)}
                        >
                          <Heart size={18} fill={(p.voters || []).some(v => v.id === user.id) ? "currentColor" : "none"} />
                        </CardActionButton>
                        <CardActionButton
                          className="favorite"
                          onClick={(e) => { e.stopPropagation(); handleFavorite(p); }}
                          $favorited={favoriteRecommendations.some(rec => rec.id === p.id)}
                          style={{ 
                            borderColor: favoriteRecommendations.some(rec => rec.id === p.id) ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)',
                            color: favoriteRecommendations.some(rec => rec.id === p.id) ? '#D4AF37' : 'rgba(255, 255, 255, 0.6)',
                            background: favoriteRecommendations.some(rec => rec.id === p.id) ? 'rgba(212, 175, 55, 0.2)' : 'transparent'
                          }}
                        >
                          <Star size={18} fill={favoriteRecommendations.some(rec => rec.id === p.id) ? "currentColor" : "none"} />
                        </CardActionButton>
                        <CardActionButton
                          className="flag"
                          onClick={(e) => { e.stopPropagation(); handleFlag(p); }}
                        >
                          <Flag size={18} />
                        </CardActionButton>
                      </>
                    )}
                  </CardActions>
                  
                  <VoteDisplay>
                    <Heart size={14} />
                    {(p.votes || []).length} votes
                  </VoteDisplay>
                </CardFooter>
              </RecommendationCard>
            ))}
        </RecommendationsGrid>
        
        {/* Show user's selections summary */}
        {user && (likedRecommendations.length > 0 || favoriteRecommendations.length > 0) && (
          <ResultsSummary>
            <ResultsTitle>
              <CheckCircle size={20} />
              Your Selections
            </ResultsTitle>
            
            {favoriteRecommendations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#D4AF37', margin: '0 0 8px 0', fontSize: '0.95rem' }}>❤️ Favorites ({favoriteRecommendations.length})</h4>
                <ResultsList>
                  {favoriteRecommendations.map((rec) => (
                    <ResultItem key={`fav-${rec.id}`} onClick={() => openDetail(rec)}>
                      <ResultItemName>{rec.title}</ResultItemName>
                      <ResultItemBadge className="favorite">
                        <Star size={12} />
                        Favorite
                      </ResultItemBadge>
                    </ResultItem>
                  ))}
                </ResultsList>
              </div>
            )}
            
            {likedRecommendations.filter(rec => !favoriteRecommendations.some(fav => fav.id === rec.id)).length > 0 && (
              <div>
                <h4 style={{ color: '#28a745', margin: '0 0 8px 0', fontSize: '0.95rem' }}>👍 Liked ({likedRecommendations.filter(rec => !favoriteRecommendations.some(fav => fav.id === rec.id)).length})</h4>
                <ResultsList>
                  {likedRecommendations
                    .filter(rec => !favoriteRecommendations.some(fav => fav.id === rec.id))
                    .map((rec) => (
                    <ResultItem key={`liked-${rec.id}`} onClick={() => openDetail(rec)}>
                      <ResultItemName>{rec.title}</ResultItemName>
                      <ResultItemBadge className="liked">
                        <Heart size={12} />
                        Liked
                      </ResultItemBadge>
                    </ResultItem>
                  ))}
                </ResultsList>
              </div>
            )}
          </ResultsSummary>
        )}

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
                {renderDetailGrid(selectedRec, isGameNightActivity)}

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

                {/* Show address for non-game activities */}
                {!isGameNightActivity && selectedRec.address && (
                  <Section>
                    <SectionHeader>
                      <MapPin size={20} />
                      <SectionTitle>Location</SectionTitle>
                    </SectionHeader>
                    <Description>{selectedRec.address}</Description>
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

        <RecommendationsGrid>
          {[...pinnedActivities]
            .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
            .map((p) => {
              const isSelected = p.id === selected_pinned_activity_id;
              return (
                <RecommendationCard 
                  key={p.id} 
                  onClick={() => openDetail(p)}
                  style={{ 
                    border: isSelected ? '2px solid #28a745' : 'none',
                    position: 'relative'
                  }}
                >
                  {isSelected && (
                    <SelectedBadge>
                      <CheckCircle size={14} />
                      SELECTED
                    </SelectedBadge>
                  )}
                  <CardHeader>
                    <CardTitle>{p.title}</CardTitle>
                    <CardBadge>{p.price_range || "$"}</CardBadge>
                  </CardHeader>
                  
                  <CardMeta>
                    {isGameNightActivity ? (
                      <>
                        <CardMetaItem>
                          <Users size={16} />
                          <span>Players: {p.address || "N/A"}</span>
                        </CardMetaItem>
                        <CardMetaItem>
                          <Clock size={16} />
                          <span>Play Time: {p.hours || "N/A"}</span>
                        </CardMetaItem>
                      </>
                    ) : (
                      <>
                        <CardMetaItem>
                          <Clock size={16} />
                          <span>{p.hours || "Hours not available"}</span>
                        </CardMetaItem>
                        <CardMetaItem>
                          <MapPin size={16} />
                          <span>{p.address || "Address not available"}</span>
                        </CardMetaItem>
                      </>
                    )}
                  </CardMeta>
                  
                  {p.description && (
                    <CardDescription>{p.description}</CardDescription>
                  )}
                  
                  {p.reason && (
                    <CardReason>
                      <CardReasonTitle>
                        <Zap size={14} />
                        Why this choice?
                      </CardReasonTitle>
                      <CardReasonText>{p.reason}</CardReasonText>
                    </CardReason>
                  )}
                  
                  <CardFooter>
                    <ViewDetailsButton onClick={(e) => { e.stopPropagation(); openDetail(p); }}>
                      View Details
                      <ChevronRight size={14} />
                    </ViewDetailsButton>
                    
                    <VoteDisplay>
                      <Heart size={14} />
                      {(p.votes || []).length} votes
                    </VoteDisplay>
                  </CardFooter>
                </RecommendationCard>
              );
            })}
        </RecommendationsGrid>

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
                {renderDetailGrid(selectedRec, isGameNightActivity)}

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

                {/* Show address for non-game activities */}
                {!isGameNightActivity && selectedRec.address && (
                  <Section>
                    <SectionHeader>
                      <MapPin size={20} />
                      <SectionTitle>Location</SectionTitle>
                    </SectionHeader>
                    <Description>{selectedRec.address}</Description>
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