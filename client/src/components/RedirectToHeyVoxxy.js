import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import colors from '../styles/Colors';
import HEADER from '../assets/HEADER.svg';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(5deg);
  }
  75% {
    transform: translateY(5px) rotate(-5deg);
  }
`;

const RedirectContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.gradient.start} 0%, ${colors.gradient.end} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const BackgroundAnimation = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  
  &::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1%, transparent 3%);
    background-size: 50px 50px;
    animation: ${float} 10s ease-in-out infinite;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 10;
  text-align: center;
  animation: ${slideUp} 0.6s ease-out;
`;

const Logo = styled.img`
  width: 150px;
  height: auto;
  margin-bottom: 2rem;
  filter: brightness(0) invert(1);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LoadingDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: ${pulse} 1.4s ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
`;

const Message = styled.h2`
  color: ${colors.textSecondary};
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: ${slideUp} 0.8s ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: both;
`;

const SubMessage = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  animation: ${slideUp} 0.8s ease-out;
  animation-delay: 0.4s;
  animation-fill-mode: both;
`;

const FunMessages = [
  "Packing your bags for Hey Voxxy! 🎒",
  "Teleporting you to the right place... ✨",
  "Redirecting to your destination! 🚀",
  "Taking the scenic route to Hey Voxxy! 🛤️",
  "Almost there, just a moment! ⏰"
];

const RedirectToHeyVoxxy = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Rotate through fun messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % FunMessages.length);
    }, 800);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.location.href = 'https://heyvoxxy.com';
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after 3 seconds
    const redirectTimer = setTimeout(() => {
      window.location.href = 'https://heyvoxxy.com';
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, []);

  return (
    <RedirectContainer>
      <BackgroundAnimation />
      <ContentWrapper>
        <Logo src={HEADER} alt="Voxxy" />
        
        <LoadingDots>
          <Dot delay="0s" />
          <Dot delay="0.2s" />
          <Dot delay="0.4s" />
        </LoadingDots>
        
        <Message>{FunMessages[messageIndex]}</Message>
        
        <SubMessage>
          Redirecting to Hey Voxxy in {countdown}...
        </SubMessage>
      </ContentWrapper>
    </RedirectContainer>
  );
};

export default RedirectToHeyVoxxy;