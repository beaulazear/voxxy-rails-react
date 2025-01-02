import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Styled Components
const ChatContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 70vh;
`;

const ChatHeader = styled.div`
  background: linear-gradient(to right, #6c63ff, #e942f5);
  color: white;
  text-align: center;
  padding: 15px;
  font-size: 1.2rem;
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Message = styled.div`
  max-width: 70%;
  padding: 10px;
  border-radius: 15px;
  font-size: 0.9rem;

  ${({ $isUser }) => ($isUser ? `
    background: #e6f7ff;
    align-self: flex-end;
    text-align: right;
  ` : `
    background: #f1f1f1;
    align-self: flex-start;
    text-align: left;
  `)}
`;

const ChatFooter = styled.div`
  padding: 15px;
  text-align: center;
`;

const Input = styled.input`
  width: 70%;
  padding: 8px;
  margin-right: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const SendButton = styled.button`
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 15px;
  cursor: pointer;
`;

const NextButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 1rem;
  margin-top: 10px;
  cursor: pointer;
`;

const LoadingScreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  h1 {
    font-size: 4vw;
    font-weight: bold;
    margin: 0;
    background: linear-gradient(to right, #6c63ff, #e942f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 6vw;
    }
  }
`;

function SkiTripChat() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        activity_type: 'Ski Trip',
        activity_name: '',
        activity_location: '',
        group_size: '',
        date_notes: '',
    });
    const [messages, setMessages] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

    const questions = [
        { key: 'activity_name', text: "Hey! 👋 What are we calling this trip? 'Powder Patrol' or 'Hot Cocoa & Chill'?" },
        { key: 'activity_location', text: "Where’s the dream destination? Aspen, Whistler, or somewhere cozy?" },
        { key: 'group_size', text: "How many people are joining you on this adventure?" },
        { key: 'date_notes', text: "Are we working with specific dates, or is it more flexible?" },
    ];

    const handleNext = () => {
        if (formData[questions[step].key]) {
            setMessages([
                ...messages,
                { text: questions[step].text, isUser: false },
                { text: formData[questions[step].key], isUser: true },
            ]);
            if (step < questions.length - 1) {
                setStep(step + 1);
            } else {
                setIsComplete(true);
            }
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [questions[step].key]: e.target.value });
    };

    const handleNextStep = async () => {
        setIsLoading(true);
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
                console.log('Activity created:', data);
                setTimeout(() => {
                    setIsLoading(false);
                    navigate('/');
                }, 1000);
            } else {
                throw new Error('Failed to create activity');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create activity. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading ? (
                <LoadingScreen>
                    <h1>Let's plan a {formData.activity_type} together..</h1>
                </LoadingScreen>
            ) : (
                <ChatContainer>
                    <ChatHeader>Voxxy Chat</ChatHeader>
                    <ChatBody>
                        {messages.map((msg, index) => (
                            <Message key={index} $isUser={msg.isUser}>
                                {msg.text}
                            </Message>
                        ))}
                        {!isComplete && (
                            <Message $isUser={false}>{questions[step].text}</Message>
                        )}
                    </ChatBody>
                    <ChatFooter>
                        {!isComplete ? (
                            <>
                                <Input
                                    type="text"
                                    value={formData[questions[step].key] || ''}
                                    onChange={handleInputChange}
                                />
                                <SendButton onClick={handleNext}>
                                    {step === questions.length - 1 ? 'Finish' : 'Next'}
                                </SendButton>
                            </>
                        ) : (
                            <NextButton onClick={handleNextStep}>
                                Chat complete! Click here to continue
                            </NextButton>
                        )}
                    </ChatFooter>
                </ChatContainer>
            )}
        </>
    );
}

export default SkiTripChat;