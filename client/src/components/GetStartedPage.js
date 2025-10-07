import React, { useEffect } from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import { trackEvent, trackPageView } from '../utils/analytics';

const Page = styled.main`
  background: var(--color-space-900);
  color: var(--color-text-primary);
  padding: clamp(4rem, 8vw, 6.5rem) 1.5rem;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  gap: clamp(2.5rem, 6vw, 4rem);
`;

const Heading = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  margin: 0;
`;

const Paragraph = styled.p`
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--color-text-secondary);
`;

const CardGrid = styled.div`
  display: grid;
  gap: clamp(1.75rem, 4vw, 2.25rem);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const Card = styled.article`
  padding: clamp(1.9rem, 3.2vw, 2.4rem);
  border-radius: 26px;
  background: var(--gradient-panel);
  border: 1px solid rgba(210, 186, 255, 0.2);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1.1rem;
`;

const Placeholder = styled.div`
  min-height: clamp(180px, 24vw, 260px);
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

const GetStartedPage = () => {
  useEffect(() => {
    trackPageView('Get Started Page');
  }, []);

  const handleCardViewed = (label) => trackEvent('Get Started Option Viewed', { label });

  return (
    <Page>
      <Container>
        <section className="voxxy-stack">
          <Heading>Choose your Voxxy experience</Heading>
          <Paragraph>
            Download Voxxy Mobile for instant group planning or upgrade to Voxxy Presents to power your community events with professional tooling.
          </Paragraph>
        </section>

        <CardGrid>
          <Card id="mobile" onMouseEnter={() => handleCardViewed('Voxxy Mobile')}>
            <h2 className="voxxy-title">Voxxy Mobile</h2>
            <Paragraph>
              Download the app and start planning with friends. Personalised recommendations, quick polls, and smart scheduling wherever you gather.
            </Paragraph>
            <Placeholder data-label="app store badges" />
          </Card>

          <Card id="presents" onMouseEnter={() => handleCardViewed('Voxxy Presents')}>
            <h2 className="voxxy-title">Voxxy Presents</h2>
            <Paragraph>
              Create your organizer account $15/month during beta. Build recurring events, manage member lists, and grow your community with ease.
            </Paragraph>
            <Placeholder data-label="organizer dashboard" />
          </Card>
        </CardGrid>

        <Paragraph>
          Questions? Email Courtney at <a href="mailto:team@heyvoxxy.com" onClick={() => trackEvent('CTA Clicked', { label: 'Email Courtney', location: 'Get Started Page' })}>team@heyvoxxy.com</a>.
        </Paragraph>
      </Container>
      <Footer />
    </Page>
  );
};

export default GetStartedPage;
