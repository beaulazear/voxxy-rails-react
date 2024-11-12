import React, { useContext } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';

// Global style to import the Caveat and Roboto fonts
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');
`;

const WelcomeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100vh;
  background: linear-gradient(135deg, #4b0082, #8b00ff);
  color: white;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const Greeting = styled.h1`
  font-size: 4rem;
  font-weight: 600;
  font-family: 'Caveat', cursive;
  line-height: 1.2;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const Message = styled.p`
  font-size: 1.5rem;
  margin: 20px 0;
  max-width: 750px;
  line-height: 1.6;
  font-family: 'Roboto', sans-serif;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const DashboardButton = styled(Button)`
  background-color: white;
  color: #4b0082;
  border: none;
  font-size: 1.25rem;
  padding: 0.75rem 2.5rem;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f3f3f3;
    color: #4b0082;
  }
`;

const WelcomeComponent = () => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const handleButtonClick = () => {
        navigate('/waitlist');
    };

    return (
        <>
            <GlobalStyle />
            <WelcomeSection>
                <Greeting>Welcome to Voxxy, {user?.name || 'User'}!</Greeting>
                <Message>Ready to continue managing and viewing your current waitlist?</Message>
                <DashboardButton onClick={handleButtonClick}>Go to Waitlist</DashboardButton>
            </WelcomeSection>
        </>
    );
};

export default WelcomeComponent;