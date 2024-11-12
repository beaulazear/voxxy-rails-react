import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
`;

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
    padding-top: 20px;
  }
`;

const Title = styled.h1`
  font-size: 5rem; // Increased font size for more emphasis
  font-weight: 600;
  font-family: 'Caveat', cursive;
  line-height: 1.2; // Added line spacing for better readability

  @media (max-width: 768px) {
    font-size: 4rem;
  }
`;

const Subtitle = styled.p`
margin-top 10px;
  font-size: 1.8rem;
  margin-bottom: 20px;
  max-width: 750px;
  line-height: 1.6; // Added more line spacing for improved readability

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const StyledButton = styled(Button)`
  background-color: white;
  color: #6a0dad;
  border: none;
  font-size: 1rem;
  padding: 0.75rem 2rem;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f3f3f3;
    color: #6a0dad;
  }
`;

const HeroComponent = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/waitlist');
  };

  return (
    <>
      <GlobalStyle />
      <HeroSection>
        <Title>Hello Voxxy!</Title>
        <Subtitle>Understand your customers like never before with conversational, AI-powered feedback.</Subtitle>
        <StyledButton onClick={handleButtonClick}>Join Our Waitlist</StyledButton>
      </HeroSection>
    </>
  );
};

export default HeroComponent;