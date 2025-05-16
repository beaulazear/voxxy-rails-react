import React from 'react';
import styled from 'styled-components';
import {
  Users,
  CalendarClock,
  CheckSquare,
  MessageCircle,
  Zap,
  CircleDollarSign
} from 'lucide-react';
import colors from '../styles/Colors'; // ✅ centralized color palette
import { Heading1, MutedText } from '../styles/Typography'; // ✅ optional typography imports

const DarkSection = styled.section`
  background-color: ${colors.backgroundTwo};
  padding: 0.5rem 1.5rem;
  padding-bottom: 60px;
  text-align: center;
`;

const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 10rem 0;
`;

const SmallHeading = styled.h3`
  font-size: 1.20rem;
  font-weight: 600;
  color: ${colors.primaryButton};
  margin-bottom: 1rem;
  opacity: 0.9;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.1rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
  max-width: 700px;      // Add this line
  margin-left: auto;     // Center horizontally
  margin-right: auto;    // Center horizontally
  text-align: center;    // Center text`;

const Subtitle = styled(MutedText)`
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 750px;
  margin: 0.5rem auto 3rem auto;
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);

  &:hover {
    box-shadow: 0 0 20px #592566, 0 0 40px #592566;
    background-color: ${colors.cardBackground}; /* keep same background, or tweak if you like */
  }
`;

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
          <Card>
            <IconWrapper>
              <Users size={20} color={colors.primaryButton} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Group Decision Making</CardTitle>
              <CardText>
                Let everyone voice their opinions and reach decisions with minimal friction.
              </CardText>
            </TextContainer>
          </Card>

          <Card>
            <IconWrapper>
              <CalendarClock size={20} color={colors.primaryButton} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardText>
                Quickly find a date and time for everyone with AI-powered scheduling.
              </CardText>
            </TextContainer>
          </Card>

          <Card>
            <IconWrapper>
              <CircleDollarSign size={20} color={colors.primaryButton} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Budget Tracking</CardTitle>
              <CardText>
                Stay on top of group expenses with shared budgets and payment reminders.
              </CardText>
            </TextContainer>
          </Card>

          <Card>
            <IconWrapper>
              <CheckSquare size={20} color={colors.primaryButton} />
            </IconWrapper>
            <TextContainer>
              <CardTitle>Task Management</CardTitle>
              <CardText>
                Stay organized with shared checklists and assigned tasks—no more guesswork.
              </CardText>
            </TextContainer>
          </Card>

          <Card>
            <IconWrapper>
              <MessageCircle size={20} color={colors.primaryButton} />
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
              <Zap size={20} color={colors.primaryButton} />
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