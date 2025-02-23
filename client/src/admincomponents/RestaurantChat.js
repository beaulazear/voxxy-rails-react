import React, { useState, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import { useNavigate } from 'react-router-dom';

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
  box-shadow: ${({ $isUser }) => ($isUser ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none')};
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
    color: #6c63ff;
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

function RestaurantChat({ onClose }) {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        activity_type: 'Restaurant',
        activity_name: '',
        activity_location: '',
        group_size: 1,
        date_notes: '',
        emoji: '🍜'
    });
    const [messages, setMessages] = useState([]);

    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const questions = [
        { key: 'activity_location', text: "First, Where are you thinking of having this dinner? (e.g., Manhattan, Brooklyn, Upper East Side)" },
        { key: 'date_notes', text: "What kind of meal are we talking? Brunch, lunch, dinner, or late night?" },
        { key: 'activity_name', text: "Do you have a name for this dinner, or is it just a casual get-together? You’ll have a chance to change it later." },
    ];

    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    const handleNext = () => {
        if (formData[questions[step].key]) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: questions[step].text, isUser: false },
                { text: formData[questions[step].key], isUser: true },
            ]);

            if (step < questions.length - 1) {
                setStep(step + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`${API_URL}/activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ activity: formData }),
            });

            if (response.ok) {
                const data = await response.json();

                setUser((prevUser) => ({
                    ...prevUser,
                    activities: [...(prevUser.activities || []), { ...data, user: prevUser }], // ✅ Inject user data into the new activity
                  }));

                navigate('/boards');
            } else {
                throw new Error('Failed to create activity');
            }
        } catch (error) {
            alert('Failed to create activity. Please try again.');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [questions[step].key]: e.target.value });
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <ChatContainer onClick={(e) => e.stopPropagation()}>
                <ChatHeader>
                    <BackButton onClick={onClose}>
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
                    {step < questions.length && (
                        <Message $isUser={false}>{questions[step].text}</Message>
                    )}
                </ChatBody>
                <ChatFooter>
                    <Input value={formData[questions[step]?.key] || ''} onChange={handleInputChange} placeholder="Type your message..." />
                    <SendButton onClick={step < questions.length ? handleNext : handleSubmit}>▶</SendButton>
                </ChatFooter>
            </ChatContainer>
        </>
    );
}

export default RestaurantChat;