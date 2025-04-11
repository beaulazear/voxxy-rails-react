import React from 'react';
import styled from 'styled-components';
import { Users, CalendarClock, CheckSquare, MessageCircle } from 'lucide-react';

// Adjust these as needed for your brand colors & style
const colors = {
  background: '#0D0B1F',      // Dark background for contrast
  card: '#1B1831',           // Slightly lighter dark for cards
  textPrimary: '#FFFFFF',    // Main text color
  textMuted: '#BEBEBE',      // Secondary text color
  accent: '#9D60F8',         // Accent (for icons, small heading, etc.)
};

// Outer section wrapper with a dark background
const DarkSection = styled.section`
  background-color: ${colors.background};
  padding: 4rem 1.5rem;
  text-align: center;
`;

// Inner container to center and constrain width
const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// Small heading at the top (e.g., "Plan Smarter")
const SmallHeading = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.accent};
  margin-bottom: 1rem;
  opacity: 0.9;
`;

// Large headline (e.g., "Everything you need to plan amazing group activities")
const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 1rem;
`;

// Descriptive subtitle text
const Subtitle = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${colors.textMuted};
  max-width: 700px;
  margin: 0 auto 3rem auto;
`;

// Grid container for the feature cards
const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
`;

// Individual card styles
const Card = styled.div`
  background-color: ${colors.card};
  border-radius: 1rem;
  padding: 2rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);

  &:hover {
    background-color: #221e3a; /* Slightly different tint on hover */
  }
`;

// Icon container at the top of each card
const IconWrapper = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: rgba(157, 96, 248, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Card Title
const CardTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 0.5rem;
`;

// Card Description
const CardText = styled.p`
  font-size: 0.95rem;
  color: ${colors.textMuted};
  line-height: 1.4;
  flex: 1;
`;

export default function AboutSection() {
  return (
    <DarkSection>
      <SectionContainer>
        {/* 1. Smaller accent heading */}
        <SmallHeading>Plan Smarter</SmallHeading>

        {/* 2. Main large heading */}
        <Title>Everything you need to plan amazing group activities</Title>

        {/* 3. Subtitle or brief description */}
        <Subtitle>
          Voxxy helps your group create memorable experiences without the usual
          planning headaches.
        </Subtitle>

        {/* 4. Four feature cards */}
        <CardsWrapper>
          {/* Card 1 */}
          <Card>
            <IconWrapper>
              <Users size={20} color={colors.accent} />
            </IconWrapper>
            <CardTitle>Group Decision Making</CardTitle>
            <CardText>
              Let everyone voice their opinions and reach decisions with minimal friction.
            </CardText>
          </Card>

          {/* Card 2 */}
          <Card>
            <IconWrapper>
              <CalendarClock size={20} color={colors.accent} />
            </IconWrapper>
            <CardTitle>Smart Scheduling</CardTitle>
            <CardText>
              Quickly find a date and time for everyone with AI-powered scheduling.
            </CardText>
          </Card>

          {/* Card 3 */}
          <Card>
            <IconWrapper>
              <CheckSquare size={20} color={colors.accent} />
            </IconWrapper>
            <CardTitle>Task Management</CardTitle>
            <CardText>
              Stay organized with shared checklists and assigned tasks—no more guesswork.
            </CardText>
          </Card>

          {/* Card 4 */}
          <Card>
            <IconWrapper>
              <MessageCircle size={20} color={colors.accent} />
            </IconWrapper>
            <CardTitle>Integrated Messaging</CardTitle>
            <CardText>
              Keep all your planning conversations in one place with built-in chat.
            </CardText>
          </Card>
        </CardsWrapper>
      </SectionContainer>
    </DarkSection>
  );
}