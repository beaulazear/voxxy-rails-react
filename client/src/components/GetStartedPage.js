import React, { useEffect } from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import { trackEvent, trackPageView } from '../utils/analytics';
import mobileImage from '../assets/SmallTriangle.png';
import presentsImage from '../assets/6.svg';

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

const Card = styled.a`
  padding: clamp(1.9rem, 3.2vw, 2.4rem);
  border-radius: 26px;
  background: var(--gradient-panel);
  border: 1px solid rgba(210, 186, 255, 0.2);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1.1rem;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 50px rgba(146, 77, 255, 0.4);
    border-color: rgba(210, 186, 255, 0.4);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 22px;
  object-fit: cover;
`;

const GetStartedPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackPageView('Get Started Page');
  }, []);

  const handleCardViewed = (label) => trackEvent('Get Started Option Viewed', { label });

  return (
    <>
      <Page>
        <Container>
          <section className="voxxy-stack">
            <Heading>Choose your Voxxy experience</Heading>
            <Paragraph>
              Download Voxxy Mobile for instant group planning or upgrade to Voxxy Presents to power your community events with professional tooling.
            </Paragraph>
          </section>

          <CardGrid>
            <Card
              id="mobile"
              href="https://apps.apple.com/us/app/voxxy/id6746337878"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => handleCardViewed('Voxxy Mobile')}
              onClick={() => trackEvent('CTA Clicked', { label: 'Voxxy Mobile Card', location: 'Get Started Page' })}
            >
              <h2 className="voxxy-title">Voxxy Mobile</h2>
              <Paragraph>
                Download the app and start planning with friends. Personalised recommendations, quick polls, and smart scheduling wherever you gather.
              </Paragraph>
              <CardImage src={mobileImage} alt="Voxxy Mobile app" />
            </Card>

            <Card
              id="presents"
              href="https://www.voxxypresents.com/"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => handleCardViewed('Voxxy Presents')}
              onClick={() => trackEvent('CTA Clicked', { label: 'Voxxy Presents Card', location: 'Get Started Page' })}
            >
              <h2 className="voxxy-title">Voxxy Presents</h2>
              <Paragraph>
                Create your organizer account $15/month during beta. Build recurring events, manage member lists, and grow your community with ease.
              </Paragraph>
              <CardImage src={presentsImage} alt="Voxxy Presents dashboard" />
            </Card>
          </CardGrid>

          <Paragraph>
            Questions? Email Courtney at <a href="mailto:team@heyvoxxy.com" onClick={() => trackEvent('CTA Clicked', { label: 'Email Courtney', location: 'Get Started Page' })}>team@heyvoxxy.com</a>.
          </Paragraph>
        </Container>
      </Page>
      <Footer />
    </>
  );
};

export default GetStartedPage;
