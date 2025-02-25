import React, { useState } from "react";
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

/** MODAL STYLES **/
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  width: 95%;
  max-width: 900px;
  height: 85vh;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 98%;
    height: 90vh;
  }
`;

const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f8f8;
  border-bottom: 1px solid #ddd;
`;

const ModalTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  color: #444;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #555;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow: hidden;
`;

const AIRecommendations = ({ activity }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMap, setShowMap] = useState(false);

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

  return (
    <RecommendationsContainer>
      <Title>AI-Powered Restaurant Recommendations</Title>

      {error && <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>{error}</p>}

      {recommendations.length > 0 ? (
        <>
          <RecommendationList>
            {recommendations.map((rec, index) => (
              <RecommendationItem key={index}>
                <RestaurantName>{rec.name}</RestaurantName>
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
          <Button onClick={() => setShowMap(true)}>View Recommendations on Map</Button>
        </>
      ) : (
        <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>
          No recommendations yet! Click ‘Get Recommendations’ to generate them.
        </p>
      )}

      {activity.responses?.length > 0 && recommendations.length === 0 && (
        <Button onClick={fetchRecommendations} disabled={loading}>
          {loading ? "Generating..." : "Get Recommendations"}
        </Button>
      )}

      {showMap && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>📍 Restaurant Locations</ModalTitle>
              <CloseButton onClick={() => setShowMap(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <RestaurantMap recommendations={recommendations} />
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </RecommendationsContainer>
  );
};

export default AIRecommendations;