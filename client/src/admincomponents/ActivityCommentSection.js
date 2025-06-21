import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../context/user";
import styled, { keyframes } from "styled-components";
import { Send, NotepadText } from 'lucide-react';
import Woman from "../assets/Woman.jpg";

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

const CommentsSection = ({ activity }) => {
  const [comments, setComments] = useState(activity.comments || []);
  const [newComment, setNewComment] = useState("");
  const { user } = useContext(UserContext);
  const commentsRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, [comments]);

  // Also scroll to bottom on first render
  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, []);

  // Post a new comment
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
    const res = await fetch(`${API_URL}/activities/${activity.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ comment: { content: newComment } }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments(prev => [...prev, comment]);
      setNewComment("");
    } else {
      alert("Failed to add comment.");
    }
  };

  // Helpers to format
  const formatTime = ts => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const formatDate = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  };

  // Group comments by date
  const grouped = comments.reduce((acc, c) => {
    const date = formatDate(c.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(c);
    return acc;
  }, {});

  return (
    <Wrapper>
      <ChatPanel>
        <Header>
          <IconWrapper><NotepadText size={20} /></IconWrapper>
          <Title>Activity Updates</Title>
        </Header>

        <Messages ref={commentsRef}>
          {comments.length === 0 && <EmptyState>No messages yet. Say hi!</EmptyState>}

          {Object.entries(grouped).map(([date, msgs]) => (
            <React.Fragment key={date}>
              <DateSeparator>{date}</DateSeparator>
              {msgs.map(c => {
                const isMe = c.user.id === user.id;
                return (
                  <MessageRow key={c.id} $me={isMe}>
                    {!isMe && (
                      <AvatarContainer>
                        <Avatar src={c.user.avatar || Woman} alt={c.user.name} />
                        <UserName>{c.user.name.split(" ")[0]}</UserName>
                      </AvatarContainer>
                    )}
                    <Bubble $me={isMe}>
                      <Text style={{ textAlign: 'left' }}>{c.content}</Text>
                      <TimeStamp $me={isMe}>{formatTime(c.created_at)}</TimeStamp>
                    </Bubble>
                    {isMe && (
                      <AvatarContainer>
                        <Avatar src={user.avatar || Woman} alt={user.name} />
                        <UserName>{user.name.split(" ")[0]}</UserName>
                      </AvatarContainer>
                    )}
                  </MessageRow>
                );
              })}
            </React.Fragment>
          ))}
        </Messages>

        <Composer>
          <Input
            placeholder="Type a message…"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
          />
          <SendBtn onClick={handleCommentSubmit} disabled={!newComment.trim()}>
            <Send size={16} />
          </SendBtn>
        </Composer>
      </ChatPanel>
    </Wrapper>
  );
};

export default CommentsSection;

/* Styled Components */

const Wrapper = styled.div`
  width: 100%;
  animation: ${slideUp} 0.4s ease-out;
  display: flex;
  justify-content: center;
  padding: 1rem 0;
`;

const ChatPanel = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  width: 100%;
  max-width: 650px;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const IconWrapper = styled.div`
  color: #cc31e8;
`;

const Title = styled.h3`
  flex: 1;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: left;
  color: #fff;
  margin: 0;
`;

const Messages = styled.div`
  flex: 1;
  max-height: 60vh;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cc31e8;
    border-radius: 2px;
  }
`;

const DateSeparator = styled.div`
  text-align: center;
  color: #ccc;
  font-size: 0.75rem;
  font-weight: 500;
  margin: 1rem 0 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  align-self: center;
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: ${({ $me }) => ($me ? 'flex-end' : 'flex-start')};
  align-items: flex-end;
  gap: 0.75rem;
`;

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.7rem;
  color: #ccc;
  font-weight: 500;
  gap: 0.25rem;
`;

const TimeStamp = styled.span`
  position: absolute;
  bottom: -1.5rem;
  ${({ $me }) => ($me ? 'right: 0;' : 'left: 0;')}
  font-size: 0.7rem;
  color: #999;
  font-weight: 500;
  
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s ease, visibility 0.2s;
`;

const Bubble = styled.div`
  background: ${({ $me }) => ($me ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'rgba(255, 255, 255, 0.05)')};
  border: ${({ $me }) => ($me ? 'none' : '1px solid rgba(255, 255, 255, 0.1)')};
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  max-width: 75%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  align-self: ${({ $me }) => ($me ? 'flex-end' : 'flex-start')};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }
  
  &:hover ${TimeStamp} {
    visibility: visible;
    opacity: 1;
  }
`;

const Text = styled.p`
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
  font-weight: 400;
`;

const UserName = styled.span`
  text-align: center;
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  object-fit: cover;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #cc31e8;
    transform: scale(1.05);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #999;
  font-style: italic;
  margin: 2rem 0;
  font-size: 0.9rem;
`;

const Composer = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  border-radius: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  
  &::placeholder { 
    color: #aaa; 
  }
  
  &:focus { 
    border-color: #cc31e8; 
    background: rgba(255, 255, 255, 0.08);
  }
`;

const SendBtn = styled.button`
  background: ${({ disabled }) =>
    disabled ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'};
  border: ${({ disabled }) =>
    disabled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'};
  color: ${({ disabled }) => (disabled ? '#666' : '#fff')};
  padding: 0.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  min-width: 44px;
  height: 44px;
  
  &:hover:not(:disabled) { 
    background: linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(204, 49, 232, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    transform: none;
    box-shadow: none;
  }
`;