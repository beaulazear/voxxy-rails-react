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
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${colors.primaryButton};
  opacity: 0.9;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);

  &:hover {
    box-shadow: 0 0 20px #592566, 0 0 40px #592566;
    background-color: ${colors.cardBackground}; /* keep same background, or tweak if you like */
  }
`;

const IconWrapper = styled.div`
  background-color: #CC31E8;
  color: white;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
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
  color: #CC31E8;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    font-weight: 800;
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