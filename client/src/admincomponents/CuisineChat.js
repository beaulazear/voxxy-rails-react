import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from "../context/user.js";
import styled, { keyframes } from 'styled-components';
import LoadingScreenUser from './LoadingScreenUser';
import mixpanel from 'mixpanel-browser';

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

function CuisineChat({ onClose, activityId, onChatComplete }) {
  const [answers, setAnswers] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hey hey, party people! Voxxy here—your friendly get-together assitant. Your crew is making plans, and I’m here to help pick the perfect spot. Let’s do a quick vibe check!",
      isUser: false
    }
  ]);
  const [step, setStep] = useState(0);

  const [showLoading, setShowLoading] = useState(false);

  const { user, setUser } = useContext(UserContext);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const questionsRef = useRef([
    "What’s the food & drink mood? Are we craving anything specific (sushi, tacos, cocktails), or open to surprises?",
    "Any deal-breakers? (Like, “No pizza, please” or “I need gluten-free options.”)",
    "What’s the vibe? Fancy, casual, outdoor seating, rooftop views, great cocktails, good music—what matters most??",
    "What’s the budget range you’d like to stay close to (low, mid, high)?",
  ]);

  const questions = questionsRef.current;

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setMessages((prev) => [...prev, { text: questions[0], isUser: false }]);
      setIsTyping(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [questions]);

  function handleInputFocus() {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  const handleNext = () => {
    if (!currentInput.trim()) return;

    const userMessage = { text: currentInput, isUser: true };
    const userAnswer = { question: questions[step], answer: currentInput };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setAnswers((prev) => [...prev, userAnswer]);

    const nextStep = step + 1;

    // If there are more questions, ask next question
    if (nextStep < questions.length) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: questions[nextStep], isUser: false }
        ]);
        setIsTyping(false);
        setStep(nextStep);
      }, 1000);
    } else {
      // No more questions -> final message
      setStep(nextStep);
      setMessages((prev) => [
        ...prev,
        {
          text: "Got it! I’m pulling together the best spots that check all the boxes. Give me a sec, and I’ll drop the recommendations in just a moment!",
          isUser: false
        }
      ]);
      setTimeout(() => {
        setShowLoading(true);
      }, 1500);
    }
  };

  const handleSubmit = async () => {

    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Voxxy Chat 2 Completed', {
        name: user.name,
      });
    }

    const formattedNotes = answers
      .map((item) => `${item.question}\nAnswer: ${item.answer}`)
      .join("\n\n");

    try {
      const response = await fetch(`${API_URL}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          response: { notes: formattedNotes, activity_id: activityId }
        }),
      });

      if (response.ok) {
        const newResponse = await response.json();

        setUser((prevUser) => {
          const updatedActivities = prevUser.activities.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                responses: [...(activity.responses || []), newResponse]
              };
            }
            return activity;
          });

          const updatedParticipantActivities = prevUser.participant_activities.map((participant) => {
            if (participant.activity.id === activityId) {
              return {
                ...participant,
                activity: {
                  ...participant.activity,
                  responses: [...(participant.activity.responses || []), newResponse]
                }
              };
            }
            return participant;
          });

          return {
            ...prevUser,
            activities: updatedActivities,
            participant_activities: updatedParticipantActivities
          };
        });

        onChatComplete();
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save response:', errorData);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
    // Close chat after everything is done
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <>
      {showLoading && (
        <LoadingScreenUser onComplete={handleSubmit} />
      )}

      {!showLoading && (
        <>
          <Overlay onClick={onClose} />
          <ChatContainer onClick={(e) => e.stopPropagation()}>
            <ChatHeader>
              <BackButton onClick={onClose}>
                <svg viewBox="0 0 24 24">
                  <path
                    d="M15.5 3.5L7 12l8.5 8.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
                placeholder="Type your response..."
              />
              <SendButton onClick={handleNext}>
                ▶
              </SendButton>
            </ChatFooter>
          </ChatContainer>
        </>
      )}
    </>
  );
}

export default CuisineChat;