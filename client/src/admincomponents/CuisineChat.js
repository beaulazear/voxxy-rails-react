import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from "../context/user.js";
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

const ForceChatNotice = styled.p`
  color: #ffcc00;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 8px;
`;

const QuitButton = styled.button`
  background: #ff4d4d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  margin-left: 10px;
  box-shadow: 0 2px 5px rgba(255, 77, 77, 0.3);
  
  &:hover {
    background: #cc0000;
  }
`;

function CuisineChat({ onClose, activityId, onChatComplete, forceChat }) {
    const [answers, setAnswers] = useState([]);
    const [currentInput, setCurrentInput] = useState("");
    const [messages, setMessages] = useState([{ text: "Hey hey, party people!  Voxxy here—your friendly get-together assitant. Your crew is making plans, and I’m here to help pick the perfect spot. Let’s do a quick vibe check!", isUser: false }]);
    const [step, setStep] = useState(0);

    const { setUser } = useContext(UserContext);
    const inputRef = useRef(null);
    const chatBodyRef = useRef(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const handleQuit = () => {
        const confirmDelete = window.confirm(
            "⚠️ If you exit now, this activity will be permanently deleted. Are you sure?"
        );

        if (!confirmDelete) return;

        fetch(`${API_URL}/activities/${activityId}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then((response) => {
                if (response.ok) {
                    console.log(`Activity with ID ${activityId} deleted successfully`);

                    setUser((prevUser) => ({
                        ...prevUser,
                        activities: prevUser.activities.filter(
                            (activity) => activity.id !== activityId
                        ),
                        participant_activities: prevUser.participant_activities.filter(
                            (participant) => participant.activity.id !== activityId
                        ),
                    }));

                    // Navigate all the way back to UserActivities
                    onClose(); // Close the chat modal
                    setTimeout(() => {
                        window.location.reload(); // Ensure full UI reset
                    }, 300);
                } else {
                    console.error("Failed to delete activity");
                }
            })
            .catch((error) => console.error("Error deleting activity:", error));
    };

    const questions = [
        "What’s the food & drink mood? Are we craving anything specific (sushi, tacos, cocktails), or open to surprises?",
        "Do you want a casual spot, a trendy place, or fine dining?",
        "Any deal-breakers? (Like, “No pizza, please” or “I need gluten-free options.”)",
        "What’s the vibe? Fancy, casual, outdoor seating, rooftop views, great cocktails, good music—what matters most??",
        "What’s the budget range you’d like to stay close to (low, mid, high)?",
    ];

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    function handleInputFocus() {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }

    const handleNext = () => {
        if (currentInput.trim()) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: questions[step], isUser: false },
                { text: currentInput, isUser: true },
            ]);

            setAnswers([...answers, { question: questions[step], answer: currentInput }]);
            setCurrentInput("");

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
                const newResponse = await response.json();

                setUser((prevUser) => {
                    const updatedActivities = prevUser.activities.map((activity) => {
                        if (activity.id === activityId) {
                            return {
                                ...activity,
                                responses: [...activity.responses || [], newResponse]
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
                                    responses: [...participant.activity.responses || [], newResponse]
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
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (step < questions.length - 1) {
                handleNext();
            } else {
                handleSubmit();
            }
        }
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <ChatContainer onClick={(e) => e.stopPropagation()}>
                <ChatHeader>
                    {!forceChat && (
                        <BackButton onClick={onClose}>
                            <svg viewBox="0 0 24 24">
                                <path d="M15.5 3.5L7 12l8.5 8.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </BackButton>
                    )}
                    Chat with Voxxy
                </ChatHeader>
                <ChatBody ref={chatBodyRef}>
                    {forceChat && (
                        <ForceChatNotice>⚠️ Hosts must submit their preferences first to get started!</ForceChatNotice>
                    )}
                    {messages.map((msg, index) => (
                        <Message key={index} $isUser={msg.isUser}>
                            {msg.text}
                        </Message>
                    ))}
                    {step < questions.length && <Message $isUser={false}>{questions[step]}</Message>}
                </ChatBody>
                <ChatFooter onClick={handleInputFocus}>
                    <Input
                        ref={inputRef}
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your response..."
                    />
                    <SendButton onClick={handleNext}>▶</SendButton>

                    {forceChat && <QuitButton onClick={handleQuit}>Quit</QuitButton>}
                </ChatFooter>
            </ChatContainer>
        </>
    );
}

export default CuisineChat;