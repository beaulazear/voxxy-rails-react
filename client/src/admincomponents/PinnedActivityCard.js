import React from "react";
import styled from "styled-components";

const PinnedActivityCard = ({ pinned, setPinnedActivities, isOwner }) => {

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  function handleDelete() {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this pinned activity? This cannot be undone."
    );

    if (!confirmDelete) return;

    fetch(`${API_URL}/activities/${pinned.activity_id}/pinned_activities/${pinned.id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete pinned activity");
        }
        return res.json();
      })
      .then(() => {
        setPinnedActivities((prevPinned) =>
          prevPinned.filter((p) => p.id !== pinned.id)
        );

        console.log("Pinned activity deleted successfully");
      })
      .catch((error) => {
        console.error("Error deleting pinned activity:", error);
        alert("Failed to delete pinned activity.");
      });
  }

  return (
    <Card>
      <Title>{pinned.title}</Title>
      <Description>{pinned.description}</Description>
      <Details>
        <DetailItem>⏰ {pinned.hours || "N/A"}</DetailItem>
        <DetailItem>💸 {pinned.price_range || "N/A"}</DetailItem>
        <DetailItem>📍 {pinned.address || "N/A"}</DetailItem>
        {isOwner && (<ChatButton><StyledButton onClick={handleDelete}>Delete</StyledButton></ChatButton>)}
      </Details>
    </Card>
  );
};

export default PinnedActivityCard;

export const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s ease;
  background: red;
  margin-top: auto; /* Pushes it to the bottom inside a flex column */

  &:hover {
    background: darkred;
  }
`;

export const ChatButton = styled.div`
  display: flex;
  justify-content: center;
  flex-grow: 1; /* Allows it to take available space */
  align-items: flex-end; /* Pushes content to the bottom */
  margin-top: auto; /* Ensures it moves to the bottom */
  width: 100%;
  bottom: 0;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  border-left: 8px solid #6a1b9a;
  margin: 10px; /* More space between elements */
  min-width: 300px;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  }
`;

const Title = styled.h3`
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