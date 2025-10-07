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
  font-size: clamp(2.3rem, 5.5vw, 3.6rem);
  margin: 0;
  text-wrap: balance;
`;

const Subheading = styled.h2`
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  margin: 0;
`;

const Paragraph = styled.p`
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
`;

const CardGrid = styled.div`
  display: grid;
  gap: clamp(1.75rem, 4vw, 2.25rem);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const Card = styled.article`
  padding: clamp(1.8rem, 3vw, 2.3rem);
  border-radius: 26px;
  background: var(--gradient-panel);
  border: 1px solid rgba(210, 186, 255, 0.18);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1rem;
`;

const Placeholder = styled.div`
  min-height: clamp(220px, 25vw, 300px);
  border-radius: 24px;
  border: 1px dashed rgba(210, 186, 255, 0.35);
  display: grid;
  place-items: center;
  color: var(--color-text-muted);
  font-family: var(--font-display);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: linear-gradient(140deg, rgba(24, 15, 43, 0.8), rgba(52, 27, 83, 0.75));
`;

const AboutPage = () => {
  useEffect(() => {
    trackPageView('About Page');
  }, []);

  const handleEmailClick = () => {
    trackEvent('CTA Clicked', { label: 'Email Voxxy', location: 'About Page' });
  };

  return (
    <Page>
      <Container>
        <section className="voxxy-stack">
          <Heading>To make connection effortless and communities sustainable.</Heading>
          <Paragraph>
            Voxxy began as a way to fix messy group chats. What we discovered was bigger people don’t just want plans, they want belonging. We’re building the operating system for gatherings so that hosts and attendees can focus on what matters: time together.
          </Paragraph>
        </section>

        <section className="voxxy-stack">
          <Subheading>Our story</Subheading>
          <Paragraph>
            We started as friends trying to keep our own hangouts alive. Along the way, we met organizers who needed better tools to maintain the communities they cared about. Voxxy is the bridge between spontaneous fun and sustainable connection.
          </Paragraph>
          <Paragraph>
            Every feature we build is designed to reduce the friction between great ideas and unforgettable moments across cities, time zones, and communities of every size.
          </Paragraph>
        </section>

        <section className="voxxy-stack">
          <Subheading>The team</Subheading>
          <Paragraph>
            We’re a distributed crew of designers, engineers, and community builders. We believe software should amplify human warmth. If that resonates, let’s talk.
          </Paragraph>
          <CardGrid>
            <Card>
              <Placeholder data-label="team portrait" />
            </Card>
            <Card>
              <h3 style={{ margin: 0 }}>Work with us</h3>
              <Paragraph>
                Interested in collaborating, partnering, or investing? Reach out at <a href="mailto:courtneygreer@heyvoxxy.com" onClick={handleEmailClick}>courtneygreer@heyvoxxy.com</a>.
              </Paragraph>
            </Card>
          </CardGrid>
        </section>
      </Container>
      <Footer />
    </Page>
  );
};

export default AboutPage;
