// src/components/VapiAssistant.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Vapi from "@vapi-ai/web";

export const vapi = new Vapi("0473382d-b20e-43b2-afbe-cf8f9bf7f9e6");

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh; /* Full screen */
  background: linear-gradient(135deg, #6a0dad, #9b19f5); /* Same background as HeroComponent */
  color: white;
  text-align: center;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Message = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StyledButton = styled.button`
  background-color: #444;
  color: white;
  font-size: 1.25rem;
  padding: 0.75rem 2.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  font-weight: bold;

  &:hover {
    background-color: #666;
    transform: scale(1.05);
  }

  &:active {
    background-color: #333;
    transform: scale(1);
  }
`;

const LoadingText = styled.i`
  font-size: 1.2rem;
  color: white;
`;

export default function VapiAssistant() {
    const [callStatus, setCallStatus] = useState("inactive");

    const start = async () => {
        setCallStatus("loading");
        vapi.start("9ae9f5cd-ad00-4eb9-b256-eb685371082b")
            .then(response => {
                console.log("Response:", response);
            })
            .catch(error => {
                console.error("Error starting Vapi:", error);
            });
    };

    const stop = () => {
        setCallStatus("loading");
        vapi.stop();
    };

    useEffect(() => {
        vapi.on("call-start", () => setCallStatus("active"));
        vapi.on("call-end", () => setCallStatus("inactive"));

        return () => vapi.removeAllListeners();
    }, []);

    return (
        <AssistantContainer>
            <Title>Vapi Assistant</Title>
            <Message>
                Experience seamless AI-driven customer interactions. Click to start your session!
            </Message>
            {callStatus === "inactive" && (
                <StyledButton onClick={start}>Start Session</StyledButton>
            )}
            {callStatus === "loading" && <LoadingText>Loading...</LoadingText>}
            {callStatus === "active" && (
                <StyledButton onClick={stop}>End Session</StyledButton>
            )}
        </AssistantContainer>
    );
}