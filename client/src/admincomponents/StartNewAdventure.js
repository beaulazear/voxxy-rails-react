import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  flex: 1;
  background-color: #201925;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  background-color: #201925;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 40px 32px 32px 32px;
  gap: 24px;
  border-bottom: 1px solid rgba(64, 51, 71, 0.2);
  
  @media (max-width: 768px) {
    padding: 32px 24px 24px 24px;
    gap: 20px;
  }
`;

const BackButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background-color: rgba(139, 92, 246, 0.9);
  border: 1px solid #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(139, 92, 246, 1);
    transform: translateY(-1px);
  }

  svg {
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const HeaderContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin: 0 0 12px 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 768px) {
    font-size: 28px;
    margin: 0 0 8px 0;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(135deg, #B931D6, #e942f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #ccc;
  text-align: center;
  line-height: 1.4;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(64, 51, 71, 0.1);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.5);
  }
  
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) rgba(64, 51, 71, 0.1);
`;

const ScrollContent = styled.div`
  padding: 40px 32px 48px 32px;
  
  @media (max-width: 768px) {
    padding: 32px 24px 40px 24px;
  }
  
  @media (max-width: 480px) {
    padding: 24px 16px 32px 16px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    gap: 20px;
  }
  
  @media (max-width: 480px) {
    gap: 16px;
  }
  
  @media (max-width: 380px) {
    gap: 12px;
  }
`;

const ActivityCard = styled.button`
  background-color: #3a2a40;
  border-radius: 20px;
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-height: 200px;
  position: relative;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.$active ? `
    border-color: #B931D6;
    opacity: 1;
    box-shadow: 0 4px 8px rgba(185, 49, 214, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(185, 49, 214, 0.4);
      background-color: #423249;
    }
    
    &:active {
      transform: translateY(0);
    }
  ` : `
    border-color: rgba(64, 51, 71, 0.3);
    opacity: 0.5;
    cursor: not-allowed;
  `}

  @media (max-width: 768px) {
    padding: 32px 24px;
    min-height: 180px;
    border-radius: 18px;
  }
  
  @media (max-width: 480px) {
    padding: 24px 16px;
    min-height: 160px;
    border-radius: 16px;
  }
  
  @media (max-width: 380px) {
    padding: 20px 12px;
    min-height: 140px;
    border-radius: 14px;
  }
`;

const Emoji = styled.div`
  font-size: 56px;
  line-height: 1.2;
  margin-bottom: 16px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  @media (max-width: 480px) {
    font-size: 40px;
    margin-bottom: 10px;
  }
  
  @media (max-width: 380px) {
    font-size: 32px;
    margin-bottom: 8px;
  }
`;

const ActivityName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.$active ? '#fff' : '#888'};
  text-align: center;
  margin: 0 0 12px 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;

  @media (max-width: 768px) {
    font-size: 16px;
    margin: 0 0 10px 0;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
    margin: 0 0 8px 0;
  }
  
  @media (max-width: 380px) {
    font-size: 13px;
    margin: 0 0 6px 0;
  }
`;

const Description = styled.p`
  font-size: 14px;
  color: ${props => props.$active ? '#ccc' : '#666'};
  text-align: center;
  line-height: 1.4;
  margin: 0;
  flex-shrink: 1;

  @media (max-width: 768px) {
    font-size: 13px;
  }
  
  @media (max-width: 480px) {
    font-size: 12px;
    line-height: 1.3;
  }
  
  @media (max-width: 380px) {
    font-size: 11px;
    line-height: 1.3;
  }
`;

const ComingSoonBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(255, 152, 0, 0.9);
  padding: 6px 10px;
  border-radius: 10px;
  
  span {
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    border-radius: 8px;
    
    span {
      font-size: 9px;
    }
  }
  
  @media (max-width: 480px) {
    top: 8px;
    right: 8px;
    padding: 3px 6px;
    border-radius: 6px;
    
    span {
      font-size: 8px;
      letter-spacing: 0.3px;
    }
  }
`;

// Arrow Left Icon Component
const ArrowLeftIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export default function StartNewAdventure({ onTripSelect, onBack }) {
  const adventures = [
    {
      name: 'Lets Eat',
      emoji: '🍜',
      active: true,
      description: 'Schedule your next group meal together.'
    },
    {
      name: 'Night Out',
      emoji: '🍸',
      active: true,
      description: 'Plan your perfect night out with friends.'
    },
    {
      name: 'Lets Meet',
      emoji: '⏰',
      active: true,
      description: 'Find a time that works for everyone.'
    },
    {
      name: 'Game Night',
      emoji: '🎮',
      active: true,
      description: 'Set up a memorable game night.'
    },
    {
      name: 'Find a Destination',
      emoji: '🗺️',
      active: false,
      description: 'Discover new travel destinations.'
    },
    {
      name: 'Movie Night',
      emoji: '🎥',
      active: false,
      description: 'Plan your perfect movie night.'
    },
    {
      name: 'Kids Play Date',
      emoji: '👩‍👧‍👦',
      active: false,
      description: 'Coordinate a fun playdate for little ones.'
    },
    {
      name: 'Family Reunion',
      emoji: '👨‍👩‍👧‍👦',
      active: false,
      description: 'Plan a family gathering.'
    },
  ];

  const handleSelection = (name, active) => {
    if (!active) return;
    onTripSelect(name);
  };

  const renderActivityCard = (adventure, index) => {
    const { name, emoji, active, description } = adventure;

    return (
      <ActivityCard
        key={name}
        $active={active}
        onClick={() => handleSelection(name, active)}
        disabled={!active}
      >
        <Emoji>{emoji}</Emoji>
        <ActivityName $active={active}>{name}</ActivityName>
        <Description $active={active}>{description}</Description>
        {!active && (
          <ComingSoonBadge>
            <span>Coming Soon</span>
          </ComingSoonBadge>
        )}
      </ActivityCard>
    );
  };

  return (
    <Container>
      {/* Fixed Header */}
      <Header>
        <BackButton onClick={onBack}>
          <ArrowLeftIcon />
        </BackButton>
        <HeaderContent>
          <Title>
            New <GradientText>Voxxy</GradientText> Board
          </Title>
          <Subtitle>Choose an activity to start planning!</Subtitle>
        </HeaderContent>
      </Header>

      <ScrollContainer>
        <ScrollContent>
          <Grid>
            {adventures.map((adventure, index) =>
              renderActivityCard(adventure, index)
            )}
          </Grid>
        </ScrollContent>
      </ScrollContainer>
    </Container >
  );
}