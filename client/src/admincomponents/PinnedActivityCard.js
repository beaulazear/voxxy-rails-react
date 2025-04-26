import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg";
import { DimmedOverlay } from "../styles/ActivityDetailsStyles";
import mixpanel from 'mixpanel-browser';

const PinnedActivityCard = ({ pinned, setPinnedActivities, isOwner }) => {
  const { user } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const [likes, setLikes] = useState(pinned.vote_count || 0);
  const [likedBy, setLikedBy] = useState(pinned.voters || []);
  const [hasLiked, setHasLiked] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (user) {
      setHasLiked(likedBy.some((voter) => voter.id === user.id));
    }
  }, [likedBy, user]);

  function handleLike() {
    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Pinned Activity Voted On', {
        user: user.id,
      });
    }
    if (hasLiked) {
      if (!Array.isArray(pinned.votes) || pinned.votes.length === 0) {
        console.error("No votes found for this activity");
        return;
      }
      const userVote = pinned.votes.find((vote) => vote.user_id === user.id);
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
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLikes(data.votes.length);
            setLikedBy(data.voters || []);
            setHasLiked(false);
            setPinnedActivities((prev) =>
              prev.map((activity) =>
                activity.id === pinned.id
                  ? { ...activity, votes: [...data.votes], voters: [...data.voters] }
                  : activity
              )
            );
          }
        })
        .catch((err) => console.error("Error unliking activity:", err));
    } else {
      fetch(`${API_URL}/pinned_activities/${pinned.id}/votes`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLikes(data.votes.length);
            setLikedBy(data.voters || []);
            setHasLiked(true);
            setPinnedActivities((prev) =>
              prev.map((activity) =>
                activity.id === pinned.id
                  ? { ...activity, votes: [...data.votes], voters: [...data.voters] }
                  : activity
              )
            );
          }
        })
        .catch((err) => console.error("Error liking activity:", err));
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
        setPinnedActivities((prev) => prev.filter((p) => p.id !== pinned.id));
      })
      .catch((error) => {
        console.error("Error deleting pinned activity:", error);
        alert("Failed to delete pinned activity.");
      });
  }

  return (
    <>
      <Card>
        <PinnedBadge>Pinned</PinnedBadge>
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
        {/* Explanation section for the new "reason" field */}
        {pinned.reason && (
          <ExplanationContainer>
            <ExplanationTitle>Why was this chosen?</ExplanationTitle>
            <ExplanationText>{pinned.reason}</ExplanationText>
          </ExplanationContainer>
        )}
        <InlineDetails>
          <span>⏰ {pinned.hours || "N/A"}</span>
          <span>💸 {pinned.price_range || "N/A"}</span>
          <span>📍 {pinned.address || "N/A"}</span>
          {pinned.website && (
            <span>
              🌐{" "}
              <a href={pinned.website} target="_blank" rel="noopener noreferrer">
                {pinned.website}
              </a>
            </span>
          )}
        </InlineDetails>
        {pinned.photos && pinned.photos.length > 0 && (
          <PhotosContainer>
            {pinned.photos.slice(0, 3).map((photo, idx) => (
              <PhotoThumbnail
                key={idx}
                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`}
                alt={`${pinned.title} photo ${idx + 1}`}
              />
            ))}
          </PhotosContainer>
        )}
        <ButtonContainer>
          {pinned.reviews && pinned.reviews.length > 0 && (
            <ReviewsButton onClick={() => setShowReviews(true)}>
              Reviews ({pinned.reviews.length})
            </ReviewsButton>
          )}
          {isOwner && (
            <UnpinButton onClick={handleDelete}>Unpin</UnpinButton>
          )}
        </ButtonContainer>
      </Card>
      {showReviews && (
        <>
          <DimmedOverlay onClick={() => setShowReviews(false)} />
          <ModalContainer>
            <ModalHeader>
              <ModalTitle>Reviews for {pinned.title}</ModalTitle>
              <CloseButton onClick={() => setShowReviews(false)}>×</CloseButton>
            </ModalHeader>
            <ModalContent>
              {pinned.reviews.map((review, idx) => (
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
    </>
  );
};

export default PinnedActivityCard;

const InlineDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  color: #FFFFFF;
  align-items: center;
`;

const Card = styled.div`
  background: #2A1E30;
  border-radius: 12px;
  padding: 20px 15px 15px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  width: 350px;
  min-width: 350px;
  max-width: 350px;
  margin: 0;
  cursor: pointer;
  text-align: left;
  &:hover {
    transform: scale(1.01);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  }
`;

// Reduce the padding and margin on the explanation container
const ExplanationContainer = styled.div`
  background: #45314F;
  padding: 8px;
  border-left: 4px solid #a8a8a8;
  border-radius: 8px;
  margin: 4px 0;
`;

const PinnedBadge = styled.div`
  position: absolute;
  top: 8px;
  left: 10px;
  background: #8e44ad;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 2;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-size: 1.3rem;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 4px;
  margin-left: 50px;
`;

const LikeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  font-size: 1.3rem;
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
  font-size: 0.95rem;
  color: #FFFFFF;
  line-height: 1.4;
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
  margin-top: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const PhotoThumbnail = styled.img`
  height: 100px;
  width: 100px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #ddd;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ReviewsButton = styled.button`
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: linear-gradient(135deg, #4e0f63, #6a1b8a);
  }
`;

const UnpinButton = styled.button`
  background: red;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: darkred;
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
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
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
  color: #FFFFFF;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #FFFFFF;
`;

const ModalContent = styled.div`
  max-height: 60vh;
  overflow-y: auto;
`;

const ReviewItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  color: #FFFFFF;
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
  text-align: left;
`;

const ReviewAuthor = styled.span`
  font-weight: bold;
  font-size: 0.95rem;
`;

const ReviewText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #FFFFFF;
`;