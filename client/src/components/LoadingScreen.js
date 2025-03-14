import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  padding: 20px;
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

const CountdownText = styled.p`
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 15px;
  color: #6a1b9a;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const LoadingScreen = () => {
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown === 0) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => Math.max(prev - 1, 0)); // Stops at 0
    }, 1000);

    return () => clearTimeout(timer); // Cleanup timer
  }, [countdown, navigate]);

  return (
    <LoadingSection>
      <Logo src={Voxxy} alt="Voxxy Logo" />
      <LoadingTitle>Your Voxxy Experience is Loading</LoadingTitle>
      <LoadingSubtitle>Please wait a moment...</LoadingSubtitle>
      <CountdownText>You'll be redirected in {countdown}...</CountdownText>
    </LoadingSection>
  );
};

export default LoadingScreen;