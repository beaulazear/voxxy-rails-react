import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Voxxy from '../assets/Voxxy.png';

const colors = {
  background: '#0D0B1F',
  textPrimary: '#FFFFFF',
  accent: '#9D60F8',
  muted: '#A8A8A8',
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
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
  animation: ${fadeIn} 1s ease-in-out;
`;

const Logo = styled.img`
  width: 130px;
  height: 130px;
  animation: ${spin} 3s infinite ease-in-out;
  margin-bottom: 2rem;

  @media (max-width: 640px) {
    width: 100px;
    height: 100px;
  }
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 0.75rem;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${colors.muted};
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const CountdownText = styled.p`
  font-size: 1rem;
  color: ${colors.accent};
  font-weight: 500;

  @media (max-width: 640px) {
    font-size: 0.95rem;
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
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <LoadingSection>
      <Logo src={Voxxy} alt="Voxxy Logo" />
      <Title>Loading Your Voxxy Experience</Title>
      <Subtitle>Hang tight — great things are on the way.</Subtitle>
      <CountdownText>Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...</CountdownText>
    </LoadingSection>
  );
};

export default LoadingScreen;