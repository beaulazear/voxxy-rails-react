import React from 'react';
import styled, { keyframes } from 'styled-components';

const colors = {
  background: '#201925',
  textPrimary: '#FFFFFF',
  accent: '#cc31e8',
  faded: 'rgba(157, 96, 248, 0.15)',
};

// Animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled Components
const LoadingSection = styled.div`
  background-color: ${colors.background};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
`;

const SpinnerContainer = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6px solid ${colors.faded};
    box-sizing: border-box;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6px solid transparent;
    border-top: 6px solid ${colors.accent};
    box-sizing: border-box;
    animation: ${spin} 1s linear infinite;
  }

  @media (max-width: 640px) {
    width: 70px;
    height: 70px;

    &::before,
    &::after {
      border-width: 4px;
    }
  }
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-top: 2rem;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${colors.accent};
  margin-top: 0.5rem;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const LoadingScreen = () => {
  return (
    <LoadingSection>
      <SpinnerContainer />
      <Title>Your Voxxy experience is loading...</Title>
      <Subtitle>Let’s plan your next adventure</Subtitle>
    </LoadingSection>
  );
};

export default LoadingScreen;