import React from 'react';
import styled from 'styled-components';
import mixpanel from 'mixpanel-browser';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors';
import Logo from '../assets/v_no_bg.svg';
import { Link } from 'react-router-dom';

const SectionWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 3rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 2fr));
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
  margin: 0.25rem 0;
  text-align: center;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #ccc;
  text-align: center;
  margin: 0.5rem 0 0;
  max-height: 3rem;
  overflow: hidden;
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
  margin: 0 auto 1rem;
  line-height: 1.6;
`;
const GoBackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.2rem;
  border: 2px solid #A441DC;
  background: none;
  color: ${colors.textMuted};
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px,
              rgba(0, 0, 0, 0.12) 0px -12px 30px,
              rgba(0, 0, 0, 0.12) 0px 4px 6px,
              rgba(0, 0, 0, 0.17) 0px 12px 13px,
              rgba(0, 0, 0, 0.09) 0px -3px 5px;
  margin-bottom: 1.5rem;
  text-decoration: none;

  &:hover {
    background: rgba(164, 65, 220, 0.08);
    transform: translateY(-1px);
    box-shadow: 0px 4px 6px rgba(0,0,0,0.1);
  }
`;
const LogoIcon = styled.img`
  width: 1.3rem;
  height: 1.3rem;
  margin-left: 0.5rem;
`;

function StartNewAdventure({ onTripSelect }) {
  const adventures = [
    { name: 'Find a Restaurant', emoji: '🍜', active: true, description: 'Personalized recommendations for the whole group.' },
    { name: 'Schedule a Meeting', emoji: '⏰', active: true, description: 'Find a time that works for everyone.' },
    { name: 'Movie Night', emoji: '🎥', active: false, description: 'Plan your perfect movie night.' },
    { name: 'Ski Trip', emoji: '🎿', active: false, description: 'Organize your next ski adventure.' },
    { name: 'Kids Play Date', emoji: '👩‍👧‍👦', active: false, description: 'Coordinate a fun playdate for little ones with ease.' },
    { name: 'Find a Destination', emoji: '🗺️', active: false, description: 'Discover new travel destinations.' },
    { name: 'Game Night', emoji: '🎮', active: false, description: 'Pick games and set up a memorable game night.' },
    { name: 'Family Reunion', emoji: '👨‍👩‍👧‍👦', active: false, description: 'Plan a family gathering with activities and meals.' },
    { name: 'Road Trip', emoji: '🚗', active: false, description: 'Map out your road trip route and must-see stops.' },
  ];

  const handleSelection = (name) => {
    if (process.env.NODE_ENV === 'production') {
      mixpanel.track(`${name} Clicked`, { name });
    }
    onTripSelect(name);
  };

  return (
    <>
      <AdminHero>
        <AdminHeroContainer>
          <AdminTitle>
            New <GradientText>Voxxy</GradientText> Board
          </AdminTitle>
          <AdminSubtitle>Choose an activity to start planning!</AdminSubtitle>
          <GoBackButton to="/dashboard">
            Return to Dashboard
            <LogoIcon src={Logo} alt="Voxxy logo" />
          </GoBackButton>
        </AdminHeroContainer>
      </AdminHero>

      <SectionWrapper>
        <CardGrid>
          {adventures.map(({ name, emoji, active, description }) => (
            <ActivityCard
              key={name}
              active={active}
              onClick={active ? () => handleSelection(name) : undefined}
            >
              <div className="emoji">{emoji}</div>
              <ActivityName active={active}>{name}</ActivityName>
              <Description>{description}</Description>
            </ActivityCard>
          ))}
        </CardGrid>
      </SectionWrapper>
    </>
  );
}

export default StartNewAdventure;