import React from 'react';
import styled from 'styled-components';
import BrainstormingImage from '../assets/Brainstorming.png';

const IntroductionContainer = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1rem;
  }
`;

const TextContainer = styled.div`
  flex: 1;
  max-width: 500px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const Title = styled.h2`
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #000;
`;

const Subtitle = styled.p`
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #444;
  line-height: 1.5;
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    max-width: 400px;
    height: auto;
  }

  @media (max-width: 768px) {
    max-width: 300px;
  }
`;

const IntroductionSection = () => (
    <IntroductionContainer>
        <TextContainer>
            <Title>Say Hellooo Voxxxyyy..</Title>
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