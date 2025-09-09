import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

// Animations
const bounceIn = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const wiggle = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(3deg); }
  50% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
  100% { transform: rotate(0deg); }
`;

const Container = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #201925 0%, #2D1B47 100%);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 40px 32px 32px 32px;
  gap: 24px;
  
  @media (max-width: 768px) {
    padding: 32px 24px 24px 24px;
    gap: 20px;
  }
`;

const BackButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }

  svg {
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const TitleContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 48px; // Balance the back button
  
  @media (max-width: 768px) {
    margin-right: 44px;
  }
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Sparkles = styled.span`
  font-size: 28px;
  transform: rotate(15deg);
  display: inline-block;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin: 0 0 60px 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 40px;
  }
`;

const ButtonsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px 60px 32px;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 0 24px 40px 24px;
    gap: 20px;
  }
`;

const OptionButton = styled.button`
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  border: none;
  padding: 0;
  position: relative;
  animation: ${bounceIn} 0.5s ease-out;
  animation-delay: ${props => props.$delay || '0s'};
  animation-fill-mode: backwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(-2px);
  }
  
  ${props => props.$selected && css`
    animation: ${wiggle} 0.3s ease-in-out;
  `}
  
  @media (max-width: 768px) {
    &:active {
      transform: scale(0.98);
    }
  }
`;

const GradientButton = styled.div`
  background: ${props => props.$gradient};
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  border: ${props => props.$selected ? '3px solid rgba(255, 255, 255, 0.4)' : '3px solid transparent'};
  border-radius: 24px;
  
  @media (max-width: 768px) {
    padding: 28px;
  }
`;

const IconCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  
  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
    margin-bottom: 16px;
  }
`;

const ButtonIcon = styled.span`
  font-size: 40px;
  
  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const ButtonTitle = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 8px 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const ButtonDescription = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const SelectedText = styled.span`
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const ComingSoonSection = styled.div`
  padding: 20px 32px 40px 32px;
  
  @media (max-width: 768px) {
    padding: 20px 24px 32px 24px;
  }
`;

const ComingSoonTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  margin: 0 0 16px 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const ComingSoonGrid = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const ComingSoonItem = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const ComingSoonEmoji = styled.span`
  font-size: 20px;
`;

const ComingSoonText = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

// Arrow Left Icon Component
const ArrowLeftIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

function StartNewAdventure({ onTripSelect, onBack }) {
  const [selected, setSelected] = useState(null);

  const handleSelection = (type) => {
    setSelected(type);
    
    // Navigate after animation
    setTimeout(() => {
      // Map to the existing trip types expected by TripDashboard
      if (type === 'Restaurant') {
        onTripSelect('Lets Eat');
      } else if (type === 'Bar') {
        onTripSelect('Night Out');
      }
    }, 400);
  };

  return (
    <Container>
      {/* Header */}
      <Header>
        <BackButton onClick={onBack}>
          <ArrowLeftIcon />
        </BackButton>
        <TitleContainer>
          <Title>
            Pick Your Vibe
            <Sparkles>✨</Sparkles>
          </Title>
        </TitleContainer>
      </Header>

      <Subtitle>What sounds good tonight?</Subtitle>

      {/* Two Big Buttons */}
      <ButtonsContainer>
        {/* Restaurant Button */}
        <OptionButton
          onClick={() => handleSelection('Restaurant')}
          $selected={selected === 'Restaurant'}
          $delay="0.1s"
        >
          <GradientButton
            $gradient="linear-gradient(135deg, #FF6B6B, #FF8787)"
            $selected={selected === 'Restaurant'}
          >
            <IconCircle>
              <ButtonIcon>🍴</ButtonIcon>
            </IconCircle>
            <ButtonTitle>Restaurant</ButtonTitle>
            <ButtonDescription>Great food awaits</ButtonDescription>
            {selected === 'Restaurant' && (
              <SelectedBadge>
                <SelectedText>✓ Selected</SelectedText>
              </SelectedBadge>
            )}
          </GradientButton>
        </OptionButton>

        {/* Bar Button */}
        <OptionButton
          onClick={() => handleSelection('Bar')}
          $selected={selected === 'Bar'}
          $delay="0.2s"
        >
          <GradientButton
            $gradient="linear-gradient(135deg, #4ECDC4, #6DD5CE)"
            $selected={selected === 'Bar'}
          >
            <IconCircle>
              <ButtonIcon>🍷</ButtonIcon>
            </IconCircle>
            <ButtonTitle>Bar</ButtonTitle>
            <ButtonDescription>Cocktails, beer, and good vibes</ButtonDescription>
            {selected === 'Bar' && (
              <SelectedBadge>
                <SelectedText>✓ Selected</SelectedText>
              </SelectedBadge>
            )}
          </GradientButton>
        </OptionButton>
      </ButtonsContainer>

      {/* Coming Soon Section */}
      <ComingSoonSection>
        <ComingSoonTitle>More Coming Soon</ComingSoonTitle>
        <ComingSoonGrid>
          <ComingSoonItem>
            <ComingSoonEmoji>☕</ComingSoonEmoji>
            <ComingSoonText>Coffee</ComingSoonText>
          </ComingSoonItem>
          <ComingSoonItem>
            <ComingSoonEmoji>🥐</ComingSoonEmoji>
            <ComingSoonText>Brunch</ComingSoonText>
          </ComingSoonItem>
          <ComingSoonItem>
            <ComingSoonEmoji>🍰</ComingSoonEmoji>
            <ComingSoonText>Dessert</ComingSoonText>
          </ComingSoonItem>
        </ComingSoonGrid>
      </ComingSoonSection>
    </Container>
  );
}

export default React.memo(StartNewAdventure);