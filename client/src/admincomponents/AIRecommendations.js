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
    padding: 1.5rem; /* Add padding for smaller screens */
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
    padding: 1rem; /* Reduce padding slightly for better spacing */
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

const AIRecommendations = ({ activity, refreshTrigger }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        setLoading(true);

        const fetchRecommendations = async () => {
            try {
                const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

                // ✅ Fetch the latest activity data instead of relying on context
                const activityResponse = await fetch(`${API_URL}/activities/${activity.id}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                if (!activityResponse.ok) {
                    setLoading(false);
                    return;
                }

                const updatedActivity = await activityResponse.json();

                if (!updatedActivity.responses || updatedActivity.responses.length === 0) {
                    setRecommendations([]);
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_URL}/api/openai/restaurant_recommendations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        responses: updatedActivity.responses.map((res) => res.notes).join("\n\n"),
                        activity_location: activity.activity_location,
                        date_notes: activity.date_notes
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setRecommendations(data.recommendations);
                } else {
                    console.error("❌ Failed to fetch AI recommendations");
                }
            } catch (error) {
                console.error("❌ Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [refreshTrigger, activity.id, activity.date_notes, activity.activity_location]);

    return (
        <RecommendationsContainer>
            <Title>AI-Powered Restaurant Recommendations</Title>
            {loading ? (
                <LoadingText>Generating recommendations...</LoadingText>
            ) : recommendations.length > 0 ? (
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
                <LoadingText>No recommendations yet.</LoadingText>
            )}
        </RecommendationsContainer>
    );
};

export default AIRecommendations;