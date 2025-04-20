import React, { useEffect } from "react";
import { useLocation } from 'react-router-dom';
import {
  MapIcon,
  Users,
  CalendarIcon,
  CheckIcon
} from 'lucide-react';
import styled from "styled-components";
import tripplanning from '../assets/tripplanning.jpeg';
import groupmeal from '../assets/groupmeals.jpeg';
import movienight from '../assets/movienight.jpg';
import specialevents from '../assets/specialevent.jpg';
import UniversalFeatures from "./UniversalFeatures";
import Footer from "./Footer";

const colors = {
  background: '#251C2C',
  foreground: '#FFFFFF',
  muted: '#A8A8A8',
  primary: 'rgba(157,96,248,1)',
  cardBackground: 'rgba(27,24,49,0.95)',
};

const HeadingWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;

  svg {
    color: ${colors.primary};
    width: 1.5em;
    height: 1.5em;
  }
`;

const PageWrapper = styled.div`
  background-color: #251C2C;
  color: #ffffff;
  min-height: 100vh;
`;

const HeroSection = styled.section`
  padding: 7rem 2rem 3rem;
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 6vw, 3.5rem);
  font-weight: 700;
  margin-bottom: 1rem;
`;

const GradientText = styled.span`
  background: linear-gradient(
    90deg,
    #B931D6 0%,
    #9051E1 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroSubtitle = styled.p`
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 800px;
  margin: 0.5rem auto 0 auto;
  color: #bebebe;
`;

const FeatureSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-direction: ${({ $reverse }) => ($reverse ? "row-reverse" : "row")};
  background-color: #251C2C;
  scroll-margin-top: 80px;

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
`;

const FeatureTextWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #cccccc;
  margin: 0;
`;

const KeyFeaturesHeading = styled.h3`
  font-size: 1.125rem;
  margin: 1rem 0 0.5rem;
  font-weight: 600;
`;

const KeyFeaturesList = styled.ul`
  list-style: none;
  padding-left: 0;
  margin: 0;

  li {
    position: relative;
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
    line-height: 1.6;
    color: #bcbcbc;
  }

  li::before {
    content: '✓';
    color: #9D60F8;
    position: absolute;
    left: 0;
    font-weight: bold;
  }
`;

const ClosingText = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  margin-top: 1rem;
  color: #cccccc;
`;

const FeatureImageWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FeatureImage = styled.img`
  width: 100%;
  max-width: 500px;
  height: auto;
  border-radius: 0.5rem;
`;

export default function LearnMorePage() {
  const { hash } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }
  }, [hash]);

  return (
    <PageWrapper>
      <HeroSection>
        <HeroTitle>Learn More About <GradientText>Voxxy</GradientText></HeroTitle>
        <HeroSubtitle>
          Discover how Voxxy transforms group planning into an effortless, enjoyable experience.
        </HeroSubtitle>
      </HeroSection>

      <FeatureSection id="trip-planning" $reverse={false}>
        <FeatureTextWrapper>
          <HeadingWithIcon>
            <MapIcon />
            Trip Planning
          </HeadingWithIcon>
          <FeatureDescription>
            Coordinate travel dates, locations, accommodations, and activities with input from everyone.
          </FeatureDescription>

          <KeyFeaturesHeading>Key Features</KeyFeaturesHeading>
          <KeyFeaturesList>
            <li>Collaborative destination selection</li>
            <li>Interactive maps for planning routes</li>
            <li>Accommodation voting and reservation tracking</li>
            <li>Shared packing lists and itineraries</li>
            <li>Budget tracking and expense splitting</li>
          </KeyFeaturesList>

          <ClosingText>
            Perfect for weekend getaways, family vacations, or group road trips. No more endless email chains or confusing group chats.
          </ClosingText>
        </FeatureTextWrapper>
        <FeatureImageWrapper>
          <FeatureImage src={tripplanning} alt="Trip Planning" />
        </FeatureImageWrapper>
      </FeatureSection>

      <FeatureSection id="group-meals" $reverse={true}>
        <FeatureTextWrapper>
          <HeadingWithIcon>
            <Users />
            Group Meals
          </HeadingWithIcon>
          <FeatureDescription>
            Find restaurants everyone will love, schedule dates that work, and manage RSVPs.
          </FeatureDescription>

          <KeyFeaturesHeading>Key Features</KeyFeaturesHeading>
          <KeyFeaturesList>
            <li>Dietary restriction and preference tracking</li>
            <li>Restaurant recommendations based on group preferences</li>
            <li>Reservation management and reminders</li>
            <li>Menu sharing and pre-ordering options</li>
            <li>Bill splitting and payment tracking</li>
          </KeyFeaturesList>

          <ClosingText>
            Whether it's a casual lunch, birthday dinner, or weekly meetup, make sure everyone's food needs are met without the hassle.
          </ClosingText>
        </FeatureTextWrapper>
        <FeatureImageWrapper>
          <FeatureImage src={groupmeal} alt="Group Meals" />
        </FeatureImageWrapper>
      </FeatureSection>

      <FeatureSection id="movie-nights" $reverse={false}>
        <FeatureTextWrapper>
          <HeadingWithIcon>
            <CalendarIcon />
            Movie Nights
          </HeadingWithIcon>
          <FeatureDescription>
            Vote on what to watch, when to meet, and who's bringing what.
          </FeatureDescription>

          <KeyFeaturesHeading>Key Features</KeyFeaturesHeading>
          <KeyFeaturesList>
            <li>Movie and show recommendation engine</li>
            <li>Voting system for content selection</li>
            <li>Streaming service availability checker</li>
            <li>Snack and supplies assignment</li>
            <li>Scheduling with automatic calendar invites</li>
          </KeyFeaturesList>

          <ClosingText>
            End the 'what should we watch?' debate once and for all with democratic voting and personalized recommendations.
          </ClosingText>
        </FeatureTextWrapper>
        <FeatureImageWrapper>
          <FeatureImage src={movienight} alt="Movie Nights" />
        </FeatureImageWrapper>
      </FeatureSection>

      <FeatureSection id="special-events" $reverse={true}>
        <FeatureTextWrapper>
          <HeadingWithIcon>
            <CheckIcon />
            Special Events
          </HeadingWithIcon>
          <FeatureDescription>
            Plan birthdays, bachelorette parties, and other celebrations without the stress.
          </FeatureDescription>

          <KeyFeaturesHeading>Key Features</KeyFeaturesHeading>
          <KeyFeaturesList>
            <li>Theme and activity brainstorming</li>
            <li>Gift registries and group gift coordination</li>
            <li>Venue research and booking assistance</li>
            <li>RSVP tracking and guest management</li>
            <li>Photo sharing and memories collection</li>
          </KeyFeaturesList>

          <ClosingText>
            Make special occasions truly special by distributing planning tasks and keeping everyone on the same page.
          </ClosingText>
        </FeatureTextWrapper>
        <FeatureImageWrapper>
          <FeatureImage src={specialevents} alt="Special Events" />
        </FeatureImageWrapper>
      </FeatureSection>
      <UniversalFeatures />
      <Footer />
    </PageWrapper>
  );
}