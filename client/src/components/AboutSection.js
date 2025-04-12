import React from 'react';
import styled from 'styled-components';
import { Users, CalendarClock, CheckSquare, MessageCircle, Zap } from 'lucide-react';

const colors = {
  background: '#0D0B1F',      // Dark section background
  card: '#1B1831',            // Card background (slightly lighter than section)
  textPrimary: '#FFFFFF',     // Main text color (white)
  textMuted: '#BEBEBE',       // Secondary text color
  accent: '#9D60F8',          // Accent color (for icons, etc.)
};

const DarkSection = styled.section`
  background-color: ${colors.background};
  padding: 4rem 1.5rem;
  text-align: center;
`;

const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SmallHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${colors.accent};
  margin-bottom: 1rem;
  opacity: 0.9;
`;

const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${colors.textMuted};
  max-width: 700px;
  margin: 0 auto 3rem auto;
`;

// Update grid: ensuring cards are wider
const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
`;

// Updated Card with horizontal layout
const Card = styled.div`
  background-color: ${colors.card};
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);

  &:hover {
    background-color: #221e3a;
  }
`;

// Icon stays on the left with a right margin
const IconWrapper = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: rgba(157, 96, 248, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
`;

// New text container for card text
const TextContainer = styled.div`
  flex: 1;
  text-align: left;
`;

const CardTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 0.5rem;
`;

const CardText = styled.p`
  font-size: 0.95rem;
  color: ${colors.textMuted};
  line-height: 1.4;
`;

export default function AboutSection() {
  return (
    <DarkSection>
      <SectionContainer>
        <SmallHeading>Plan Smarter</SmallHeading>
        <Title>Everything you need to plan amazing group activities</Title>
        <Subtitle>
          Voxxy helps your group create memorable experiences without the usual planning headaches.
        </Subtitle>
        <CardsWrapper>
          {/* Card 1 */}
          <Card>
            <IconWrapper>
              <Users size={20} color={colors.accent} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Group Decision Making</CardTitle>
              <CardText>
                Let everyone voice their opinions and reach decisions with minimal friction.
              </CardText>
            </TextContainer>
          </Card>

          {/* Card 2 */}
          <Card>
            <IconWrapper>
              <CalendarClock size={20} color={colors.accent} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardText>
                Quickly find a date and time for everyone with AI-powered scheduling.
              </CardText>
            </TextContainer>
          </Card>

          {/* Card 3 */}
          <Card>
            <IconWrapper>
              <CheckSquare size={20} color={colors.accent} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Task Management</CardTitle>
              <CardText>
                Stay organized with shared checklists and assigned tasks—no more guesswork.
              </CardText>
            </TextContainer>
          </Card>

          {/* Card 4 */}
          <Card>
            <IconWrapper>
              <MessageCircle size={20} color={colors.accent} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Integrated Messaging</CardTitle>
              <CardText>
                Keep all your planning conversations in one place with built-in chat.
              </CardText>
            </TextContainer>
          </Card>

          <Card>
            <IconWrapper>
              <Zap size={20} color={colors.accent} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>AI Recommendations</CardTitle>
              <CardText>
                Get smart suggestions based on your group's preferences and history.
              </CardText>
            </TextContainer>
          </Card>

        </CardsWrapper>
      </SectionContainer>
    </DarkSection>
  );
}