import React, { useState } from 'react';
import styled from 'styled-components';

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
  background: white;
  padding: 20px;
  border-bottom: 1px solid #ddd;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #6c63ff;
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

function CuisineChat({ onClose, activityId, onChatComplete }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState([]); // Store each answer separately
    const [currentInput, setCurrentInput] = useState(""); // Current input field
    const [messages, setMessages] = useState([]);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const questions = [
        "What type of cuisine are you craving? (e.g., Italian, Mexican, Japanese, American, fusion)",
        "Do you want a casual spot, a trendy place, or fine dining?",
        "Are there any dietary restrictions or preferences to consider? (e.g., vegetarian, halal, gluten-free)",
        "Are you in the mood for any specific features? (e.g., rooftop views, live music, quiet ambiance, quick service)",
        "What’s your ideal price range? (e.g., budget-friendly, mid-range, upscale)",
    ];

    const handleNext = () => {
        if (currentInput.trim()) {
            setMessages([
                ...messages,
                { text: questions[step], isUser: false },
                { text: currentInput, isUser: true },
            ]);

            setAnswers([...answers, { question: questions[step], answer: currentInput }]);
            setCurrentInput(""); // Clear input for next question

            if (step < questions.length - 1) {
                setStep(step + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleSubmit = async () => {
        const formattedNotes = answers.map((item) => `${item.question}\nAnswer: ${item.answer}`).join("\n\n");

        try {
            const response = await fetch(`${API_URL}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ response: { notes: formattedNotes, activity_id: activityId } }),
            });

            if (response.ok) {
                console.log('✅ Response saved successfully!');

                onChatComplete(); // ✅ Trigger refresh
                console.log('🔥 onChatComplete() has been called!'); // ✅ Log to verify
            } else {
                console.error('❌ Failed to save response');
            }
        } catch (error) {
            console.error('❌ Error:', error);
        }

        onClose();
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <ChatContainer onClick={(e) => e.stopPropagation()}>
                <ChatHeader>Chat with Voxxy</ChatHeader>
                <ChatBody>
                    {messages.map((msg, index) => (
                        <Message key={index} $isUser={msg.isUser}>
                            {msg.text}
                        </Message>
                    ))}
                    {step < questions.length && (
                        <Message $isUser={false}>{questions[step]}</Message>
                    )}
                </ChatBody>
                <ChatFooter>
                    <Input
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder="Type your response..."
                    />
                    <SendButton onClick={step < questions.length ? handleNext : handleSubmit}>
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                        </svg>
                    </SendButton>
                </ChatFooter>
            </ChatContainer>
        </>
    );
}

export default CuisineChat;