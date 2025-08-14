import React from 'react';
import styled from 'styled-components';
import { Calendar, UtensilsCrossed, Users, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mixpanel from 'mixpanel-browser';
import colors from '../styles/Colors'; // ✅ centralized color palette
import { Heading1, MutedText } from '../styles/Typography'; // ✅ optional if you want to use Heading components

const SectionContainer = styled.section`
  background-color: ${colors.backgroundTwo};
  padding: 5rem 1rem;
  text-align: center;
  color: ${colors.textPrimary};
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SmallHeading = styled.h3`
  font-size: 1.20rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${colors.secondaryButton};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.25rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;

const Subtitle = styled(MutedText)`
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 750px;
  margin: 0.5rem auto 3rem auto;
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 2rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: all 0.3s ease;
  border: 1px solid ${colors.borderDark};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    border-color: ${colors.primaryButton};
    
    // Add a top border accent for non-color indication
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(to right, ${colors.gradient.start}, ${colors.gradient.end});
      border-radius: 1rem 1rem 0 0;
    }
  }
  
  &:focus-within {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
  }
`;

const IconWrapper = styled.div`
  background-color: ${colors.primaryButton};
  color: white;
  border-radius: 50%;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  border: 2px solid ${colors.borderLight};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h4`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${colors.textPrimary};
`;

const CardText = styled.p`
  font-size: 0.95rem;
  color: ${colors.textMuted};
  line-height: 1.4;
  margin-bottom: 1rem;
`;

const LearnMoreLink = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${colors.primaryButton};
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
  
  &:hover {
    color: ${colors.hoverHighlight};
    border-bottom-color: ${colors.hoverHighlight};
    gap: 0.5rem;
  }
  
  &:focus {
    outline: none;
    border-radius: 4px;
    box-shadow: 0 0 0 2px ${colors.focus};
  }
  
  svg {
    transition: transform 0.2s ease;
    width: 14px;
    height: 14px;
  }
  
  &:hover svg {
    transform: translateX(2px);
  }
`;

export default function PerfectForAnyGroupActivity() {
  const navigate = useNavigate();

  const handleTrackAndNavigate = (featureName) => {
    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Feature Link Clicked', {
        feature: featureName,
      });
    }
    const slug = featureName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/learn-more#${slug}`);
  };

  return (
    <SectionContainer>
      <SectionInner>
        <SmallHeading>For Any Occasion</SmallHeading>
        <Title>Perfect for any group activity</Title>
        <Subtitle>
          Whether it’s a weekend getaway, dinner with friends, or movie night, Voxxy
          makes planning effortless.
        </Subtitle>

        <CardsWrapper>
          <Card>
            <IconWrapper>
              <Calendar size={20} color={colors.textPrimary} />
            </IconWrapper>
            <CardTitle>Trip Planning</CardTitle>
            <CardText>
              Coordinate travel itineraries, book accommodations, and more.
              Let Voxxy handle the details.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate('Trip Planning')}>
              Learn more <ArrowRight />
            </LearnMoreLink>
          </Card>

          <Card>
            <IconWrapper>
              <UtensilsCrossed size={20} color={colors.textPrimary} />
            </IconWrapper>
            <CardTitle>Group Meals</CardTitle>
            <CardText>
              Find places that fit everyone’s tastes and dietary needs, and manage RSVPs.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate('Group Meals')}>
              Learn more <ArrowRight />
            </LearnMoreLink>
          </Card>

          <Card>
            <IconWrapper>
              <Users size={20} color={colors.textPrimary} />
            </IconWrapper>
            <CardTitle>Family Reunions</CardTitle>
            <CardText>
              Make it easy to coordinate multiple households, book lodging, and get everyone on the same page.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate('Family Reunions')}>
              Learn more <ArrowRight />
            </LearnMoreLink>
          </Card>

          <Card>
            <IconWrapper>
              <Star size={20} color={colors.textPrimary} />
            </IconWrapper>
            <CardTitle>Special Events</CardTitle>
            <CardText>
              Plan reunions, bachelorette parties, anniversaries, and
              celebrate without the stress.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate('Special Events')}>
              Learn more <ArrowRight />
            </LearnMoreLink>
          </Card>
        </CardsWrapper>
      </SectionInner>
    </SectionContainer>
  );
}