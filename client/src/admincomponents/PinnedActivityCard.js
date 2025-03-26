import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import Woman from '../assets/Woman.jpg';

const PinnedActivityCard = ({ pinned, setPinnedActivities, isOwner }) => {
  const { user } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const [likes, setLikes] = useState(pinned.vote_count || 0);
  const [likedBy, setLikedBy] = useState(pinned.voters || []);
  const [hasLiked, setHasLiked] = useState(false);

  console.log(pinned)

  useEffect(() => {
    if (user) {
      setHasLiked(likedBy.some((voter) => voter.id === user.id));
    }
  }, [likedBy, user]);

  function handleLike() {
    if (hasLiked) {
      if (!Array.isArray(pinned.votes) || pinned.votes.length === 0) {
        console.error("No votes found for this activity");
        return;
      }

      const userVote = pinned.votes.find(vote => vote.user_id === user.id);
      if (!userVote) {
        console.error("User vote not found in frontend state!");
        return;
      }

      const voteId = userVote.id;
      const url = `${API_URL}/pinned_activities/${pinned.id}/votes/${voteId}`;

      fetch(url, {
        method: "DELETE",
        credentials: "include",
      })
        .then(res => res.json())
        .then((data) => {
          console.log("Response from DELETE request:", data);

          if (data.success) {
            setLikes(data.votes.length);
            setLikedBy(data.voters || []);
            setHasLiked(false);

            setPinnedActivities(prevPinnedActivities =>
              prevPinnedActivities.map(activity =>
                activity.id === pinned.id
                  ? { ...activity, votes: [...data.votes], voters: [...data.voters] }
                  : activity
              )
            );
          }
        })
        .catch(err => console.error("Error unliking activity:", err));

    } else {
      fetch(`${API_URL}/pinned_activities/${pinned.id}/votes`, {
        method: "POST",
        credentials: "include",
      })
        .then(res => res.json())
        .then((data) => {
          console.log("Response from POST request:", data);

          if (data.success) {
            setLikes(data.votes.length);
            setLikedBy(data.voters || []);
            setHasLiked(true);

            setPinnedActivities(prevPinnedActivities =>
              prevPinnedActivities.map(activity =>
                activity.id === pinned.id
                  ? { ...activity, votes: [...data.votes], voters: [...data.voters] }
                  : activity
              )
            );
          }
        })
        .catch(err => console.error("Error liking activity:", err));
    }
  }

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
      <Header>
        <Title>{pinned.title}</Title>
        <LikeSection>
          <LikeButton onClick={handleLike} $liked={hasLiked}>
            {hasLiked ? "❤️" : "🤍"} {likes}
          </LikeButton>
          <AvatarList>
            {likedBy.slice(0, 5).map((voter) => (
              <Avatar key={voter.id} src={voter.avatar || Woman} alt={voter.name} />
            ))}
          </AvatarList>
        </LikeSection>
      </Header>

      <Description>{pinned.description}</Description>
      <Details>
        <DetailItem>⏰ {pinned.hours || "N/A"}</DetailItem>
        <DetailItem>💸 {pinned.price_range || "N/A"}</DetailItem>
        <DetailItem>📍 {pinned.address || "N/A"}</DetailItem>
        {isOwner && (
          <ChatButton>
            <StyledButton onClick={handleDelete}>Delete</StyledButton>
          </ChatButton>
        )}
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
  margin-top: auto;

  &:hover {
    background: darkred;
  }
`;

export const ChatButton = styled.div`
  display: flex;
  justify-content: center;
  flex-grow: 1;
  align-items: flex-end;
  margin-top: auto;
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
  border-left: 8px solid #FFB400;
  min-width: 300px;
  cursor: pointer;
  text-align: left;
  max-width: 600px;

  &:hover {
    transform: scale(1.01);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-size: 1.4rem;
  font-weight: bold;
  color: #222;
  margin-bottom: 6px;
`;

const LikeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  color: ${({ $liked }) => ($liked ? "red" : "#888")};

  &:hover {
    transform: scale(1.1);
  }
`;

const AvatarList = styled.div`
  display: flex;
  align-items: center;
`;

const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  margin-left: -8px;

  &:first-child {
    margin-left: 0;
  }
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