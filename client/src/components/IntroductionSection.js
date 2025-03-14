import React from 'react';
import styled, { keyframes } from 'styled-components';
import BrainstormingImage from '../assets/Brainstorming.png';

// Animation to slightly move elements into place
const fadeInText = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px); /* Starts slightly higher */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInImage = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px); /* Starts slightly lower */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const IntroductionContainer = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  gap: 2rem;
  box-sizing: border-box;
  overflow: hidden;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
    padding: 0 1rem;
    gap: 1.5rem;
  }
`;

const TextContainer = styled.div`
  flex: 1;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  opacity: 0;
  animation: ${fadeInText} 1s ease-out 0.2s forwards; /* Staggered delay */

  @media (max-width: 1024px) {
    align-items: center;
    max-width: 100%;
  }
`;

const Title = styled.h2`
  font-size: clamp(2.5rem, 6vw, 3.8rem);
  font-weight: bold;
  margin-bottom: 1rem;
  color: #000;
  text-align: left;

  @media (max-width: 1024px) {
    text-align: center;
  }
`;

const Subtitle = styled.p`
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  color: #444;
  line-height: 1.6;
  max-width: 95%;

  @media (max-width: 1024px) {
    text-align: center;
    max-width: 100%;
  }
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  opacity: 0;
  animation: ${fadeInImage} 1.2s ease-out 0.4s forwards; /* Slightly slower than text */

  img {
    width: 100%;
    max-width: 550px;
    height: auto;
    object-fit: contain;
  }

  @media (max-width: 1024px) {
    max-width: 400px;
  }
`;

const IntroductionSection = () => (
  <IntroductionContainer>
    <TextContainer>
      <Title>
        Say Hellooo
        <br />
        Voxxxyyy..
      </Title>
      <Subtitle>
        Planning group trips, dinners, and events just got easier. Voxxy listens, organizes, and delivers thoughtful plans everyone can agree on—so you can skip the stress and focus on making memories.
      </Subtitle>
    </TextContainer>
    <ImageContainer>
      <img src={BrainstormingImage} alt="Brainstorming Illustration" />
    </ImageContainer>
  </IntroductionContainer>
);

export default IntroductionSection;