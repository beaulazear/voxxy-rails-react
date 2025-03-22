import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  ChatButton,
  StyledButton,
  DimmedOverlay,
} from "../styles/ActivityDetailsStyles";
import RestaurantMap from "./RestaurantMap";
import CuisineChat from "./CuisineChat";

const AIRecommendations = ({ activity, setPinnedActivities, setRefreshTrigger }) => {
  // Local state for recommendations, loading status, errors, and chat modal.
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Destructure necessary fields from the activity object.
  const { id, responses, activity_location, date_notes } = activity;
  const responsesCompleted = responses?.length > 0;

  // Function: Fetch recommendations using detailed user responses.
  const fetchRecommendations = useCallback(async () => {
    if (!responses || responses.length === 0) {
      alert("No responses found for this activity.");
      return;
    }
    if (recommendations.length > 0) return; // Avoid duplicate fetch
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

  // Function: Fetch trending recommendations based solely on activity details.
  const fetchTrendingRecommendations = useCallback(async () => {
    if (!activity_location || !date_notes) {
      alert("Activity details missing for recommendations.");
      return;
    }
    if (recommendations.length > 0) return; // Avoid duplicate fetch
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

  // useEffect: Check for cached recommendations on mount.
  useEffect(() => {
    if (recommendations.length > 0) return; // Already loaded

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

  // Handler: Trigger the appropriate fetch based on responses completion.
  const handleFetchRecommendations = async () => {
    if (responsesCompleted) {
      await fetchRecommendations();
    } else {
      await fetchTrendingRecommendations();
    }
  };

  // Handler: Pin a recommendation to the activity.
  const handlePinActivity = (rec) => {
    if (window.confirm(`Do you want to pin "${rec.name}" to this activity?`)) {
      createPinnedActivity(rec);
    }
  };

  // Function: Create a pinned activity.
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

  const hasManyItems = recommendations.length >= 1;

  return (
    <RecommendationsContainer>
      {error && (
        <ErrorText>{error}</ErrorText>
      )}
      <RecommendationList $hasManyItems={hasManyItems}>
        <RecommendationItem>
          {recommendations.length > 0 ? (
            <>
              <RestaurantName>🍽️ Your AI-powered recommendations are here!</RestaurantName>
              <Description>
                Click on a recommendation to pin it to your list.
                <br /><br />
                Want to refine your options? Chat with Voxxy to update preferences and generate new recommendations.
              </Description>
            </>
          ) : (
            <>
              <RestaurantName>🤖 No recommendations yet!</RestaurantName>
              <Description>
                Voxxy creates personalized restaurant suggestions based on what your group enjoys.
                <br /><br />
                {responsesCompleted
                  ? "Have a chat with Voxxy to share preferences and see tailored recommendations."
                  : "Since detailed responses are missing, we're showing trending restaurant options based on the activity details."}
              </Description>
            </>
          )}
          <ChatButton>
            <StyledButton onClick={() => setShowChat(true)}>
              Chat with Voxxy
            </StyledButton>
          </ChatButton>
          {recommendations.length === 0 && (
            <ChatButton onClick={handleFetchRecommendations} disabled={loading}>
              <StyledButton>
                {loading ? "Loading..." : "Find Restaurants"}
              </StyledButton>
            </ChatButton>
          )}
        </RecommendationItem>
        {recommendations.length > 0 &&
          recommendations.map((rec, index) => (
            <RecommendationItem key={index}>
              <PinButton onClick={() => handlePinActivity(rec)}>➕</PinButton>
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
                    🌐 <a href={rec.website} target="_blank" rel="noopener noreferrer">
                      {rec.website}
                    </a>
                  </DetailItem>
                )}
              </Details>
            </RecommendationItem>
          ))}
      </RecommendationList>
      {recommendations.length > 0 && <RestaurantMap recommendations={recommendations} />}
      {showChat && (
        <>
          <DimmedOverlay />
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
    </RecommendationsContainer>
  );
};

export default AIRecommendations;

/* Styled Components */

const RecommendationsContainer = styled.div`
  padding: 1.5rem;
  border-radius: 16px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ErrorText = styled.p`
  text-align: center;
  color: #666;
  font-style: italic;
`;

const RecommendationList = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 10px;
  margin: 0 -3rem;
  ${({ $hasManyItems }) => $hasManyItems && `gap: 1rem;`}
  &::-webkit-scrollbar {
    display: none;
  }
`;

const RecommendationItem = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  border-left: 8px solid #666666;
  min-width: 300px;
  max-width: 600px;
  cursor: pointer;
  text-align: left;
  &:hover {
    transform: scale(1.01);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  }
`;

const RestaurantName = styled.h2`
  font-size: 1.4rem;
  font-weight: bold;
  color: #222;
  margin-bottom: 6px;
  margin-right: 20px;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #444;
  line-height: 1.5;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 500;
`;

const DetailItem = styled.span`
  font-size: 1rem;
  color: #666;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  &:last-child {
    border-bottom: none;
  }
`;

const PinButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.3rem;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  &:hover {
    transform: scale(1.2);
  }
`;

const ExplanationContainer = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f5f5;
  border-left: 4px solid #a8a8a8;
  border-radius: 4px;
`;

const ExplanationTitle = styled.h4`
  margin: 0 0 4px;
  font-size: 0.9rem;
  color: #333;
`;

const ExplanationText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #666;
`;