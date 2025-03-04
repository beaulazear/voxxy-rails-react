import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

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
    padding: 1rem;
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
    padding: 1rem;
  }
`;

const HeroButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 2rem; // Further increased padding
`;

const PrimaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: linear-gradient(135deg, #f3f4f6, #e0e7ff);
  color: #000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  }
`;

const SecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: linear-gradient(135deg, #c7d2fe, #e0e7ff);
  color: #000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: linear-gradient(135deg, #e0e7ff, #f3f4f6);
  }
`;

const HeroSection = () => {
  const navigate = useNavigate()

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleSignupClick = () => {
    navigate('/signup')
  }

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
      <HeroButtons>
        <PrimaryButton onClick={handleSignupClick}>Sign Up for Free</PrimaryButton>
        <SecondaryButton onClick={handleLoginClick}>Chat with Voxxy</SecondaryButton>
      </HeroButtons>
    </HeroContainer>
  )
};

export default HeroSection;