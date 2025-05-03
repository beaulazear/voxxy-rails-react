import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import mixpanel from 'mixpanel-browser';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors';

const rainAnimation = keyframes`
  0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg) scale(0.8); opacity: 0; }
`;

const EmojiRain = styled.div`
  position: fixed;
  top: -5%;
  left: ${({ $left }) => $left}%;
  font-size: ${({ $size }) => $size}rem;
  animation: ${rainAnimation} ${({ $duration }) => $duration}s linear forwards;
  z-index: 999;
  pointer-events: none;
  transform: rotate(${({ $rotation }) => $rotation}deg);
`;

const SectionWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 3rem;
  padding-left: 3rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 960px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(1, minmax(120px, 1fr));
    gap: 0.75rem;
  }
`;
const GradientText = styled.span`
  background: linear-gradient(90deg, #B931D6 0%, #9051E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ActivityCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #3a2a40;
  border-radius: 12px;
  padding: 1.5rem;
  color: #fff;
  cursor: ${({ active }) => (active ? 'pointer' : 'default')};
  opacity: ${({ active }) => (active ? 1 : 0.5)};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid transparent;
  ${({ active }) => active && `
    border-image: linear-gradient(135deg,
      hsl(291, 80%, 55%, 0.9),
      hsl(262, 95%, 70%, 0.9),
      hsl(267, 90%, 65%, 0.9)
    ) 1;
  `}

  &:hover {
    transform: ${({ active }) => (active ? 'translateY(-5px)' : 'none')};
    box-shadow: ${({ active }) => (active ? '0 8px 16px rgba(0,0,0,0.2)' : 'none')};
  }

  .emoji {
    font-size: 3.5rem;
    margin-bottom: 0.5rem;
    line-height: 1;
  }
`;

const ActivityName = styled.h3.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})`
  font-size: clamp(1rem, 1.5vw, 1.3rem);
  font-weight: 500;
  color: #fff;
  margin: 0.25rem 0 0;
  text-align: center;
`;

const AdminHero = styled.section`
  background-color: ${colors.background};
  color: ${colors.textPrimary};
  text-align: center;
  padding: 1rem 1.5rem;
  padding-top: 120px;
  box-sizing: border-box;
`;
const AdminHeroContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;
const AdminTitle = styled(Heading1)`
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;
const AdminSubtitle = styled(MutedText)`
  font-size: 1.125rem;
  color: ${colors.textMuted};
  max-width: 700px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
`;

function StartNewAdventure({ onTripSelect }) {
  const [emojiRain, setEmojiRain] = useState([]);

  const adventures = [
    { name: 'Lets Eat', emoji: '🍜', active: true },
    { name: 'Lets Meet', emoji: '⏰', active: true },
    { name: 'Movie Night', emoji: '🎥', active: false },
    { name: 'Ski Trip', emoji: '🎿', active: false },
    { name: 'Kids Play Date', emoji: '👩‍👧‍👦', active: false },
    { name: 'Find a Destination', emoji: '🗺️', active: false },
    { name: 'Game Night', emoji: '🎮', active: false },
    { name: 'Family Reunion', emoji: '👨‍👩‍👧‍👦', active: false },
    { name: 'Road Trip', emoji: '🚗', active: false },
    { name: 'Trip to Iceland', emoji: '🇮🇸', active: false },
  ];

  const handleSelection = (name) => {
    if (name === "Lets Eat") {
      if (process.env.NODE_ENV === 'production') {
        mixpanel.track('Lets Eat Clicked', { name });
      }
      triggerEmojiRain();
    }
    onTripSelect(name);
  };

  const triggerEmojiRain = () => {
    const emojis = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 1.5 + 1,
      duration: Math.random() * 1 + 1.5,
      rotation: Math.random() * 360,
    }));
    setEmojiRain(emojis);
    setTimeout(() => setEmojiRain([]), 2000);
  };

  return (
    <>
      {emojiRain.map(({ id, left, size, duration, rotation }) => (
        <EmojiRain
          key={id}
          $left={left}
          $size={size}
          $duration={duration}
          $rotation={rotation}
        >
          🍜
        </EmojiRain>
      ))}
      <AdminHero>
        <AdminHeroContainer>
          <AdminTitle>
            New <GradientText>Voxxy</GradientText> Board
          </AdminTitle>
          <AdminSubtitle>
           Choose an activity to start planning!
          </AdminSubtitle>
        </AdminHeroContainer>
      </AdminHero>
      <SectionWrapper>

        <CardGrid>
          {adventures.map(({ name, emoji, active }) => (
            <ActivityCard
              key={name}
              active={active}
              onClick={active ? () => handleSelection(name) : undefined}
            >
              <div className="emoji">{emoji}</div>
              <ActivityName active={active}>{name}</ActivityName>
            </ActivityCard>
          ))}
        </CardGrid>
      </SectionWrapper>
    </>
  );
}

export default StartNewAdventure;