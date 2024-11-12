import React, { useContext } from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';

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
  font-size: 2.5rem;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Message = styled.p`
  font-size: 1.2rem;
  margin: 20px 0;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const DashboardButton = styled(Button)`
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

const WelcomeComponent = () => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const handleButtonClick = () => {
        navigate('/waitlist');
    };

    return (
        <WelcomeSection>
            <Greeting>Welcome to Voxxy,  {user?.name || 'User'}!</Greeting>
            <Message>Ready to continue managing and viewing your current waitlist?</Message>
            <DashboardButton onClick={handleButtonClick}>Go to Waitlist</DashboardButton>
        </WelcomeSection>
    );
};

export default WelcomeComponent;