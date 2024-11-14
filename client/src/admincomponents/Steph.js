// src/components/VapiAssistant.js
import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import Vapi from "@vapi-ai/web";
import { Button } from "antd"; // Importing Ant Design button for styling consistency

export const vapi = new Vapi("0473382d-b20e-43b2-afbe-cf8f9bf7f9e6");

// Global style for fonts
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');
`;

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 80vh;
  background: linear-gradient(135deg, #6a0dad, #9b19f5);
  color: white;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const Title = styled.h1`
  font-size: 5rem;
  font-weight: 600;
  font-family: 'Caveat', cursive;
  line-height: 1.2;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const Message = styled.p`
  font-size: 1.3rem;
  margin-bottom: 20px;
  max-width: 800px;
  line-height: 1.6;
  font-family: 'Roboto', sans-serif;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const StyledButton = styled(Button)`
  background-color: white;
  color: #6a0dad;
  border: none;
  font-size: 1.25rem;
  padding: 0.75rem 2.5rem;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f3f3f3;
    color: #6a0dad;
  }
`;

const LoadingText = styled.i`
  font-size: 1.2rem;
  color: white;
`;

export default function Steph() {
  const defaultHeader = "Securta Solutions Feedback Experience via Voxxy";
  const [callStatus, setCallStatus] = useState("inactive");
  const [headerText, setHeaderText] = useState(defaultHeader);

  const start = async () => {
    setCallStatus("loading");
    vapi.start("45eaf409-3745-4d85-8443-0057d541d1fb")
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
    // Set header back to default on initial render or page refresh
    setHeaderText(defaultHeader);

    vapi.on("call-start", () => setCallStatus("active"));
    vapi.on("call-end", () => {
      setCallStatus("inactive");
      setHeaderText("Securta Solutions Thanks You for Participating");
    });

    return () => vapi.removeAllListeners();
  }, []);

  return (
    <>
      <GlobalStyle />
      <AssistantContainer>
        <Title>{headerText}</Title>
        <Message>
          You’re about to enter a Voxxy experience designed to capture your feedback and insights in real-time. During this session, feel free to share your thoughts openly—only a transcript of your words will be recorded, with no audio saved.
        </Message>
        {callStatus === "inactive" && (
          <StyledButton onClick={start}>Start Session</StyledButton>
        )}
        {callStatus === "loading" && <LoadingText>Loading...</LoadingText>}
        {callStatus === "active" && (
          <StyledButton onClick={stop}>End Session</StyledButton>
        )}
      </AssistantContainer>
    </>
  );
}