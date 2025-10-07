import React, { useEffect } from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import { trackEvent, trackPageView } from '../utils/analytics';

const Page = styled.main`
  background: var(--color-space-900);
  color: var(--color-text-primary);
  padding: clamp(4rem, 8vw, 6.5rem) 1.5rem 0;
`;

const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: clamp(2.5rem, 6vw, 4rem);
`;

const Heading = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 5.5vw, 3.6rem);
  margin: 0;
`;

const Paragraph = styled.p`
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
`;

const Grid = styled.div`
  display: grid;
  gap: clamp(1.75rem, 4vw, 2.25rem);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const SpotlightCard = styled.article`
  padding: clamp(1.9rem, 3vw, 2.4rem);
  border-radius: 26px;
  background: var(--gradient-panel);
  border: 1px solid rgba(210, 186, 255, 0.2);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1.1rem;
`;

const Placeholder = styled.div`
  min-height: clamp(200px, 24vw, 280px);
  border-radius: 22px;
  border: 1px dashed rgba(210, 186, 255, 0.35);
  display: grid;
  place-items: center;
  color: var(--color-text-muted);
  font-family: var(--font-display);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: linear-gradient(140deg, rgba(24, 15, 43, 0.8), rgba(52, 27, 83, 0.75));
`;

const Quote = styled.blockquote`
  margin: 0;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--color-text-secondary);
`;

const Citation = styled.cite`
  display: block;
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-style: normal;
  font-size: 0.9rem;
`;

const CTAButton = styled(Link)`
  justify-self: start;
  padding: 0.95rem 1.9rem;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  border: none;
  color: var(--color-text-primary);
  background-image: linear-gradient(120deg, #6a36ff 0%, #ff36d5 52%, #ff9d3f 100%);
  box-shadow: 0 12px 35px rgba(146, 77, 255, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 40px rgba(146, 77, 255, 0.45);
  }
`;

const CommunityPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackPageView('Community Page');
  }, []);

  const handleCta = () => trackEvent('CTA Clicked', { label: 'Start your club on Voxxy', location: 'Community Page' });

  return (
    <>
      <Page>
      <Container>
        <section className="voxxy-stack">
          <Heading>Communities that gather with Voxxy</Heading>
          <Paragraph>
            From supper clubs to volunteer collectives, Voxxy keeps gatherings consistent. Explore how organizers use our tools to create rhythm, accountability, and fun.
          </Paragraph>
        </section>

        <Grid>
          <SpotlightCard>
            <Placeholder data-label="club spotlight" />
            <h3 style={{ margin: 0 }}>Brooklyn Game Night</h3>
            <Paragraph>
              “Voxxy made it simple to keep our game night alive every week.”
            </Paragraph>
          </SpotlightCard>
          <SpotlightCard>
            <Placeholder data-label="partner logos" />
            <h3 style={{ margin: 0 }}>Community Partners</h3>
            <Paragraph>
              Feature your club here. Showcase events, share highlights, and grow your member list with Voxxy Presents.
            </Paragraph>
          </SpotlightCard>
          <SpotlightCard>
            <Quote>
              “We used to spin up a new group chat for every event. With Voxxy, our members know exactly where to go for dates, RSVPs, and updates.”
            </Quote>
            <Citation>— The Collective Supper Club</Citation>
          </SpotlightCard>
        </Grid>

        <section className="voxxy-stack">
          <Paragraph>
            Ready to see your community on Voxxy? Share your story with us and we’ll amplify it across the Voxxy network.
          </Paragraph>
          <CTAButton to="/get-started#presents" onClick={handleCta} style={{ justifySelf: 'center' }}>
            Start your club on Voxxy
          </CTAButton>
        </section>
      </Container>
      </Page>
      <Footer />
    </>
  );
};

export default CommunityPage;
