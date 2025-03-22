import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../context/user";
import styled from "styled-components";
import { SendOutlined } from "@ant-design/icons";
import Woman from "../assets/Woman.jpg";

const CommentsSection = ({ activity }) => {
  const [comments, setComments] = useState(activity.comments || []);
  const [newComment, setNewComment] = useState("");
  const { user } = useContext(UserContext);
  const commentsListRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (commentsListRef.current) {
      commentsListRef.current.scrollTop =
        commentsListRef.current.scrollHeight - commentsListRef.current.clientHeight;
    }
  }, [comments]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
    const response = await fetch(`${API_URL}/activities/${activity.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ comment: { content: newComment } }),
    });

    if (response.ok) {
      const comment = await response.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } else {
      alert("Failed to add comment.");
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <CommentsSectionWrapper>
      <ToggleButton onClick={() => setIsExpanded((prev) => !prev)}>
        {isExpanded ? "Hide Comments" : "View Activity Comments"}
      </ToggleButton>
      {isExpanded && (
        <CommentsContainer>
          <CommentsList ref={commentsListRef}>
            {comments.length > 0 ? (
              comments.map((comment) => {
                const isOwnComment = comment.user.id === user.id;
                return (
                  <CommentWrapper key={comment.id} $isOwnComment={isOwnComment}>
                    {!isOwnComment && (
                      <Avatar src={comment.user.avatar || Woman} alt={comment.user.name} />
                    )}
                    <CommentBubble $isOwnComment={isOwnComment}>
                      <CommentHeader>
                        <CommentAuthor>{comment.user.name}</CommentAuthor>
                        <Timestamp>{formatTimestamp(comment.created_at)}</Timestamp>
                      </CommentHeader>
                      <CommentText>{comment.content}</CommentText>
                    </CommentBubble>
                    {isOwnComment && (
                      <Avatar src={comment.user.avatar || Woman} alt={comment.user.name} />
                    )}
                  </CommentWrapper>
                );
              })
            ) : (
              <NoComments>No messages yet. Start the conversation!</NoComments>
            )}
            <div />
          </CommentsList>
          <CommentInputContainer>
            <CommentInput
              type="text"
              placeholder="Write a message..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <SendButton onClick={handleCommentSubmit}>
              <SendOutlined />
            </SendButton>
          </CommentInputContainer>
        </CommentsContainer>
      )}
    </CommentsSectionWrapper>
  );
};

export default CommentsSection;

const CommentsSectionWrapper = styled.div`
  width: 100%;
`;

const ToggleButton = styled.button`
  background: #8e44ad;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin: auto;
  margin-bottom: 10px;
  display: block;
  width: 225px;
  text-align: center;

  &:hover {
    background: #6a1b9a;
  }
`;

const CommentsContainer = styled.div`
  background: white;
  width: 100%;
  padding: 0;
  margin: 0;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
  width: 100%;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #8e44ad;
    border-radius: 5px;
  }
`;

const CommentWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  justify-content: ${({ $isOwnComment }) => ($isOwnComment ? "flex-end" : "flex-start")};
`;

const CommentBubble = styled.div`
  background: ${({ $isOwnComment }) => ($isOwnComment ? "#8e44ad" : "#f1f1f1")};
  color: ${({ $isOwnComment }) => ($isOwnComment ? "white" : "black")};
  padding: 12px;
  border-radius: 12px;
  max-width: 60%;
  position: relative;
  text-align: left;
  display: flex;
  flex-direction: column;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const CommentAuthor = styled.span`
  font-size: 0.9rem;
  font-weight: bold;
`;

const CommentText = styled.p`
  font-size: 1rem;
  margin: 0;
  word-wrap: break-word;
`;

const Timestamp = styled.span`
  font-size: 0.75rem;
  color: #bbb;
  margin-left: 10px;
`;

const NoComments = styled.p`
  font-size: 0.9rem;
  font-style: italic;
  color: #666;
  text-align: center;
`;

const CommentInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`;

const CommentInput = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
`;

const SendButton = styled.button`
  background: #8e44ad;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;

  &:hover {
    background: #6a1b9a;
  }
`;