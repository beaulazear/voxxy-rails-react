import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const LoadingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #6a0dad, #9b19f5);
  color: white;
  animation: ${fadeIn} 1.5s ease-in-out;
`;

const LoadingTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const LoadingSubtitle = styled.p`
  font-size: 1.2rem;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const LoadingScreen = () => (
    <LoadingSection>
        <LoadingTitle>Your Voxxy Experience is Loading</LoadingTitle>
        <LoadingSubtitle>Please wait a moment...</LoadingSubtitle>
    </LoadingSection>
);

export default LoadingScreen;