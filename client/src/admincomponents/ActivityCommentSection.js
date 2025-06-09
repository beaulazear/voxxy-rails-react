import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../context/user";
import styled, { keyframes } from "styled-components";
import { SendOutlined } from "@ant-design/icons";
import Woman from "../assets/Woman.jpg";
import { NotepadText } from 'lucide-react';

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
          <Title>Activity Updates</Title>
          <IconWrapper><NotepadText size={24} /></IconWrapper>
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
                      <Text style={{textAlign: 'left'}}>{c.content}</Text>
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
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  box-shadow:
    0 16px 32px rgba(0,0,0,0.5),
    inset 0 4px 8px rgba(0,0,0,0.6),
    inset 0 -4px 8px rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
`;

const Title = styled.h3`
  flex: 1;
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1rem, 2vw, 1.8rem);
  font-weight: bold;
  text-align: left;
  color: #fff;
  margin: 1rem;
`;

const IconWrapper = styled.div`
  color: #bfa9e3;
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(190,169,227,0.6);
    border-radius: 3px;
  }
`;

const DateSeparator = styled.div`
  text-align: center;
  color: #cfc1e2;
  font-size: 0.85rem;
  margin: 1rem 0 0.5rem;
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: ${({ $me }) => ($me ? 'flex-end' : 'flex-start')};
  align-items: flex-end;
  gap: 0.5rem;
`;

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
  color: #cfc1e2;
`;

const bubbleGradient = 'linear-gradient(135deg, #7B3FE4 0%, #9B39F5 100%)';

const Bubble = styled.div`
  background: ${({ $me }) => ($me ? bubbleGradient : '#3b2a4b')};
  color: #fff;
  padding: 0.4rem 0.75rem;
  border-radius: 18px;
  max-width: 60%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  position: relative;
  align-self: ${({ $me }) => ($me ? 'flex-end' : 'flex-start')};
`;

const Text = styled.p`
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.4;
`;

const TimeStamp = styled.span`
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 0.65rem;
  color: #cfc1e2;

  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s ease, visibility 0.2s;
`;

const UserName = styled.span`
  margin-top: 0.25rem;
`;

const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #f0eef5;
  object-fit: cover;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #aaa;
  font-style: italic;
  margin: 2rem 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #6a1b9a; }
`;