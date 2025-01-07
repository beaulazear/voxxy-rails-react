import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// Styled Components
const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 500px;
    margin: 2rem auto;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    font-family: Arial, sans-serif;
`;

const ChatHeader = styled.div`
    background-color: #4a90e2;
    color: white;
    text-align: center;
    padding: 1rem;
    font-size: 1.25rem;
    font-weight: bold;
`;

const ChatMessages = styled.div`
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
    padding: 1rem;
    background-color: #fafafa;
`;

const Message = styled.div`
    margin: 0.5rem 0;
    text-align: ${(props) => (props.role === 'user' ? 'right' : 'left')};

    p {
        display: inline-block;
        background-color: ${(props) => (props.role === 'user' ? '#d1e7dd' : '#f8d7da')};
        color: ${(props) => (props.role === 'user' ? '#0f5132' : '#842029')};
        padding: 0.5rem 1rem;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
    }
`;

const ChatInputContainer = styled.div`
    display: flex;
    padding: 0.75rem;
    border-top: 1px solid #e0e0e0;
    background-color: #fff;
`;

const ChatInput = styled.input`
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-right: 0.5rem;
`;

const Button = styled.button`
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 0.9rem;

    &:hover {
        background-color: #357ab7;
    }

    &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
`;

const StartButtonContainer = styled.div`
    text-align: center;
    margin: 2rem 0;
`;

const LoadingText = styled.p`
    text-align: center;
    font-style: italic;
    color: #666;
    margin-top: 1rem;
`;

// Component
const ChatGPTChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [isChatStarted, setIsChatStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const startChat = () => {
        const API_URL = process.env.REACT_APP_API_URL || 'localhost:3001';
        const isSecure = window.location.protocol === 'https:'; // Check if app is served over HTTPS

        const cable = new WebSocket(
            `${isSecure ? 'wss' : 'ws'}://${API_URL}/cable`
        );

        /** ✅ WebSocket Open Event **/
        cable.onopen = () => {
            console.log('WebSocket connection established');
            cable.send(
                JSON.stringify({
                    command: 'subscribe',
                    identifier: JSON.stringify({ channel: 'ChatChannel', user_id: 1 }) // Replace user_id dynamically
                })
            );
        };

        /** ✅ WebSocket Message Event **/
        cable.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('🟢 Raw WebSocket Message:', data);

                if (data.type === 'ping' || data.type === 'welcome' || data.type === 'confirm_subscription') {
                    return; // Ignore non-chat messages
                }

                if (data?.message) {
                    const messageContent = typeof data.message === 'string'
                        ? data.message
                        : data.message.message || JSON.stringify(data.message);

                    console.log('💬 Parsed Message:', messageContent);

                    setMessages((prev) => [
                        ...prev,
                        { role: 'assistant', content: messageContent }
                    ]);

                    setIsLoading(false); // Stop loading
                }
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        };

        /** ✅ WebSocket Error Event **/
        cable.onerror = (error) => {
            console.error('❌ WebSocket Error:', error);
        };

        /** ✅ WebSocket Close Event **/
        cable.onclose = () => {
            console.log('🔴 WebSocket connection closed');
        };

        setSocket(cable);
        setIsChatStarted(true);
    };

    const sendMessage = () => {
        if (input.trim() === '') return;

        socket.send(
            JSON.stringify({
                command: 'message',
                identifier: JSON.stringify({ channel: 'ChatChannel', user_id: 1 }),
                data: JSON.stringify({ message: input })
            })
        );

        setMessages((prev) => [...prev, { role: 'user', content: input }]);
        setInput('');
        setIsLoading(true); // Start loading
    };

    const endChat = () => {
        console.log('Chat History:', messages);
        setMessages([]);
        socket?.close();
        setIsChatStarted(false);
    };

    if (!isChatStarted) {
        return (
            <StartButtonContainer>
                <Button onClick={startChat}>Get AI Reccomendations</Button>
            </StartButtonContainer>
        );
    }

    return (
        <ChatContainer>
            <ChatHeader>Chat with ChatGPT</ChatHeader>
            <ChatMessages>
                {messages.map((msg, index) => (
                    <Message key={index} role={msg.role}>
                        <p>{msg.content}</p>
                    </Message>
                ))}
                {isLoading && <LoadingText>Processing your answer...</LoadingText>}
            </ChatMessages>
            <ChatInputContainer>
                <ChatInput
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <Button onClick={sendMessage} disabled={isLoading}>Send</Button>
                <Button onClick={endChat} style={{ marginLeft: '0.5rem', backgroundColor: '#d9534f' }}>
                    End Chat
                </Button>
            </ChatInputContainer>
        </ChatContainer>
    );
};

export default ChatGPTChat;