import React from 'react';
import styled from 'styled-components';

const SectionTitle = styled.h2`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: bold;
  margin: 0;
  text-align: left;
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

const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  padding: 0;
  max-width: 250px;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
  }

  img {
    width: 100%;
    height: 70%;
    object-fit: cover;
    border-radius: 8px 8px 0 0;
  }

  h3 {
    font-size: clamp(1rem, 1.2vw, 1.5rem);
    color: #333;
    line-height: 1.2;
    margin-top: auto;
    padding: 0.3rem;
  }
`;

function StartNewAdventure({ onTripSelect }) {
  const adventures = [
    { name: 'Ski Trip', icon: '/assets/ski-trip-icon.png' },
    { name: 'Choose a Destination', icon: '/assets/choose-destination-icon.png' },
    { name: 'Game Night', icon: '/assets/game-night-icon.png' },
    { name: 'Dinner Plans', icon: '/assets/dinner-plans-icon.png' },
    { name: 'Suggest an Adventure', icon: '/assets/request-a-trip-icon.png' },
  ];

  return (
    <div>
      <SectionTitle>Choose An Activity</SectionTitle>
      <CardGrid>
        {adventures.map(({ name, icon }) => (
          <ActivityCard key={name} onClick={() => onTripSelect(name)}>
            <img src={icon} alt={name} />
            <h3>{name}</h3>
          </ActivityCard>
        ))}
      </CardGrid>
    </div>
  );
}

export default StartNewAdventure;