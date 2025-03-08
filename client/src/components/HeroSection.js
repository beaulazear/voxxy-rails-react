import React from 'react';
import styled from 'styled-components';

const HeroContainer = styled.section`
  text-align: center;
  padding: 10rem 5rem; // Further increased padding
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 5rem 2rem; // Further increased padding for mobile
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(1.5rem, 5vw, 3rem);
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

const HeroSubtitle = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  margin-bottom: 1.5rem;
  color: #444;
  max-width: 600px;
  text-align: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: .5rem;
  }
`;

const HeroSection = () => {
  return (
    <HeroContainer>
      <HeroTitle>
        Less Time Planning
        <br />
        More Time Making Memories
      </HeroTitle>
      <HeroSubtitle>
        Voxxy handles the details, so you can focus on sharing moments, laughter, and stories with the people who matter most.
      </HeroSubtitle>
    </HeroContainer>
  )
};

export default HeroSection;