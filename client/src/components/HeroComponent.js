import React from 'react';
import styled from 'styled-components';
import { Button } from 'antd';

const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 60vh;
  background: linear-gradient(135deg, #6a0dad, #9b19f5);
  color: white;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding-top: 20px; /* Less padding on smaller screens */
  }

`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin: 20px 0;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StyledButton = styled(Button)`
  background-color: #444;
  color: white;
  border: none;
  font-size: 1rem;
  padding: 0.5rem 2rem;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #666;
    color: white;
  }
`;

const HeroComponent = () => {
    return (
        <HeroSection>
            <Title>Say Hello Voxxy</Title>
            <Subtitle>Unlock Customer Insights at Scale with your AI Interview Agent</Subtitle>
            <StyledButton>Join Our Wait List!</StyledButton>
        </HeroSection>
    );
};

export default HeroComponent;
