import React from 'react';
import styled from 'styled-components';

const HeroContainer = styled.section`
  text-align: center;
  padding: 10rem 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  /* Subtle Elliptical Gradient */
  &::before {
    content: "";
    position: absolute;
    width: 60vw; /* Wider to create an oval shape */
    height: 35vh; /* Shorter height for an elliptical effect */
    background: radial-gradient(ellipse at center, rgba(138, 43, 226, 0.25) 10%, rgba(255, 255, 255, 0) 60%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: -1;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: 4rem 1.5rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(1.7rem, 5vw, 3.2rem);
  font-weight: bold;
  margin-bottom: 0.4rem;
  color: #000;
  text-align: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: .5rem;
    margin-bottom: 0;
  }
`;

const HeroSection = () => {
  return (
    <HeroContainer>
      <HeroTitle>
        Less Time Planning...
        <br />
        More Time Making Memories
      </HeroTitle>
    </HeroContainer>
  );
};

export default HeroSection;