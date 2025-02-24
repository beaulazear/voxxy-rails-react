import React, { useState, useEffect } from "react";
import styled from "styled-components";
import RestaurantMap from "./RestaurantMap";

const RecommendationsContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-left: 1rem;
    margin-right: 1rem;
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

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const RestaurantName = styled.h3`
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const PriceRange = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #555;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #666;
  margin-top: 0.5rem;
`;

const LoadingText = styled.p`
  text-align: center;
  font-style: italic;
  color: #666;
  font-size: 1.1rem;
`;

const FetchButton = styled.button`
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
  margin-bottom: 1rem;
  transition: background 0.2s ease;

  &:hover {
    background: #8e44ad;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const AIRecommendations = ({ activity }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  console.log("🚀 AIRecommendations received activity:", activity);
  console.log("📝 Responses in AIRecommendations:", activity.responses);

  useEffect(() => {
    console.log("🔄 AIRecommendations re-rendered with responses:", activity.responses);
  }, [activity.responses]); // ✅ Logs when responses change

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

  console.log(activity.responses, activity)

  return (
    <RecommendationsContainer>
      <Title>AI-Powered Restaurant Recommendations</Title>

      {error && <LoadingText>{error}</LoadingText>}

      {recommendations.length > 0 ? (
        <>
          <RecommendationList>
            {recommendations.map((rec, index) => (
              <RecommendationItem key={index}>
                <RestaurantName>{rec.name}</RestaurantName>
                {rec.price_range && <PriceRange>{rec.price_range}</PriceRange>}
                <Description>{rec.description}</Description>
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
          {recommendations.length > 0 && <RestaurantMap recommendations={recommendations} />}
        </>
      ) : (
        <>
          {activity.responses?.length > 0 && (
            <LoadingText>No recommendations yet! Click the ‘Get Recommendations’ button to discover restaurants tailored just for you, based on responses from all activity participants.</LoadingText>
          )}
          {(activity.responses?.length === 0 || !activity.responses) && (
            <LoadingText>No recommendations yet! Once you or other participants submit responses, personalized recommendations can be generated for your activity.</LoadingText>
          )}
        </>
      )}
      <br /><br />
      {activity.responses?.length > 0 && (
        <FetchButton onClick={fetchRecommendations} disabled={loading}>
          {loading ? "Generating..." : "Get Recommendations"}
        </FetchButton>
      )}
    </RecommendationsContainer>
  );
};

export default AIRecommendations;