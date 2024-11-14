import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import styled from "styled-components";
import Vapi from "@vapi-ai/web";
import { Button, Modal } from "antd"; // Importing Ant Design for modals

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
  font-size: 5rem;
  font-weight: 600;
  font-family: 'Caveat', cursive;
  line-height: 1.2;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const ActiveMessage = styled.p`
  font-size: 1.3rem;
  margin-top: 20px;
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

export default function VapiAssistant() {
  const defaultHeader = "Share Your Thoughts with Sectura Solutions";
  const [callStatus, setCallStatus] = useState("inactive");
  const [headerText, setHeaderText] = useState(defaultHeader);
  const [initialModalVisible, setInitialModalVisible] = useState(true);
  const [endModalVisible, setEndModalVisible] = useState(false);

  const navigate = useNavigate();

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
    setHeaderText(defaultHeader);

    vapi.on("call-start", () => setCallStatus("active"));
    vapi.on("call-end", () => {
      setCallStatus("inactive");
      setHeaderText("Sectura Solutions Thanks You for Participating");
      setEndModalVisible(true);
    });

    return () => vapi.removeAllListeners();
  }, []);

  return (
    <>
      <AssistantContainer>
        <Title>{headerText}</Title>
        {callStatus === "inactive" && (
          <StyledButton onClick={start}>Start Session</StyledButton>
        )}
        {callStatus === "loading" && <LoadingText>Loading...</LoadingText>}
        {callStatus === "active" && (
          <>
            <StyledButton onClick={stop}>End Session</StyledButton>
            <ActiveMessage>
              Please remember to press the End Session button when you’re finished. The session will continue to capture input until it is closed, so be sure to end the session to stop the microphone from picking up any additional sound.
            </ActiveMessage>
          </>
        )}
      </AssistantContainer>

      {/* Initial Modal */}
      <Modal
        title="Get ready to share your feedback with Voxxy"
        visible={initialModalVisible}
        onCancel={() => setInitialModalVisible(false)}
        footer={[
          <Button key="learn" onClick={() => navigate('/')}>
            Learn More
          </Button>,
          <Button key="close" type="primary" onClick={() => setInitialModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <p>This is a space to share your spoken feedback with a conversational agent. Only a text transcript will be recorded, with no audio saved.</p>
      </Modal>

      {/* End Modal */}
      <Modal
        title="Thank you for your feedback!"
        visible={endModalVisible}
        onCancel={() => setEndModalVisible(false)}
        footer={[
          <Button key="home" onClick={() => window.location.href = '/'}>
            Home
          </Button>,
          <Button key="close" type="primary" onClick={() => navigate('/')}>
            Close
          </Button>
        ]}
      >
        <p>Did you like Voxxy? If you're interested in learning more about how Voxxy can support your business, click below to visit our homepage and discover more!</p>
      </Modal>
    </>
  );
}