import React from 'react';
import styled from 'styled-components';
import StayingHomeImage from '../assets/StayingHome.png';

const AboutContainer = styled.section`
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #000;
`;

const Subtitle = styled.h3`
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  font-weight: normal;
  margin-bottom: 1.5rem;
  color: #666;
`;

const Description = styled.p`
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #444;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto 2rem;

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;

  img {
    width: 100%;
    max-width: 600px;
    height: auto;
  }
`;

const AboutSection = () => (
    <AboutContainer>
        <Title>Why We Built Voxxy</Title>
        <Subtitle>Because Moments Matter More Than Logistics</Subtitle>
        <Description>
            Voxxy was created with one goal in mind: to help people spend less time planning and more time connecting. Whether it’s a dinner with friends, a family vacation, or a team outing, Voxxy takes care of the details so you can focus on what really matters—being present with the people you care about.
        </Description>
        <ImageContainer>
            <img src={StayingHomeImage} alt="Staying Home Illustration" />
        </ImageContainer>
    </AboutContainer>
);

export default AboutSection;