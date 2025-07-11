import React from 'react';
import styled, { keyframes } from 'styled-components';
import headerSvg from '../assets/HEADER.svg';

const colors = {
    background: '#201925',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    accent: '#cc31e8',
    faded: 'rgba(157, 96, 248, 0.15)',
    buttonGradient: 'linear-gradient(to right, rgba(207, 56, 221, 0.9), rgba(211, 148, 245, 0.9), rgba(185, 84, 236, 0.9))',
    buttonHover: 'linear-gradient(135deg, #7b3ea1, #5a1675)',
};

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const NotFoundSection = styled.div`
  background-color: ${colors.background};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out;
`;

const HeaderContainer = styled.div`
  margin-bottom: 3rem;
  
  img {
    width: clamp(180px, 25vw, 300px);
    height: auto;
    filter: brightness(1.1);
  }

  @media (max-width: 640px) {
    margin-bottom: 2rem;
    
    img {
      width: clamp(150px, 40vw, 250px);
    }
  }
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: ${pulse} 2s ease-in-out infinite;
  
  @media (max-width: 640px) {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: ${colors.textPrimary};
  margin-bottom: 1rem;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: ${colors.textSecondary};
  margin-bottom: 2.5rem;
  line-height: 1.5;
  max-width: 500px;
  font-weight: 500;

  @media (max-width: 640px) {
    font-size: 1rem;
    margin-bottom: 2rem;
  }
`;

const ReturnButton = styled.button`
  padding: 0.9rem 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${colors.buttonGradient};
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  font-family: 'Montserrat', sans-serif;
  min-width: 140px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    background: ${colors.buttonHover};
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 640px) {
    padding: 0.8rem 2rem;
    font-size: 0.95rem;
    min-width: 120px;
  }
`;

const ActivityNotFoundScreen = ({ onReturnHome }) => {
    return (
        <NotFoundSection>
            <HeaderContainer>
                <img src={headerSvg} alt="Voxxy" />
            </HeaderContainer>

            <ErrorIcon>🔍</ErrorIcon>

            <Title>Activity Not Found</Title>

            <Message>
                We couldn't find the activity you're looking for. It may have been deleted
                or you might not have permission to view it.
            </Message>

            <ReturnButton onClick={onReturnHome}>
                Return to Home
            </ReturnButton>
        </NotFoundSection>
    );
};

export default ActivityNotFoundScreen;