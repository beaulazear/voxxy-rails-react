import React from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

// Removed GlobalStyle since fonts are now globally applied via index.html

const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 60vh;
  background: linear-gradient(to right, #7F31D9 0%, #431A73 100%);
  color: white;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const Title = styled.h1`
  font-size: 3rem; /* Adjusted font size for better emphasis */
  font-weight: 400; /* Adjust weight as needed for desired thickness */
  font-family: 'Unbounded', sans-serif; /* Ensure Unbounded is applied */
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  margin-top: 10px;
  font-size: 1.8rem;
  margin-bottom: 20px;
  max-width: 750px;
  line-height: 1.6;
  font-family: 'Montserrat', sans-serif;

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
    <HeroSection>
      <Title>Hello Voxxy!</Title>
      <Subtitle>Understand your customers like never before with conversational, AI-powered feedback.</Subtitle>
      <StyledButton onClick={handleButtonClick}>Join Our Waitlist</StyledButton>
    </HeroSection>
  );
};

export default HeroComponent;