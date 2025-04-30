import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import LoadingScreenUser from '../admincomponents/LoadingScreenUser';
import colors from '../styles/Colors';
import mixpanel from 'mixpanel-browser';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 998;
`;

const ChatContainer = styled.div`
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 90%; max-width: 450px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  z-index: 999;
  display: flex;
  flex-direction: column;
  height: 70vh;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 15px 20px;
  border-bottom: 1px solid #ddd;
  font-size: 1.2rem;
  font-weight: bold;
  color: ${colors.primaryButton};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 1rem;
  color: ${colors.primaryButton};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  &:hover { color: ${colors.accentBar}; }
  svg { width: 20px; height: 20px; fill: currentColor; }
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f9f9f9;
`;

const Message = styled.div`
  max-width: 75%;
  padding: 12px 15px;
  border-radius: 20px;
  font-size: 0.95rem;
  line-height: 1.5;
  font-family: 'Arial', sans-serif;
  animation: ${fadeInUp} 0.3s ease forwards;
  ${({ $isUser }) => $isUser ? `
    background: white;
    align-self: flex-end;
    text-align: right;
    color: #333;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  ` : `
    background: #e7e4ff;
    align-self: flex-start;
    text-align: left;
    color: #574dcf;
  `}
`;

const TypingBubble = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  height: 16px;
  padding: 0 6px;
  span { width:6px; height:6px; background:#6c63ff; border-radius:50%; animation: blink 1.4s infinite both; }
  span:nth-child(2) { animation-delay:0.2s; }
  span:nth-child(3) { animation-delay:0.4s; }
  @keyframes blink { 0%,80%,100% { opacity:0; } 40% { opacity:1; } }
`;

const ChatFooter = styled.div`
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-top: 1px solid #ddd;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 0.9rem;
  outline: none;
  &:focus { border-color: ${colors.primaryButton}; box-shadow: 0 0 4px rgba(108,99,255,0.3); }
`;

const SendButton = styled.button`
  background: ${colors.primaryButton};
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(108,99,255,0.3);
  &:hover { background: ${colors.accentBar}; }
  svg { width:20px; height:20px; }
`;

function TryVoxxyChat({ onClose, onChatComplete, eventLocation, dateNotes }) {
  const [messages, setMessages] = useState([
    { text: "Hey party people! Voxxy here to help plan your outing. Let's do a quick vibe check!", isUser: false }
  ]);
  const [answers, setAnswers] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const chatBodyRef = useRef(null);

  const questionsRef = useRef([
    "What’s the food & drink mood? Are we craving anything specific or open to surprises?",
    "Any deal-breakers? (e.g. no pizza, gluten-free, etc)",
    "What’s the vibe? Fancy, casual, outdoor seating, rooftop views, good music…?",
    "Budget range: low, mid, high?"
  ]);
  const questions = questionsRef.current;

  const getOrCreateSessionToken = () => {
    let token = localStorage.getItem('voxxy_token');
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem('voxxy_token', token);
    }
    return token;
  };

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, { text: questions[0], isUser: false }]);
      setIsTyping(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [questions]);

  useEffect(() => {
    chatBodyRef.current?.scrollTo(0, chatBodyRef.current.scrollHeight);
  }, [messages]);

  const handleNext = () => {
    if (!currentInput.trim()) return;
    setMessages(m => [...m, { text: currentInput, isUser: true }]);
    setAnswers(a => [...a, { question: questions[step], answer: currentInput }]);
    setCurrentInput("");
    const next = step + 1;
    if (next < questions.length) {
      setStep(next);
      setIsTyping(true);
      setTimeout(() => {
        setMessages(m => [...m, { text: questions[next], isUser: false }]);
        setIsTyping(false);
      }, 1000);
    } else {
      setMessages(m => [...m, { text: "Great! Fetching recommendations now…", isUser: false }]);
      setTimeout(() => setShowLoading(true), 1500);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async () => {
    const formatted = answers.map(a => `${a.question}\nAnswer: ${a.answer}`).join("\n\n");
    const token = getOrCreateSessionToken();

    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Try Voxxy Chat Complete');
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/try_voxxy_recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({ responses: formatted, activity_location: eventLocation, date_notes: dateNotes })
      });
      const data = await res.json();
      onChatComplete(data.recommendations || []);
    } catch (err) {
      console.error(err);
      onChatComplete([]);
    }

    onClose();
  };

  return (
    <>
      {showLoading ? (
        <LoadingScreenUser onComplete={handleSubmit} />
      ) : (
        <>
          <Overlay onClick={onClose} />
          <ChatContainer onClick={e => e.stopPropagation()}>
            <ChatHeader>
              <BackButton onClick={onClose}>
                <svg viewBox="0 0 24 24"><path d="M15.5 3.5L7 12l8.5 8.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back
              </BackButton>
              Chat with Voxxy
            </ChatHeader>

            <ChatBody ref={chatBodyRef}>
              {messages.map((m, i) => <Message key={i} $isUser={m.isUser}>{m.text}</Message>)}
              {isTyping && <Message><TypingBubble><span /><span /><span /></TypingBubble></Message>}
            </ChatBody>

            <ChatFooter>
              <Input
                value={currentInput}
                onChange={e => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response…"
              />
              <SendButton onClick={handleNext}>▶</SendButton>
            </ChatFooter>
          </ChatContainer>
        </>
      )}
    </>
  );
}

export default TryVoxxyChat;
