import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import colors from '../styles/Colors';
import { Heading2, MutedText } from '../styles/Typography';
import { UserContext } from '../context/user';
import HEADER from '../assets/HEADER.svg';

const PlaceholderContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.gradient.start} 0%, ${colors.gradient.end} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const ContentCard = styled.div`
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
`;

const Logo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
  filter: brightness(0) invert(1);
  
  @media (max-width: 768px) {
    width: 100px;
    margin-bottom: 1.5rem;
  }
`;

const SubHeading = styled(Heading2)`
  color: ${colors.textSecondary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }
`;

const Description = styled(MutedText)`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 2rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  
  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const BaseButton = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  color: ${colors.textPrimary};
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-width: 200px;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
    min-width: 180px;
  }
`;

const MobileAppBadge = styled(BaseButton)`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

const LogoutButton = styled(BaseButton).attrs({ as: 'button' })`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: ${colors.textPrimary};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const AppleIcon = styled.div`
  width: 24px;
  height: 24px;
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'/%3E%3C/svg%3E") no-repeat center;
  mask-size: contain;
`;

const FloatingOrb = styled.div`
  position: absolute;
  width: ${props => props.size || '100px'};
  height: ${props => props.size || '100px'};
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  top: ${props => props.top || '10%'};
  left: ${props => props.left || '10%'};
  animation: float 6s ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
  
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); }
    33% { transform: translateY(-20px) translateX(10px); }
    66% { transform: translateY(10px) translateX(-5px); }
  }
`;

const ComingSoonPlaceholder = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    fetch(`${API_URL}/logout`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(() => {
      setUser(null);
      navigate('/');
    }).catch((error) => {
      console.error('Logout error:', error);
      // Still clear user state and navigate even if API call fails
      setUser(null);
      navigate('/');
    });
  };
  
  return (
    <PlaceholderContainer>
      <FloatingOrb size="150px" top="5%" left="5%" delay="0s" />
      <FloatingOrb size="100px" top="20%" left="85%" delay="2s" />
      <FloatingOrb size="80px" top="70%" left="10%" delay="4s" />
      <FloatingOrb size="120px" top="60%" left="80%" delay="1s" />
      
      <ContentCard>
        <Logo src={HEADER} alt="Voxxy" />
        
        <SubHeading>
          Coming Soon
        </SubHeading>
        
        <Description>
          We're cooking up something amazing! Voxxy Planner is being reimagined 
          to make group planning even more seamless and delightful. 
        </Description>
        
        <Description>
          In the meantime, get ready for <strong>Voxxy Mobile</strong> — 
          the ultimate planning companion coming to iOS.
        </Description>
        
        <ButtonContainer>
          <MobileAppBadge>
            <AppleIcon />
            <span>Coming to App Store</span>
          </MobileAppBadge>
          
          <LogoutButton onClick={handleLogout}>
            Return to Landing Page
          </LogoutButton>
        </ButtonContainer>
      </ContentCard>
    </PlaceholderContainer>
  );
};

export default ComingSoonPlaceholder;