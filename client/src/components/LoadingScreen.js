import React from 'react';
import styled, { keyframes } from 'styled-components';
import Voxxy from '../assets/Voxxy.png';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
`;

const LoadingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  animation: ${fadeIn} 1.5s ease-in-out;
  text-align: center;
`;

const Logo = styled.img`
  width: 120px;
  height: 120px;
  animation: ${spin} 2.5s infinite ease-in-out;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }
`;

const LoadingTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
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
    <Logo src={Voxxy} alt="Voxxy Logo" />
    <LoadingTitle>Your Voxxy Experience is Loading</LoadingTitle>
    <LoadingSubtitle>Please wait a moment...</LoadingSubtitle>
  </LoadingSection>
);

export default LoadingScreen;