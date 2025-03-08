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
          setRecommendations(data.recommendations || []);
        } else {
          console.warn("Unexpected response status:", response.status);
          setRecommendations([]);
        }
      } catch (error) {
        console.error("Error fetching cached recommendations:", error);
        setRecommendations([]);
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
      <TextContainer>
        <Title>AI-Powered Restaurant Recommendations</Title>
        {recommendations.length > 0 && (<SubTitle>Your recommendations won’t last forever! If you find one you love, click on it to pin it and keep it saved in pinned activities. 'Chat with Voxxy' to update your preferences.</SubTitle>)}
        {recommendations.length  === 0 && (<SubTitle>Recommendations are personalized based on input from all group participants and can be generated once at least one participant has chatted with Voxxy. <br></br><br></br>No recommendations yet! Click ‘Chat with Voxxy’ to share your feedback.</SubTitle>)}
        <ChatButton>
          <StyledButton onClick={() => setShowChat(true)}>
            Chat with Voxxy
          </StyledButton>
        </ChatButton>
      </TextContainer>

      {error && <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>{error}</p>}

      {recommendations.length > 0 ? (
        <>
          <RecommendationList>
            {recommendations.map((rec, index) => (
              <RecommendationItem onClick={() => handlePinActivity(rec)} key={index}>
                <RestaurantName>{rec.name}</RestaurantName>
                <Description>{rec.description || "No description available."}</Description>
                <Details>
                  <DetailItem>⏰ {rec.hours || "N/A"}</DetailItem>
                  <DetailItem>💸 {rec.price_range || "N/A"}</DetailItem>
                  <DetailItem>📍 {rec.address || "N/A"}</DetailItem>
                  {rec.website && (
                    <DetailItem>
                      🌐 <a href={rec.website} target="_blank" rel="noopener noreferrer">{rec.website}</a>
                    </DetailItem>
                  )}
                </Details>
              </RecommendationItem>
            ))}
          </RecommendationList>
          <RestaurantMap recommendations={recommendations} />
        </>
      ) : (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          {loading && (<SmallerLoading title={'Recommendations'} />)}
        </div>
      )}

      {activity.responses?.length > 0 && recommendations.length === 0 && (
        <StyledButton>
          <ChatButton onClick={fetchRecommendations} disabled={loading}>
            {loading ? "Generating..." : "Generate Recommendations"}
          </ChatButton>
        </StyledButton>
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

const TextContainer = styled.div`
  background: white;
  backdrop-filter: blur(15px);
  border-radius: 8px;
  width: fit-content;
  margin: 0 auto;
  padding: 8px;
  margin-bottom: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
`

const SubTitle = styled.div`
  color: black; /* Ensure text is readable on a light background */
  max-width: 600px;
  margin: auto;
  font-size: 1.2rem;
  padding: 1rem;
`

const RecommendationsContainer = styled.div`
  padding: 1.5rem;
  border-radius: 16px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const Title = styled.h2`
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  color: black;
  margin-top: 0;
`;

const RecommendationList = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
  margin-left: -3rem;
  margin-right: -3rem;
  padding: 20px;

  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome/Safari */
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
  cursor: pointer;
  text-align: left;

  &:hover {
    transform: scale(1.01);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  }
`;

const RestaurantName = styled.h3`
  font-size: 1.4rem;
  font-weight: bold;
  color: #222;
  margin-bottom: 6px;
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