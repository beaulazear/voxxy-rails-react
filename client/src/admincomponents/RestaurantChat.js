import React, { useState, useContext, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
`;

const ChatContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 450px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
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
  color: #6c63ff;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 1rem;
  color: #6c63ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    color: #574dcf;
  }

  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
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
  box-shadow: ${({ $isUser }) =>
    $isUser ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'};
  ${({ $isUser }) =>
    $isUser
      ? `
    background: white;
    align-self: flex-end;
    text-align: right;
    color: #333;
  `
      : `
    background: #e7e4ff;
    align-self: flex-start;
    text-align: left;
    color: #574dcf;
  `}
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

  &:focus {
    border-color: #6c63ff;
    box-shadow: 0 0 4px rgba(108, 99, 255, 0.3);
  }
`;

const SendButton = styled.button`
  background: #6c63ff;
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
  box-shadow: 0 2px 5px rgba(108, 99, 255, 0.3);

  &:hover {
    background: #574dcf;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const TypingBubble = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  height: 16px;
  padding: 0 6px;

  span {
    width: 6px;
    height: 6px;
    background-color: #6c63ff;
    border-radius: 50%;
    animation: blink 1.4s infinite both;
  }

  span:nth-child(2) {
    animation-delay: 0.2s;
  }

  span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes blink {
    0%, 80%, 100% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
  }
`;

function RestaurantChat({ onClose }) {
  const [formData, setFormData] = useState({});
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Voxxy here! I’m here to make planning this get-together smooth and stress-free. Let’s lock in the details real quick!", isUser: false }
  ]);
  const [step, setStep] = useState(0);
  const { setUser } = useContext(UserContext);
  const inputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const questionsRef = useRef([
    { key: 'activity_location', text: "Where are you planning to meet up? (Just the city name is fine, but the more precise the better!)" },
    { key: 'date_notes', text: "What kind of outing is this? Brunch, lunch, dinner, happy hour, late-night drinks?" },
    { key: 'activity_name', text: "Do you have a name for this event, or is it just a casual hangout? (You can change it later!)" }
  ]);

  const questions = questionsRef.current;

  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { text: questions[0].text, isUser: false }
      ]);
      setIsTyping(false);
    }, 1000); // adjust delay to your liking

    return () => clearTimeout(timer); // cleanup
  }, [questions]);

  function handleInputFocus() {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  const handleNext = () => {
    const key = questions[step].key;
    if (!currentInput.trim()) return;

    const newFormData = { ...formData, [key]: currentInput.trim() };

    setFormData(newFormData);
    setMessages((prev) => [...prev, { text: currentInput, isUser: true }]);
    setCurrentInput('');

    const nextStep = step + 1;

    if (nextStep < questions.length) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: questions[nextStep].text, isUser: false }
        ]);
        setIsTyping(false);
        setStep(nextStep);
      }, 1500);
    } else {
      setStep(nextStep);
      setTimeout(() => {
        handleSubmit(newFormData);
      }, 100);
    }
  };

  const handleSubmit = async (submittedData) => {
    const payload = {
      activity_type: 'Restaurant',
      group_size: 1,
      emoji: '🍜',
      ...submittedData
    };

    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ activity: payload }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser((prevUser) => ({
          ...prevUser,
          activities: [
            ...(prevUser.activities || []),
            { ...data, user: prevUser, responses: [] }
          ],
        }));
        onClose(data.id);
      } else {
        const err = await response.json();
        console.error('Failed:', err);
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Failed to create activity. Please try again.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <>
      <Overlay onClick={() => onClose(null)} />
      <ChatContainer onClick={(e) => e.stopPropagation()}>
        <ChatHeader>
          <BackButton onClick={() => onClose(null)}>
            <svg viewBox="0 0 24 24">
              <path d="M15.5 3.5L7 12l8.5 8.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </BackButton>
          Chat with Voxxy
        </ChatHeader>
        <ChatBody ref={chatBodyRef}>
          {messages.map((msg, index) => (
            <Message key={index} $isUser={msg.isUser}>
              {msg.text}
            </Message>
          ))}
          {isTyping && (
            <Message $isUser={false}>
              <TypingBubble>
                <span></span><span></span><span></span>
              </TypingBubble>
            </Message>
          )}
        </ChatBody>
        <ChatFooter onClick={handleInputFocus}>
          <Input
            ref={inputRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />
          <SendButton onClick={handleNext}>▶</SendButton>
        </ChatFooter>
      </ChatContainer>
    </>
  );
}

export default RestaurantChat;