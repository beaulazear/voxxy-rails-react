import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { trackEvent, trackPageView } from '../utils/analytics';
import Footer from './Footer';
import mobileScreenshots1 from '../assets/mobile_screenshots1.svg';
import six from '../assets/6.svg';

const Page = styled.main`
  background: var(--color-space-900);
  color: var(--color-text-primary);
  padding: clamp(4rem, 8vw, 6.5rem) 1.5rem;
`;

const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: clamp(2.5rem, 6vw, 4rem);
  padding-bottom: clamp(3rem, 8vw, 5rem);
`;

const Hero = styled.section`
  display: grid;
  gap: 1.5rem;
`;

const Heading = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 3.8rem);
  margin: 0;
`;

const Paragraph = styled.p`
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
`;

const Split = styled.section`
  display: grid;
  gap: clamp(2rem, 5vw, 3.5rem);
  align-items: center;

  @media (min-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const CopyStack = styled.div`
  display: grid;
  gap: clamp(1.2rem, 3vw, 1.8rem);
  background: var(--gradient-panel);
  border: 1px solid rgba(210, 186, 255, 0.2);
  border-radius: 26px;
  padding: clamp(1.9rem, 3.2vw, 2.4rem);
  box-shadow: var(--shadow-card);
`;

const Eyebrow = styled.span`
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--letter-ultra-wide);
  color: var(--color-text-muted);
`;

const Subheading = styled.h2`
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  margin: 0;
`;

const StageList = styled.div`
  display: grid;
  gap: 1rem;
`;

const StageItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 0.9rem;
`;

const StageIndex = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(146, 77, 255, 0.85), rgba(255, 87, 208, 0.7));
  box-shadow: 0 10px 25px rgba(146, 77, 255, 0.35);
`;

const StageCopy = styled.p`
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
`;

const Image = styled.img`
  width: 100%;
  height: auto;
  max-height: clamp(575px, 75vh, 865px);
  border-radius: 32px;
  object-fit: contain;
`;

const ActionLink = styled(Link)`
  justify-self: start;
  padding: 0.85rem 1.7rem;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  border: 1px solid rgba(203, 184, 255, 0.4);
  color: var(--color-plasma-300);
  background: rgba(255, 255, 255, 0.03);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(86, 51, 139, 0.35);
  }
`;

const mobileStages = [
  'Share a vibe and get suggestions tuned to everyone in the chat.',
  'Tap through quick polls to land on a time, place, or idea.',
  'Lock in the plan with smart scheduling and reminders.',
];

const presentsStages = [
  'Build reusable agendas and save templates for every gathering.',
  'Track RSVPs, budgets, and vendor details with lightweight dashboards.',
  'Publish a public club page and keep members looped in with updates.',
];

const HowItWorksPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackPageView('How It Works Page');
  }, []);

  const handleCta = (label) => () => trackEvent('CTA Clicked', { label, location: 'How It Works' });

  return (
    <Page>
      <Container>
        <Hero>
          <Heading>How Voxxy works</Heading>
          <Paragraph>Pick the workflow that fits your community. Voxxy keeps coordination intuitive whether you are planning a casual hangout or a recurring flagship event.</Paragraph>
        </Hero>

        <Split>
          <CopyStack>
            <Eyebrow>Voxxy Mobile</Eyebrow>
            <Subheading>Discover, decide, and go.</Subheading>
            <Paragraph>Designed for friends and teams that want spontaneity without the spam. Voxxy Mobile accelerates decision-making so the group can focus on the experience.</Paragraph>
            <StageList>
              {mobileStages.map((copy, index) => (
                <StageItem key={index}>
                  <StageIndex>{index + 1}</StageIndex>
                  <StageCopy>{copy}</StageCopy>
                </StageItem>
              ))}
            </StageList>
            <ActionLink to="/get-started#mobile" onClick={handleCta('Try Voxxy Mobile')}>
              Try Voxxy Mobile
            </ActionLink>
          </CopyStack>
          <Image src={mobileScreenshots1} alt="Voxxy Mobile flow visual" />
        </Split>

        <Split>
          <Image src={six} alt="Voxxy Presents organizer workspace" />
          <CopyStack>
            <Eyebrow>Voxxy Presents</Eyebrow>
            <Subheading>Plan, manage, and grow.</Subheading>
            <Paragraph>Hosts and organizers run recurring events, track members, and communicate from one place. Voxxy Presents adds structure without slowing down momentum.</Paragraph>
            <StageList>
              {presentsStages.map((copy, index) => (
                <StageItem key={index}>
                  <StageIndex>{index + 1}</StageIndex>
                  <StageCopy>{copy}</StageCopy>
                </StageItem>
              ))}
            </StageList>
            <ActionLink to="/get-started#presents" onClick={handleCta('Join Voxxy Presents')}>
              Join Voxxy Presents
            </ActionLink>
          </CopyStack>
        </Split>
      </Container>
      <Footer />
    </Page>
  );
};

export default HowItWorksPage;
