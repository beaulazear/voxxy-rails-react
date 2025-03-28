import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Voxxy_header from '../assets/Voxxy_header.jpeg';

// Image fade-in animation
const fadeInZoom = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

// Delayed text fade-in
const fadeInText = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HeroContainer = styled.section`
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: ${fadeInZoom} 1.2s ease-out;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0) 100%);
`;

const VoxieGraphic = styled.img`
  max-width: 420px;
  width: 75%;
  height: auto;
  opacity: 0;
  transform: translateY(20px);
  animation: ${fadeInZoom} 1.5s ease-out forwards;

  @media (max-width: 768px) {
    max-width: 280px;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: bold;
  color: #000;
  text-align: center;
  padding-top: 1rem;
  margin-bottom: 0;
  margin-top: 0;
  opacity: 0;
  animation: ${fadeInText} 1s ease-out 0.8s forwards; /* Delayed fade-in */

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const HeroSection = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = Voxxy_header;
    img.onload = () => setImageLoaded(true);
  }, []);

  return (
    <HeroContainer>
      {imageLoaded ? (
        <>
          <VoxieGraphic src={Voxxy_header} alt="Voxie Logo" />
          <HeroTitle>
            Plans Made Simple
          </HeroTitle>
        </>
      ) : null}
    </HeroContainer>
  );
};

export default HeroSection;