import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import headerSvg from '../assets/HEADER.svg';

const colors = {
  background: '#201925',
  textPrimary: '#FFFFFF',
  accent: '#cc31e8',
  faded: 'rgba(157, 96, 248, 0.15)',
};

const pulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

const scrub = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

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

const HeaderContainer = styled.div`
  margin-bottom: 3rem;
  
  img {
    width: clamp(180px, 25vw, 300px);
    height: auto;
    filter: brightness(1.1);
  }

  @media (max-width: 640px) {
    margin-bottom: 2rem;
    
    img {
      width: clamp(150px, 40vw, 250px);
    }
  }
`;

const ScrubContainer = styled.div`
  position: relative;
  width: 240px;
  height: 5px;
  background-color: ${colors.faded};
  border-radius: 3px;
  margin: 2.5rem 0;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(204, 49, 232, 0.1);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 80px;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      ${colors.accent}, 
      rgba(204, 49, 232, 0.8),
      ${colors.accent},
      transparent
    );
    animation: ${scrub} 1.8s ease-in-out infinite;
    border-radius: 3px;
  }

  @media (max-width: 640px) {
    width: 180px;
    height: 4px;
    
    &::after {
      width: 60px;
    }
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${colors.accent};
  margin-top: 1rem;
  animation: ${pulse} 3s ease-in-out infinite;
  font-weight: 500;
  letter-spacing: 0.5px;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const LoadingScreen = ({ onLoadingComplete }) => {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Minimum display time of 3 seconds to see the full scrub animation
    const timer = setTimeout(() => {
      setShowLoading(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!showLoading) return null;

  return React.createElement(LoadingSection, null,
    React.createElement(HeaderContainer, null,
      React.createElement('img', {
        src: headerSvg,
        alt: 'Voxxy'
      })
    ),
    React.createElement(ScrubContainer, null),
    React.createElement(Subtitle, null, 'doing some quick magic ✨')
  );
};

export default LoadingScreen;