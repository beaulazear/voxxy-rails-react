import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

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

const SectionTitle = styled.p`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  margin: 0;
  color: #fff;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  align-items: stretch;
  justify-content: start;
  margin: 1rem 0;
  box-sizing: border-box;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const ActivityCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ active }) => (active ? '#fff' : '#e0e0e0')};
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  padding: 15px;
  max-width: 250px;
  overflow: hidden;
  pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  opacity: ${({ active }) => (active ? '1' : '0.6')};

  &:hover {
    transform: ${({ active }) => (active ? 'translateY(-5px)' : 'none')};
  }

  .emoji {
    font-size: 4rem;
    margin-top: 1rem;
    line-height: 1;
  }
`;

const ActivityName = styled.h3.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})`
  font-size: clamp(1.1rem, 1.4vw, 1.4rem);
  font-weight: 500;
  color: ${({ active }) => (active ? '#222' : '#777')};
  margin: 0.3rem 0;
  padding: 0;
`;

function StartNewAdventure({ onTripSelect }) {
  const [emojiRain, setEmojiRain] = useState([]);

  const adventures = [
    { name: 'Lets Eat', emoji: '🍜', active: true },
    { name: 'Movie Night', emoji: '🎥', active: false },
    { name: 'Ski Trip', emoji: '🎿', active: false },
    { name: 'Kids Play Date', emoji: '👩‍👧‍👦', active: false },
    { name: 'Find a Destination', emoji: '🗺️', active: false },
    { name: 'Game Night', emoji: '🎮', active: false },
    { name: 'Family Reunion', emoji: '👨‍👩‍👧‍👦', active: false },
    { name: 'Road Trip', emoji: '🚗', active: false },
    { name: 'Lets Meet', emoji: '⏰', active: false },
    { name: 'Trip to Iceland', emoji: '🇮🇸', active: false },
  ];

  const handleSelection = (name) => {
    if (name === "Lets Eat") {
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

    setTimeout(() => {
      setEmojiRain([]);
    }, 2000);
  };

  return (
    <>
      {emojiRain.map((emoji) => (
        <EmojiRain
          key={emoji.id}
          $left={emoji.left}
          $size={emoji.size}
          $duration={emoji.duration}
          $rotation={emoji.rotation}
        >
          🍜
        </EmojiRain>
      ))}

      <SectionTitle>Choose An Activity</SectionTitle>
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
    </>
  );
}

export default StartNewAdventure;