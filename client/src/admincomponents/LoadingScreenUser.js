import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import HEADER from '../assets/HEADER.svg'; // adjust path as needed

const fadeInPulse = keyframes`
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.8; transform: scale(1); }
`;

const modalBreathe = keyframes`
  0% { transform: scale(1); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); }
  50% { transform: scale(1.01); box-shadow: 0 8px 30px rgba(204, 49, 232, 0.1); }
  100% { transform: scale(1); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); }
`;

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
  33% { transform: translateY(-10px) rotate(120deg); opacity: 1; }
  66% { transform: translateY(-5px) rotate(240deg); opacity: 0.8; }
  100% { transform: translateY(0px) rotate(360deg); opacity: 0.7; }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #2A1E30 0%, #1E1425 100%);
  padding: 40px 45px;
  border-radius: 20px;
  border: 1px solid rgba(204, 49, 232, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 90%;
  width: 460px;
  animation: ${modalBreathe} 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
`;

const FloatingDot = styled.div`
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(204, 49, 232, 0.6);
  border-radius: 50%;
  animation: ${float} ${props => props.$duration}s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  
  &:nth-child(1) { top: 20%; left: 15%; }
  &:nth-child(2) { top: 30%; right: 20%; }
  &:nth-child(3) { bottom: 25%; left: 25%; }
  &:nth-child(4) { bottom: 35%; right: 15%; }
  &:nth-child(5) { top: 50%; left: 10%; }
  &:nth-child(6) { top: 60%; right: 10%; }
`;

const Logo = styled.img`
  width: 110px;
  margin-bottom: 25px;
  animation: ${fadeInPulse} 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(204, 49, 232, 0.3));
`;

const Title = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #cc31e8;
  font-family: 'Arial', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: #a0a0a0;
  margin-bottom: 30px;
  font-family: 'Arial', sans-serif;
  opacity: 0.8;
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 20px;
  position: relative;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #cc31e8, #6c63ff, #cc31e8);
  background-size: 200% 100%;
  border-radius: 3px;
  width: ${props => props.$progress}%;
  transition: width 0.5s ease-out;
  animation: ${shimmer} 2s linear infinite;
`;

const StepsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  padding: 0 10px;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
`;

const StepDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$active ? '#cc31e8' : 'rgba(255, 255, 255, 0.2)'};
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active ? '0 0 10px rgba(204, 49, 232, 0.5)' : 'none'};
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    width: ${props => props.$isLast ? '0' : '100%'};
    height: 2px;
    background: ${props => props.$completed ? '#cc31e8' : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-50%);
    transition: background 0.3s ease;
  }
`;

const StepLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.$active ? '#cc31e8' : '#888'};
  margin-top: 8px;
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.3s ease;
`;

const LoadingText = styled.div`
  font-size: 0.9rem;
  color: #b0b0b0;
  font-style: italic;
  min-height: 20px;
  transition: all 0.3s ease;
`;

const messages = [
  "Analyzing your preferences...",
  "Processing your data...",
  "Working some magic...",
  "Crafting perfect recommendations...",
  "Almost ready...",
  "Putting the finishing touches..."
];

const steps = [
  "Analyzing",
  "Doing some magic"
];

function LoadingScreenUser({ onComplete, autoDismiss = true }) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95; // Stop at 95% to avoid completing before actual process
        return prev + Math.random() * 3 + 1;
      });
    }, 200);

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2500);

    // Step progression - move to step 2 after 4 seconds
    const stepTimer = setTimeout(() => {
      setCurrentStep(1);
    }, 2500);

    // Auto dismiss
    let dismissTimer;
    if (autoDismiss && onComplete) {
      dismissTimer = setTimeout(() => {
        onComplete();
      }, 2000);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(stepTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [onComplete, autoDismiss]);

  return (
    <Backdrop>
      <Modal>
        {/* Floating background elements */}
        <FloatingDot $duration={4} $delay={0} />
        <FloatingDot $duration={5} $delay={1} />
        <FloatingDot $duration={3.5} $delay={2} />
        <FloatingDot $duration={4.5} $delay={0.5} />
        <FloatingDot $duration={3} $delay={1.5} />
        <FloatingDot $duration={5.5} $delay={2.5} />

        <Logo src={HEADER} alt="Voxxy logo" />
        <Title>Gathering your recommendations</Title>
        <Subtitle>This may take a few moments...</Subtitle>

        <StepsContainer>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepDot
                $active={index === currentStep}
                $completed={index < currentStep}
                $isLast={index === steps.length - 1}
              />
              <StepLabel $active={index === currentStep}>
                {step}
              </StepLabel>
            </Step>
          ))}
        </StepsContainer>

        <ProgressContainer>
          <ProgressBar $progress={progress} />
        </ProgressContainer>

        <LoadingText>
          {messages[currentMessage]}
        </LoadingText>
      </Modal>
    </Backdrop>
  );
}

export default LoadingScreenUser;