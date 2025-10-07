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
  padding-bottom: clamp(3rem, 8vw, 5rem);
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

const Card = styled.article`
  padding: clamp(1.8rem, 3vw, 2.3rem);
  border-radius: 26px;
  background: var(--gradient-panel);
  border: 1px solid rgba(210, 186, 255, 0.18);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1rem;
`;

const CardHeading = styled.h3`
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 3vw, 1.6rem);
  margin: 0;
`;

const EmailLink = styled.a`
  color: var(--color-plasma-300);
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-plasma-200);
  }
`;

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            We're a distributed crew of designers, engineers, and community builders. We believe software should amplify human warmth. If that resonates, let's talk.
          </Paragraph>
          <Card>
            <CardHeading>Work with us</CardHeading>
            <Paragraph>
              Interested in collaborating, partnering, or investing? Reach out at <EmailLink href="mailto:courtneygreer@heyvoxxy.com" onClick={handleEmailClick}>courtneygreer@heyvoxxy.com</EmailLink>.
            </Paragraph>
          </Card>
        </section>
      </Container>
      <Footer />
    </Page>
  );
};

export default AboutPage;
