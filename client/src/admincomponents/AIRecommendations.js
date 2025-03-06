import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  ChatButton,
  StyledButton,
  DimmedOverlay,
} from "../styles/ActivityDetailsStyles";
import RestaurantMap from "./RestaurantMap";
import SmallerLoading from "../components/SmallerLoading";
import CuisineChat from './CuisineChat';


const AIRecommendations = ({ activity, setPinnedActivities, setRefreshTrigger }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchCachedRecommendations = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const response = await fetch(`${API_URL}/check_cached_recommendations?activity_id=${activity.id}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations);
        }
      } catch (error) {
        console.error("Error fetching cached recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCachedRecommendations();
  }, [activity.id]);

  const fetchRecommendations = async () => {
    if (!activity.responses || activity.responses.length === 0) {
      alert("No responses found for this activity.");
      return;
    }

    if (recommendations.length > 0) {
      alert("You already have recommendations. Refresh the page to get new ones.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

      const response = await fetch(`${API_URL}/api/openai/restaurant_recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          responses: activity.responses.map((res) => res.notes).join("\n\n"),
          activity_location: activity.activity_location,
          date_notes: activity.date_notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      } else {
        setError("⚠️ OpenAI rate limit reached. Try again later.");
      }
    } catch (error) {
      setError("❌ Error fetching recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinActivity = (rec) => {
    if (window.confirm(`Do you want to pin "${rec.name}" to this activity?`)) {
      createPinnedActivity(rec);
    }
  };

  const createPinnedActivity = async (rec) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_URL}/activities/${activity.id}/pinned_activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      if (!response.ok) {
        throw new Error("Failed to pin activity");
      }

      const newPinnedActivity = await response.json();
      alert(`"${newPinnedActivity.title}" has been pinned!`);
      setPinnedActivities((prevPinned) => [...prevPinned, newPinnedActivity]);

    } catch (error) {
      console.error("Error pinning activity:", error);
      alert("Something went wrong while pinning the activity.");
    }
  };

  return (
    <RecommendationsContainer>
      <Title>AI-Powered Restaurant Recommendations</Title>

      <ChatButton>
        <StyledButton onClick={() => setShowChat(true)}>
          Chat with Voxxy
        </StyledButton>
      </ChatButton>

      {error && <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>{error}</p>}

      {recommendations.length > 0 ? (
        <>
          <RecommendationList>
            {recommendations.map((rec, index) => (
              <RecommendationItem onClick={() => handlePinActivity(rec)} key={index}>
                <RestaurantName>{rec.name}</RestaurantName>
                {rec.description && <p>{rec.description}</p>}
                {rec.hours && <p><strong>⏰ Hours:</strong> {rec.hours}</p>}
                {rec.price_range && <p><strong>💸 Price Range:</strong> {rec.price_range}</p>}
                {rec.address && <p><strong>📍 Address:</strong> {rec.address}</p>}
                {rec.website && (
                  <p>
                    <strong>🌐 Website:</strong>{" "}
                    <a href={rec.website} target="_blank" rel="noopener noreferrer">
                      {rec.website}
                    </a>
                  </p>
                )}
              </RecommendationItem>
            ))}
          </RecommendationList>
          <RestaurantMap recommendations={recommendations} />
        </>
      ) : (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          {loading ? <SmallerLoading title={'Recommendations'} /> : "No recommendations yet! Click ‘Chat with Voxxy’ to share your feedback. Recommendations are personalized based on input from all group participants and can be generated once at least one participant has chatted with Voxxy."}
        </div>
      )}

      {activity.responses?.length > 0 && recommendations.length === 0 && (
        <Button onClick={fetchRecommendations} disabled={loading}>
          {loading ? "Generating..." : "Generate Recommendations"}
        </Button>
      )}

      {showChat && (
        <>
          <DimmedOverlay />
          <CuisineChat
            activityId={activity.id}
            onClose={() => setShowChat(false)}
            onChatComplete={() => {
              setRefreshTrigger(prev => !prev);
            }}
          />
        </>
      )}
    </RecommendationsContainer>
  );
};

export default AIRecommendations;

const RecommendationsContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const RecommendationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RecommendationItem = styled.div`
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.5;
  color: #333;
  text-align: left;
  display: flex;
  flex-direction: column;
  word-break: break-word;


  @media (max-width: 768px) {
    padding: 1rem;
  }

  a {
    color: #9b59b6;
    word-break: break-word; /* Ensures URLs wrap instead of overflowing */
    overflow-wrap: break-word;
    display: inline-block;
    max-width: 100%;
  }
`;

const RestaurantName = styled.h3`
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  display: block;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: #9b59b6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: background 0.2s ease;

  &:hover {
    background: #8e44ad;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;