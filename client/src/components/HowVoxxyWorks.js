import React from 'react';
import styled from 'styled-components';
import { Calendar, UtensilsCrossed, Film, Star } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import mixpanel from 'mixpanel-browser'; // ✅ Make sure mixpanel is imported

const colors = {
  sectionBackground: '#17132F',
  card: '#1B1831',
  foreground: '#FFFFFF',
  muted: '#BEBEBE',
  primary: '#9D60F8',
};

const SectionContainer = styled.section`
  background-color: ${colors.sectionBackground};
  padding: 4rem 1rem;
  text-align: center;
  color: ${colors.foreground};
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SmallHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${colors.primary};
  opacity: 0.9;
`;

const Title = styled.h2`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${colors.muted};
  max-width: 600px;
  margin: 0.5rem auto 3rem auto;
  line-height: 1.6;
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const Card = styled.div`
  background-color: ${colors.card};
  border-radius: 1rem;
  padding: 2rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: background-color 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);

  &:hover {
    background-color: #221e3a; /* Slightly lighter or darker shade for hover */
  }
`;

const IconWrapper = styled.div`
  background-color: rgba(157, 96, 248, 0.15);
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
  color: ${colors.foreground};
`;

const CardText = styled.p`
  font-size: 0.95rem;
  color: ${colors.muted};
  line-height: 1.4;
  margin-bottom: 1rem;
`;

const LearnMoreLink = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${colors.primary};
  text-decoration: none;
  cursor: pointer; /* 👈 Add this line */

  &:hover {
    text-decoration: underline;
  }
`;

export default function PerfectForAnyGroupActivity() {
  const navigate = useNavigate();

  const handleTrackAndNavigate = (featureName) => {
    if (process.env.NODE_ENV === "production") {
      mixpanel.track("Feature Link Clicked", {
        feature: featureName
      });
    }
    navigate("/learn-more");
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
              <Calendar size={20} color={colors.primary} />
            </IconWrapper>
            <CardTitle>Trip Planning</CardTitle>
            <CardText>
              Coordinate travel itineraries, book accommodations, and more.
              Let Voxxy handle the details.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate("Trip Planning")}>
              Learn more
            </LearnMoreLink>
          </Card>

          <Card>
            <IconWrapper>
              <UtensilsCrossed size={20} color={colors.primary} />
            </IconWrapper>
            <CardTitle>Group Meals</CardTitle>
            <CardText>
              Find places that fit everyone’s tastes and dietary needs, and manage RSVPs.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate("Group Meals")}>
              Learn more
            </LearnMoreLink>
          </Card>

          <Card>
            <IconWrapper>
              <Film size={20} color={colors.primary} />
            </IconWrapper>
            <CardTitle>Movie Nights</CardTitle>
            <CardText>
              Pick a venue, see what’s playing, and figure out who’s bringing snacks.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate("Movie Nights")}>
              Learn more
            </LearnMoreLink>
          </Card>

          <Card>
            <IconWrapper>
              <Star size={20} color={colors.primary} />
            </IconWrapper>
            <CardTitle>Special Events</CardTitle>
            <CardText>
              Plan reunions, bachelorette parties, anniversaries, and
              celebrate without the stress.
            </CardText>
            <LearnMoreLink onClick={() => handleTrackAndNavigate("Special Events")}>
              Learn more
            </LearnMoreLink>
          </Card>
        </CardsWrapper>
      </SectionInner>
    </SectionContainer>
  );
}