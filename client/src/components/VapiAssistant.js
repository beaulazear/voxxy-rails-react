// src/components/VapiAssistant.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Vapi from "@vapi-ai/web";
import { Button } from "antd";

export const vapi = new Vapi("0473382d-b20e-43b2-afbe-cf8f9bf7f9e6");

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 80vh;
  background: linear-gradient(135deg, #7F31D9, #431A73);
  color: white;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const Title = styled.h1`
  font-family: "Unbounded", sans-serif;
  font-optical-sizing: auto;
  font-weight: 400; /* Adjust the weight to your preference */
  font-size: 3rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Message = styled.p`
  font-family: "Unbounded", sans-serif;
  font-optical-sizing: auto;
  font-weight: 400; /* Use lighter weight for body text */
  font-size: 1.8rem;
  margin-bottom: 20px;
  max-width: 750px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.4rem;
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
  font-family: 'Unbounded', sans-serif;
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
    <>
      <AssistantContainer>
        <Title>Try our Voxxy Demo now</Title>
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
    </>
  );
}