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

  const fetchRecommendations = useCallback(async () => {
    if (!responses || responses.length === 0) {
      alert("No responses found for this activity.");
      return;
    }
    if (recommendations.length > 0) return;
    setLoading(true);
    setError("");
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/openai/restaurant_recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          responses: responses.map((res) => res.notes).join("\n\n"),
          activity_location,
          date_notes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      } else {
        setError("⚠️ OpenAI rate limit reached. Try again later.");
      }
    } catch (err) {
      setError("❌ Error fetching recommendations.");
    } finally {
      setLoading(false);
    }
  }, [responses, activity_location, date_notes, recommendations.length]);

  const fetchTrendingRecommendations = useCallback(async () => {
    if (!activity_location || !date_notes) {
      alert("Activity details missing for recommendations.");
      return;
    }
    if (recommendations.length > 0) return;
    setLoading(true);
    setError("");
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/openai/trending_recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activity_location, date_notes }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      } else {
        setError("⚠️ OpenAI rate limit reached. Try again later.");
      }
    } catch (err) {
      setError("❌ Error fetching trending recommendations.");
    } finally {
      setLoading(false);
    }
  }, [activity_location, date_notes, recommendations.length]);

  useEffect(() => {
    if (recommendations.length > 0) return;
    const fetchRecommendationsCache = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const res = await fetch(`${API_URL}/check_cached_recommendations?activity_id=${id}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations && data.recommendations.length > 0) {
            setRecommendations(data.recommendations);
          } else {
            console.warn("No cached recommendations found.");
            if (responses?.length > 0) {
              await fetchRecommendations();
            } else {
              await fetchTrendingRecommendations();
            }
          }
        } else {
          console.warn("Unexpected response status:", res.status);
          setRecommendations([]);
        }
      } catch (err) {
        console.error("Error fetching cached recommendations:", err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendationsCache();
  }, [
    id,
    activity_location,
    date_notes,
    responses,
    recommendations.length,
    fetchRecommendations,
    fetchTrendingRecommendations,
  ]);

  const handlePinActivity = (rec) => {
    if (window.confirm(`Do you want to pin "${rec.name}" to this activity?`)) {
      createPinnedActivity(rec);
    }
  };

  const createPinnedActivity = async (rec) => {
    console.log("Creating pinned activity with reviews:", rec.reviews);
    console.log("Creating pinned activity with photos:", rec.photos);
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
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to pin activity");
      const newPinnedActivity = await res.json();
      alert(`"${newPinnedActivity.title}" has been pinned!`);
      setPinnedActivities((prevPinned) => [...prevPinned, newPinnedActivity]);
    } catch (err) {
      console.error("Error pinning activity:", err);
      alert("Something went wrong while pinning the activity.");
    }
  };

  return (
    <RecommendationsContainer>
      <Title>AI Recommendations</Title>
        <ChatButton>
          <StyledButton onClick={() => setShowChat(true)}>Chat with Voxxy</StyledButton>
        </ChatButton>
      {error && <ErrorText>{error}</ErrorText>}
      <RecommendationList>
        {/* Render pinned activities first */}
        {pinnedActivities.length > 0 &&
          pinnedActivities.map((pinned) => (
            <PinnedActivityCard
              key={pinned.id}
              isOwner={isOwner}
              setPinnedActivities={setPinnedActivities}
              pinned={pinned}
            />
          ))}
        {recommendations.length > 0 &&
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
              <Details>
                <DetailItem>⏰ {rec.hours || "N/A"}</DetailItem>
                <DetailItem>💸 {rec.price_range || "N/A"}</DetailItem>
                <DetailItem>📍 {rec.address || "N/A"}</DetailItem>
                {rec.website && (
                  <DetailItem>
                    🌐{" "}
                    <a href={rec.website} target="_blank" rel="noopener noreferrer">
                      {rec.website}
                    </a>
                  </DetailItem>
                )}
              </Details>
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

const Title = styled.h2`
  color: white;
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
`;

const RecommendationItem = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  width: 350px;
  min-width: 350px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

const RestaurantName = styled.h2`
  font-size: 1.6rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
  padding-right: 28px;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 500;
`;

const DetailItem = styled.span`
  font-size: 0.95rem;
  color: #666;
`;

const ExplanationContainer = styled.div`
  background: #f1f1f1;
  padding: 10px;
  border-left: 4px solid #a8a8a8;
  border-radius: 8px;
`;

const ExplanationTitle = styled.h4`
  margin: 0 0 6px;
  font-size: 1rem;
  color: #444;
`;

const ExplanationText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #666;
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
  justify-content: center;
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

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
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
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #333;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const ModalContent = styled.div`
  max-height: 60vh;
  overflow-y: auto;
`;

const ReviewItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
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
`;

const ReviewAuthor = styled.span`
  font-weight: bold;
  font-size: 0.95rem;
`;

const ReviewText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #555;
`;