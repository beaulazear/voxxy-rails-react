import React from 'react';
import styled from 'styled-components';
import MovieNightImage from '../assets/MovieNight.png';

const CTAContainer = styled.section`
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const CTATitle = styled.h2`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #000;
`;

const CTASubtitle = styled.p`
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #666;
  margin-bottom: 2rem;
`;

const CTAButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;

  &:first-child {
    background: linear-gradient(135deg, #f3f4f6, #e0e7ff);
    color: #000;
  }

  &:last-child {
    background: linear-gradient(135deg, #c7d2fe, #e0e7ff);
    color: #000;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;

  img {
    width: 100%;
    max-width: 700px; /* Increased max-width for larger screens */
    height: auto;

    @media (max-width: 768px) {
      max-width: 350px;
    }
  }
`;

const CallToActionSection = () => (
    <CTAContainer>
        <CTATitle>Ready to make memories?</CTATitle>
        <CTASubtitle>
            Sign up now and let Voxxy take the stress out of your next group adventure.
        </CTASubtitle>
        <ImageContainer>
            <img src={MovieNightImage} alt="Movie Night Illustration" />
        </ImageContainer>
        <CTAButtons>
            <Button>Sign Up for Free</Button>
            <Button>Chat with Voxxy</Button>
        </CTAButtons>
    </CTAContainer>
);

export default CallToActionSection;