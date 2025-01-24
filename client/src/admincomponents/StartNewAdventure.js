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

const ActivityCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active', // Filter out 'active'
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ active }) => (active ? '#fff' : '#e0e0e0')};
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  padding: 0;
  max-width: 250px;
  overflow: hidden;
  pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  opacity: ${({ active }) => (active ? '1' : '0.6')};

  &:hover {
    transform: ${({ active }) => (active ? 'translateY(-5px)' : 'none')};
  }

  img {
    width: 100%;
    height: auto;
    max-height: 70%;
    object-fit: contain;
    background: transparent;
    border-radius: 8px 8px 0 0;
  }

  h3 {
    font-size: clamp(1rem, 1.2vw, 1.5rem);
    color: ${({ active }) => (active ? '#333' : '#888')};
    line-height: 1.2;
    margin-top: auto;
    padding: 0.3rem;
  }
`;

function StartNewAdventure({ onTripSelect }) {
  const adventures = [
    { name: 'Choose a Restaurant', icon: '/assets/Restaurant.jpg', active: true },
    { name: 'Choose a Movie', icon: '/assets/Movie.jpg', active: false },
    { name: 'Ski Trip', icon: '/assets/Ski.jpg', active: false },
    { name: 'Kids Play Date', icon: '/assets/Kids.jpg', active: false },
    { name: 'Choose a Destination', icon: '/assets/Restaurant.jpg', active: false },
    { name: 'Game Night', icon: '/assets/Game.jpg', active: false },
    { name: 'Family Reunion', icon: '/assets/Family.jpg', active: false },
    { name: 'Road Trip', icon: '/assets/RoadTrip.jpg', active: false },
    { name: 'Choose a Time', icon: '/assets/Time.jpg', active: false },
    { name: 'Trip to Iceland', icon: '/assets/Iceland.jpg', active: false },
  ];

  return (
    <div>
      <SectionTitle>Choose An Activity</SectionTitle>
      <CardGrid>
        {adventures.map(({ name, icon, active }) => (
          <ActivityCard
            key={name}
            active={active}
            onClick={active ? () => onTripSelect(name) : undefined}
          >
            <img src={icon} alt={name} />
            <h3>{name}</h3>
          </ActivityCard>
        ))}
      </CardGrid>
    </div>
  );
}

export default StartNewAdventure;