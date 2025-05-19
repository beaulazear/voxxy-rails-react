import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../context/user";
import styled, { keyframes } from "styled-components";
import { SendOutlined } from "@ant-design/icons";
import Woman from "../assets/Woman.jpg";
import { MessageSquareMore } from 'lucide-react';

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

const CommentsSection = ({ activity }) => {
  const [comments, setComments] = useState(activity.comments || []);
  const [newComment, setNewComment] = useState("");
  const { user } = useContext(UserContext);
  const commentsListRef = useRef(null);

  useEffect(() => {
    if (commentsListRef.current) {
      commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
    }
  }, [comments]);

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

  const formatTimestamp = ts => {
    const d = new Date(ts);
    const now = new Date();
    const today = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return today
      ? time
      : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
  };

  return (
    <Wrapper>
      <ChatPanel>
        <Header>
          <Title>Voxxy Group Chat</Title>
          <IconWrapper><MessageSquareMore size={24} /></IconWrapper>
        </Header>
        <Messages ref={commentsListRef}>
          {comments.length ? comments.map(c => {
            const me = c.user.id === user.id;
            return (
              <MessageBlock key={c.id} me={me}>
                <TimestampAbove>{formatTimestamp(c.created_at)}</TimestampAbove>
                <MessageRow me={me}>
                  {!me && (
                    <AvatarContainer>
                      <Avatar src={c.user.avatar || Woman} alt={c.user.name} />
                      <UserName>{c.user.name.split(" ")[0]}</UserName>
                    </AvatarContainer>
                  )}
                  <Bubble me={me}>
                    <Text>{c.content}</Text>
                  </Bubble>
                  {me && (
                    <AvatarContainer>
                      <Avatar src={user.avatar || Woman} alt={user.name} />
                      <UserName>{user.name.split(" ")[0]}</UserName>
                    </AvatarContainer>
                  )}
                </MessageRow>
              </MessageBlock>
            );
          }) : (
            <EmptyState>No messages yet. Say hi!</EmptyState>
          )}
        </Messages>
        <Composer>
          <Input
            placeholder="Type a message…"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
          />
          <SendBtn onClick={handleCommentSubmit}>
            <SendOutlined />
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
  background: #2C1E33;
  width: 100%; max-width: 800px;
  border-radius: 16px;
  box-shadow:
    0 16px 32px rgba(0,0,0,0.5),
    inset 0 4px 8px rgba(0,0,0,0.6),
    inset 0 -4px 8px rgba(255,255,255,0.1);
  display: flex; flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex; align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
`;

const Title = styled.h3`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1rem, 2vw, 1.8rem);
  font-weight: bold;
  color: #fff;
  margin: 0.5rem 1rem 0.5rem;
  text-align: left;
`;

const IconWrapper = styled.div`
  color: #bfa9e3;
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex; flex-direction: column; gap: 1rem;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(190,169,227,0.6);
    border-radius: 3px;
  }
`;

const MessageBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ me }) => (me ? 'flex-end' : 'flex-start')};
  gap: 0.25rem;
`;

const TimestampAbove = styled.span`
  font-size: 0.75rem;
  color: #cfc1e2;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: ${({ me }) => (me ? 'flex-end' : 'flex-start')};
  gap: 0.5rem;
`;

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
  color: #cfc1e2;
  margin-top: 0.25rem;
`;

const bubbleGradient = 'linear-gradient(135deg, #7B3FE4 0%, #9B39F5 100%)';

const Bubble = styled.div`
  background: ${({ me }) => (me ? bubbleGradient : '#3b2a4b')};
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  max-width: 60%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  text-align: ${({ me }) => (me ? 'right' : 'left')};
  display: flex; flex-direction: column;
`;

const UserName = styled.span`
  margin-top: 0.25rem;
`;

const Text = styled.p`
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.4;
`;

const Avatar = styled.img`
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid #f0eef5;
  object-fit: cover;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #aaa;
  font-style: italic;
  margin-top: 2rem;
`;

const Composer = styled.div`
  display: flex;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(28,18,35,0.8);
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border-radius: 12px;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #f2f0f6;
  outline: none;
  &::placeholder { color: #c3bbcf; }
`;

const SendBtn = styled.button`
  margin-left: 0.75rem;
  background: #8e44ad;
  border: none;
  padding: 0.65rem;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #6a1b9a; }
`;