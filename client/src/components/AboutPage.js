import React, { useEffect } from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import { trackEvent, trackPageView } from '../utils/analytics';
import founderImage from '../assets/courtandbeau.png';

const Page = styled.main`
  background: var(--color-space-900);
  color: var(--color-text-primary);
  padding: clamp(5.5rem, 10vw, 8rem) 1.5rem 0;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  gap: clamp(2.5rem, 6vw, 4rem);
  padding-bottom: clamp(3rem, 6vw, 4rem);
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

const Split = styled.section`
  display: grid;
  gap: clamp(2rem, 5vw, 3.5rem);
  align-items: center;

  @media (min-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const FounderImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 32px;
  object-fit: cover;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const FounderInfo = styled.div`
  display: grid;
  gap: 1rem;
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
    <>
      <Page>
        <Container>
          <section className="voxxy-stack">
            <Heading>Making connection effortless</Heading>
            <Paragraph>
              Voxxy started as a way to fix messy group chats. We're building the operating system for gatherings so hosts and attendees can focus on what matters: time together.
            </Paragraph>
          </section>

          <Split>
            <FounderImage
              src={founderImage}
              alt="Courtney Greer and Beau Lazear"
              loading="lazy"
              decoding="async"
            />
            <FounderInfo>
              <Subheading>Meet the founders</Subheading>
              <Paragraph>
                <strong>Courtney Greer</strong> and <strong>Beau Lazear</strong> are building Voxxy to bridge the gap between spontaneous hangouts and sustainable community.
              </Paragraph>
              <Paragraph>
                We believe software should amplify human warmth, not replace it.
              </Paragraph>
            </FounderInfo>
          </Split>

          <Card>
            <CardHeading>Let's work together</CardHeading>
            <Paragraph>
              Interested in collaborating, partnering, or investing? Reach out at <EmailLink href="mailto:courtneygreer@heyvoxxy.com" onClick={handleEmailClick}>courtneygreer@heyvoxxy.com</EmailLink> or <EmailLink href="mailto:beaulazear@heyvoxxy.com" onClick={handleEmailClick}>beaulazear@heyvoxxy.com</EmailLink>
            </Paragraph>
          </Card>
        </Container>
      </Page>
      <Footer />
    </>
  );
};

export default AboutPage;
