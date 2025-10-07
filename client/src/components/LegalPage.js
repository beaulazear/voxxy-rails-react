import React, { useEffect } from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import { trackEvent, trackPageView } from '../utils/analytics';

const Page = styled.main`
  background: var(--color-space-900);
  color: var(--color-text-primary);
  padding: clamp(4rem, 8vw, 6.5rem) 1.5rem;
`;

const Container = styled.div`
  max-width: 920px;
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

const DocumentCard = styled.article`
  padding: clamp(1.9rem, 3.2vw, 2.4rem);
  border-radius: 26px;
  background: var(--gradient-panel);
  border: 1px solid rgba(210, 186, 255, 0.2);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1.1rem;
`;

const Button = styled(Link)`
  justify-self: center;
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

const LegalPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackPageView('Legal Page');
  }, []);

  const handleClick = (label) => () => trackEvent('CTA Clicked', { label, location: 'Legal Page' });

  return (
    <Page>
      <Container>
        <section className="voxxy-stack">
          <Heading>Legal & Trust Center</Heading>
          <Paragraph>
            We take privacy, safety, and transparency seriously. Review our policies below they define how we operate and protect the communities that rely on Voxxy.
          </Paragraph>
        </section>

        <DocumentCard>
          <h2 className="voxxy-title">Terms of Service</h2>
          <Paragraph>
            Understand the rules of engagement for using Voxxy across mobile and organizer experiences.
          </Paragraph>
          <Button to="/terms" onClick={handleClick('View Terms')}>
            View Terms
          </Button>
        </DocumentCard>

        <DocumentCard>
          <h2 className="voxxy-title">Privacy Policy</h2>
          <Paragraph>
            Learn how we collect, use, and safeguard personal data for hosts and attendees alike.
          </Paragraph>
          <Button to="/privacy" onClick={handleClick('View Privacy Policy')}>
            View Privacy Policy
          </Button>
        </DocumentCard>
      </Container>
      <Footer />
    </Page>
  );
};

export default LegalPage;
