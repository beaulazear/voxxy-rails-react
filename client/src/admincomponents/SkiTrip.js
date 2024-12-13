import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Vapi from "@vapi-ai/web";
import { Button } from "antd"; // Keeping Ant Design buttons

export const vapi = new Vapi("0473382d-b20e-43b2-afbe-cf8f9bf7f9e6");

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
  font-family: "Unbounded", sans-serif;
  font-weight: 400;
  font-size: 3rem;
  line-height: 1.2;
  max-width: 800px;
  margin-bottom: 20px;
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const ActiveMessage = styled.p`
  font-size: 1.3rem;
  margin-top: 20px;
  max-width: 800px;
  line-height: 1.6;
  font-family: "Montserrat", sans-serif;

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
  margin-top: 20px;

  &:hover {
    background-color: #f3f3f3;
    color: #6a0dad;
  }
`;

const LoadingText = styled.i`
  font-size: 1.2rem;
  color: white;
`;

const ThankYouMessage = styled.div`
  max-width: 800px;
  text-align: center;

  p {
    font-size: 1.3rem;
    margin-bottom: 20px; /* Adds space between text and button */
    line-height: 1.6;
    font-family: "Montserrat", sans-serif;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }
  }
`;

export default function VapiAssistant() {
    const defaultHeader = "Let's plan a Ski Trip!";
    const [callStatus, setCallStatus] = useState("inactive");
    const [headerText, setHeaderText] = useState(defaultHeader);
    const navigate = useNavigate();

    const start = async () => {
        setCallStatus("loading");
        vapi.start("25df815f-2e24-413f-87fe-48ce4fc3937c")
            .then((response) => {
                console.log("Response:", response);
            })
            .catch((error) => {
                console.error("Error starting Vapi:", error);
            });
    };

    const stop = () => {
        setCallStatus("loading");
        vapi.stop();
    };

    useEffect(() => {
        setHeaderText(defaultHeader);

        vapi.on("call-start", () => setCallStatus("active"));
        vapi.on("call-end", () => {
            setCallStatus("inactive");
            setHeaderText("Thank you for your feedback!");
        });

        return () => vapi.removeAllListeners();
    }, []);

    return (
        <AssistantContainer>
            {callStatus === "inactive" && headerText === "Thank you for your feedback!" ? (
                <ThankYouMessage>
                    <p>
                        Did you like Voxxy? If you're interested in learning more about how
                        Voxxy can support your business, click below to visit our homepage
                        and discover more!
                    </p>
                    <StyledButton onClick={() => navigate("/")}>Go Home</StyledButton>
                </ThankYouMessage>
            ) : (
                <>
                    <Title>{headerText}</Title>
                    {callStatus === "inactive" && (
                        <StyledButton onClick={start}>Start Session</StyledButton>
                    )}
                    {callStatus === "loading" && <LoadingText>Loading...</LoadingText>}
                    {callStatus === "active" && (
                        <>
                            <StyledButton onClick={stop}>End Session</StyledButton>
                            <ActiveMessage>
                                Please remember to press the End Session button when you’re
                                finished. The session will continue to capture input until it
                                is closed, so be sure to end the session to stop the microphone
                                from picking up any additional sound.
                            </ActiveMessage>
                        </>
                    )}
                </>
            )}
        </AssistantContainer>
    );
}