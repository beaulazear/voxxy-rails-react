import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  ChatButton,
  StyledButton,
  DimmedOverlay,
} from "../styles/ActivityDetailsStyles";
import RestaurantMap from "./RestaurantMap";
import CuisineChat from "./CuisineChat";
import PinnedActivityCard from "./PinnedActivityCard";
import LoadingScreenUser from "./LoadingScreenUser";
import mixpanel from 'mixpanel-browser';

const AIRecommendations = ({
  activity,
  setPinnedActivities,
  setRefreshTrigger,
  pinnedActivities,
  isOwner,
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [selectedRecForReviews, setSelectedRecForReviews] = useState(null);

  const { id, responses, activity_location, date_notes } = activity;

  useEffect(() => {
    const loadCache = async () => {
      setLoading(true);
      console.log('starting cache check')
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const res = await fetch(
          `${API_URL}/check_cached_recommendations?activity_id=${id}`,
          { credentials: "include" }
        );
        if (res.ok) {
          console.log('cache check ok')
          const data = await res.json();
          console.log(data)
          if (data.recommendations?.length) {
            const cached = data.recommendations.filter(
              rec => !pinnedActivities.some(p => p.title === rec.name)
            );
            console.log('cache', cached)
            setRecommendations(cached);
          }
        }
      } catch (err) {
        console.warn("Cache fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCache();
  }, [id, pinnedActivities, activity_location, date_notes]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!responses?.length) {
        return alert("No responses found—using trending instead.");
      }
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/openai/restaurant_recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          responses: responses.map(r => r.notes).join("\n\n"),
          activity_location,
          date_notes,
          activity_id: activity.id,
        }),
      });
      if (!res.ok) throw new Error(res.status === 429
        ? "⚠️ Rate limit—try again later."
        : "❌ Error fetching recommendations."
      );
      const { recommendations: dataRecs } = await res.json();
      const fresh = dataRecs.filter(
        rec => !pinnedActivities.some(p => p.title === rec.name)
      );
      setRecommendations(fresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [responses, activity_location, date_notes, pinnedActivities]);

  const fetchTrendingRecommendations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/openai/trending_recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          activity_location,
          date_notes,
          activity_id: activity.id,
        }),
      });
      if (!res.ok) throw new Error(res.status === 429
        ? "⚠️ Rate limit—try again later."
        : "❌ Error fetching trending recommendations."
      );
      const { recommendations: dataRecs } = await res.json();
      const fresh = dataRecs.filter(
        rec => !pinnedActivities.some(p => p.title === rec.name)
      );
      setRecommendations(fresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activity_location, date_notes, pinnedActivities]);

  const handlePinActivity = (rec) => {
    if (window.confirm(`Do you want to pin "${rec.name}" to this activity?`)) {
      createPinnedActivity(rec);
    }
  };

  function handleStartChat() {
    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Chat with Voxxy Clicked', {
        activity: activity.id,
      });
    }
    setShowChat(true)
  }

  const createPinnedActivity = async (rec) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/activities/${id}/pinned_activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pinned_activity: {
            title: rec.name,
            description: rec.description || "",
            hours: rec.hours || "",
            price_range: rec.price_range || "",
            address: rec.address || "",
            votes: 0,
            reviews: rec.reviews || [],
            photos: rec.photos || [],
            reason: rec.reason || "",
            website: rec.website || ""
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to pin activity");
      if (process.env.NODE_ENV === 'production') {
        mixpanel.track('New Pinned', {
          activity: activity.id,
        });
      }
      const newPinnedActivity = await res.json();
      setPinnedActivities((prevPinned) => [...prevPinned, newPinnedActivity]);
      setRecommendations(prev => prev.filter(r => r.name !== rec.name));
    } catch (err) {
      console.error("Error pinning activity:", err);
      alert("Something went wrong while pinning the activity.");
    }
  };

  const displayedRecommendations = recommendations.filter(
    rec => !pinnedActivities.some(p => p.title === rec.name)
  );

  if (loading) {
    return <LoadingScreenUser autoDismiss={false} />;
  }

  return (
    <RecommendationsContainer>
      <Title>AI Recommendations</Title>
      <ChatButton>
        <StyledButton onClick={handleStartChat}>Chat with Voxxy</StyledButton>
      </ChatButton>
      {!recommendations.length && (
        <ChatButton>
          <StyledButton
            onClick={() =>
              responses?.length
                ? fetchRecommendations()
                : fetchTrendingRecommendations()
            }
          >
            Generate Recommendations
          </StyledButton>
        </ChatButton>
      )}
      {error && <ErrorText>{error}</ErrorText>}
      <RecommendationList>
        {pinnedActivities.length > 0 &&
          pinnedActivities.map((pinned) => (
            <PinnedActivityCard
              key={pinned.id}
              isOwner={isOwner}
              setPinnedActivities={setPinnedActivities}
              pinned={pinned}
            />
          ))}
        {displayedRecommendations.length > 0 &&
          recommendations.map((rec, index) => (
            <RecommendationItem key={index}>
              <RestaurantName>{rec.name}</RestaurantName>
              <Description>{rec.description || "No description available."}</Description>
              {rec.reason && (
                <ExplanationContainer>
                  <ExplanationTitle>Why was this chosen?</ExplanationTitle>
                  <ExplanationText>{rec.reason}</ExplanationText>
                </ExplanationContainer>
              )}
              <InlineDetails>
                <span>⏰ {rec.hours || "N/A"}</span>
                <span>💸 {rec.price_range || "N/A"}</span>
                <span>📍 {rec.address || "N/A"}</span>
                {rec.website && (
                  <span>
                    🌐{" "}
                    <a href={rec.website} target="_blank" rel="noopener noreferrer">
                      {rec.website}
                    </a>
                  </span>
                )}
              </InlineDetails>
              {rec.photos && rec.photos.length > 0 && (
                <PhotosContainer>
                  {rec.photos.slice(0, 3).map((photo, idx) => (
                    <PhotoThumbnail
                      key={idx}
                      src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`}
                      alt={`${rec.name} photo ${idx + 1}`}
                    />
                  ))}
                </PhotosContainer>
              )}
              <ButtonContainer>
                {rec.reviews && rec.reviews.length > 0 && (
                  <ReviewsButton onClick={() => setSelectedRecForReviews(rec)}>
                    Reviews ({rec.reviews.length})
                  </ReviewsButton>
                )}
                <UnpinButton onClick={() => handlePinActivity(rec)}>Pin Restaurant</UnpinButton>
              </ButtonContainer>
            </RecommendationItem>
          ))}
      </RecommendationList>
      {recommendations.length > 0 && <RestaurantMap recommendations={recommendations} />}

      {showChat && (
        <>
          <DimmedOverlay onClick={() => setShowChat(false)} />
          <CuisineChat
            activityId={id}
            onClose={() => setShowChat(false)}
            onChatComplete={() => {
              setRefreshTrigger((prev) => !prev);
              setShowChat(false);
              window.alert('New preferences submitted! Since Voxxy is currently in beta, recommendations refresh once an hour — your updates may take a little time to appear.')
            }}
          />
        </>
      )}
      {selectedRecForReviews && (
        <>
          <DimmedOverlay onClick={() => setSelectedRecForReviews(null)} />
          <ModalContainer>
            <ModalHeader>
              <ModalTitle>Reviews for {selectedRecForReviews.name}</ModalTitle>
              <CloseButton onClick={() => setSelectedRecForReviews(null)}>×</CloseButton>
            </ModalHeader>
            <ModalContent>
              {selectedRecForReviews.reviews.map((review, idx) => (
                <ReviewItem key={idx}>
                  {review.profile_photo_url && (
                    <ReviewAuthorImage src={review.profile_photo_url} alt={review.author_name} />
                  )}
                  <ReviewTextContainer>
                    <ReviewAuthor>{review.author_name}</ReviewAuthor>
                    <ReviewText>{review.text}</ReviewText>
                  </ReviewTextContainer>
                </ReviewItem>
              ))}
            </ModalContent>
          </ModalContainer>
        </>
      )}
    </RecommendationsContainer>
  );
};

export default AIRecommendations;

const RecommendationItem = styled.div`
  background: #2A1E30;
  border-radius: 16px;
  padding: 16px; /* slightly reduced padding */
  width: 350px;
  min-width: 350px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px; /* reduced gap between elements */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

const InlineDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  color: #FFFFFF;
  align-items: left;
  text-align: left;
`;

const ExplanationContainer = styled.div`
  background: #45314F;
  padding: 8px;
  border-left: 4px solid #a8a8a8;
  border-radius: 8px;
  text-align: left;
`;

const Title = styled.h2`
  color: #FFFFFF;
  text-align: center;
  margin-bottom: 15px;
`;

const RecommendationsContainer = styled.div`
  padding: 2rem;
  border-radius: 16px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ErrorText = styled.p`
  text-align: center;
  color: #d9534f;
  font-style: italic;
  margin-bottom: 1rem;
`;

const RecommendationList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px;
  justify-content: center;
  margin-bottom: 1rem;
`;

const RestaurantName = styled.h2`
  font-size: 1.6rem;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 6px;
  padding-right: 28px;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #FFFFFF;
  line-height: 1.6;
  text-align: left;
`;

const ExplanationTitle = styled.h4`
  margin: 0 0 6px;
  font-size: 1rem;
  color: #FFFFFF;
`;

const ExplanationText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #FFFFFF;
`;

const PhotosContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const PhotoThumbnail = styled.img`
  height: 120px;
  width: 120px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #ddd;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ReviewsButton = styled.button`
  background: ${(props) =>
    props.$isDelete ? "red" : "linear-gradient(135deg, #6a1b9a, #8e44ad)"};
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: ${(props) =>
    props.$isDelete ? "darkred" : "linear-gradient(135deg, #4e0f63, #6a1b8a)"};
  }
`;

const UnpinButton = styled.button`
  background: ${(props) =>
    props.$isDelete ? "red" : "green"};
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: ${(props) =>
    props.$isDelete ? "darkred" : "darkgreen"};
  }
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #2A1E30;
  border-radius: 16px;
  padding: 20px;
  z-index: 1001;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 10px;
  color: #fff;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #fff;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #fff;
`;

const ModalContent = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  `;

const ReviewItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
    color: #fff;
`;

const ReviewAuthorImage = styled.img`
  height: 40px;
  width: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const ReviewTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: #fff;
  text-align: left;
`;

const ReviewAuthor = styled.span`
  font-weight: bold;
  font-size: 0.95rem;
`;

const ReviewText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #fff;
`;