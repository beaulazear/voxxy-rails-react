import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { trackEvent, trackPageView } from '../utils/analytics';
import Footer from './Footer';
import homeimage1 from '../assets/homeimage1.svg';
import mobileScreenshots1 from '../assets/mobile_screenshots1.svg';
import six from '../assets/6.svg';
import homeimage2 from '../assets/5.svg';

const Page = styled.main`
  background: var(--color-space-900);
  color: var(--color-text-primary);
  padding-top: clamp(3rem, 6vw, 4rem);
`;

const Section = styled.section`
  padding: clamp(4rem, 8vw, 6.5rem) 1.5rem;
  position: relative;
  ${({ $variant }) =>
    $variant === 'alt'
      ? css`
          background: linear-gradient(160deg, rgba(16, 10, 32, 0.92), rgba(27, 18, 47, 0.88));
        `
      : null}
`;

const SectionInner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: clamp(2.5rem, 6vw, 4rem);
`;

const Split = styled.div`
  display: grid;
  gap: clamp(2rem, 5vw, 3.5rem);
  align-items: center;
  scroll-margin-top: 80px;

  @media (min-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${({ $reverseOnMobile }) =>
    $reverseOnMobile &&
    css`
      @media (max-width: 959px) {
        > *:first-child {
          order: 2;
        }
        > *:last-child {
          order: 1;
        }
      }
    `}
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--letter-ultra-wide);
  color: var(--color-text-muted);
    margin: auto;
`;

const Title = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(2.7rem, 7vw, 4.8rem);
  line-height: 1.05;
  margin: 0;
  text-wrap: balance;
`;

const Heading = styled.h2`
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3.25rem);
  line-height: 1.1;
  margin: 0;
  text-wrap: balance;
`;

const Subheading = styled.h3`
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.2;
  margin: 0;
  text-wrap: balance;
`;

const Paragraph = styled.p`
  font-size: clamp(1.05rem, 2.2vw, 1.3rem);
  line-height: 1.65;
  color: var(--color-text-secondary);
  max-width: 60ch;
`;

const BodyCopy = styled.div`
  display: grid;
  gap: clamp(1.2rem, 3vw, 1.8rem);
  text-align: center;
`;

const ButtonRow = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  align-items: center;
  margin: auto;

  ${({ $centered }) =>
    $centered &&
    css`
      justify-content: center;
    `}
`;

const buttonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.95rem 1.9rem;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
`;

const PrimaryButtonExternal = styled.a`
  ${buttonStyles}
  border: none;
  color: var(--color-text-primary);
  background-image: linear-gradient(120deg, #6a36ff 0%, #ff36d5 52%, #ff9d3f 100%);
  box-shadow: 0 12px 35px rgba(146, 77, 255, 0.35);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 40px rgba(146, 77, 255, 0.45);
  }
`;

const SecondaryButton = styled(Link)`
  ${buttonStyles}
  border: 1px solid rgba(203, 184, 255, 0.4);
  color: var(--color-plasma-300);
  background: rgba(255, 255, 255, 0.03);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(86, 51, 139, 0.35);
  }
`;

const SecondaryButtonExternal = styled.a`
  ${buttonStyles}
  border: 1px solid rgba(203, 184, 255, 0.4);
  color: var(--color-plasma-300);
  background: rgba(255, 255, 255, 0.03);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(86, 51, 139, 0.35);
  }
`;

const PrimaryButtonScroll = styled.button`
  ${buttonStyles}
  border: none;
  color: var(--color-text-primary);
  background-image: linear-gradient(120deg, #6a36ff 0%, #ff36d5 52%, #ff9d3f 100%);
  box-shadow: 0 12px 35px rgba(146, 77, 255, 0.35);
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 40px rgba(146, 77, 255, 0.45);
  }
`;

const SecondaryButtonScroll = styled.button`
  ${buttonStyles}
  border: 1px solid rgba(203, 184, 255, 0.4);
  color: var(--color-plasma-300);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(86, 51, 139, 0.35);
  }
`;

const Image = styled.img`
  width: 100%;
  height: auto;
  max-height: clamp(575px, 75vh, 865px);
  border-radius: 32px;
  object-fit: contain;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  text-align: left;
`;

const ListItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.98rem;
  line-height: 1.6;
  color: var(--color-text-secondary);

  &:before {
    content: '';
    flex: none;
    margin-top: 0.55rem;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(146, 77, 255, 0.8), rgba(255, 87, 208, 0.7));
    box-shadow: 0 0 12px rgba(146, 77, 255, 0.45);
  }
`;

const CTAContainer = styled.div`
  max-width: 960px;
  margin: 0 auto;
  border-radius: 40px;
  padding: clamp(2.8rem, 6vw, 4.5rem);
  background: linear-gradient(135deg, rgba(21, 5, 42, 0.95), rgba(59, 13, 88, 0.92));
  box-shadow: 0 35px 60px rgba(10, 3, 25, 0.55);
  display: grid;
  gap: clamp(1.4rem, 3vw, 2rem);
  justify-items: center;
  text-align: center;
`;

const Hero = ({ onPrimaryClick, onSecondaryClick }) => {
  const scrollToSection = (sectionId, callback) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (callback) callback();
  };

  return (
    <Section className="voxxy-aurora">
      <SectionInner>
        <Split>
          <BodyCopy>
            <Eyebrow>Built for intentional gatherings</Eyebrow>
            <Title className="voxxy-title--glow">Turn plans into community.</Title>
            <Paragraph>
              Voxxy is the social planning platform that helps friends, clubs, and organizers build connection through effortless coordination.
            </Paragraph>
            <ButtonRow $centered>
              <PrimaryButtonScroll onClick={() => scrollToSection('voxxy-mobile', onPrimaryClick)}>
                Try Voxxy Mobile
              </PrimaryButtonScroll>
              <SecondaryButtonScroll onClick={() => scrollToSection('voxxy-presents', onSecondaryClick)}>
                Explore Voxxy Presents
              </SecondaryButtonScroll>
            </ButtonRow>
          </BodyCopy>
          <Image src={homeimage1} alt="Voxxy hero illustration" />
        </Split>
      </SectionInner>
    </Section>
  );
};

const WhySection = ({ onCtaClick }) => (
  <Section>
    <SectionInner>
      <Split $reverseOnMobile>
        <Image src={homeimage2} alt="Voxxy platform illustration" />
        <BodyCopy>
          <Eyebrow>Connection takes effort. We make it easier.</Eyebrow>
          <Heading>Social coordination should not be a barrier.</Heading>
          <Paragraph>
            Voxxy removes the friction from group planning — we built the infrastructure people need to turn ideas into lasting connections and coordination into celebration.
          </Paragraph>
          <SecondaryButton to="/how-it-works" onClick={onCtaClick}>See how it works</SecondaryButton>
        </BodyCopy>
      </Split>
    </SectionInner>
  </Section>
);

const FlowsSection = ({ onMobileCta, onPresentsCta }) => (
  <Section $variant="alt">
    <SectionInner>
      <Eyebrow>Choose your flow</Eyebrow>
      <Heading>Voxxy adapts to how you gather.</Heading>
      <Split id="voxxy-mobile">
        <BodyCopy className="voxxy-surface voxxy-surface--spacious">
          <Eyebrow>Voxxy Mobile</Eyebrow>
          <Subheading className="voxxy-title">Plan together, faster.</Subheading>
          <Paragraph>
            For friends, roommates, and coworkers — Voxxy helps you decide what to do and where to go without the chaos. It learns what you like, suggests options that fit everyone's preferences, and helps your group decide quickly so you can get back to enjoying your time together.
          </Paragraph>
          <List>
            <ListItem>Personalized group recommendations</ListItem>
            <ListItem>Quick polls and shared picks</ListItem>
            <ListItem>Smart scheduling that actually works</ListItem>
            <ListItem>Favorites saved for future plans</ListItem>
          </List>
          <PrimaryButtonExternal href="https://apps.apple.com/us/app/voxxy/id6746337878" target="_blank" rel="noopener noreferrer" onClick={onMobileCta}>Get the App</PrimaryButtonExternal>
        </BodyCopy>
        <Image src={mobileScreenshots1} alt="Voxxy Mobile app screenshots" />
      </Split>
      <Split id="voxxy-presents" $reverseOnMobile>
        <Image src={six} alt="Voxxy Presents workspace preview" />
        <BodyCopy className="voxxy-surface voxxy-surface--spacious">
          <Eyebrow>Voxxy Presents</Eyebrow>
          <Subheading className="voxxy-title">Built for community builders.</Subheading>
          <Paragraph>
            For clubs, hosts, and organizers — Voxxy Presents provides the tools to plan recurring events and grow your community sustainably. From monthly meetups to membership-based programs, you can manage events, track attendance, and keep members engaged all in one place.
          </Paragraph>
          <List>
            <ListItem>Reusable event templates & scheduling</ListItem>
            <ListItem>Budget & vendor tracking</ListItem>
            <ListItem>Member communication tools</ListItem>
            <ListItem>Public club page for promotion and RSVPs</ListItem>
          </List>
          <SecondaryButtonExternal href="https://www.voxxypresents.com/" target="_blank" rel="noopener noreferrer" onClick={onPresentsCta}>Join Voxxy Presents</SecondaryButtonExternal>
        </BodyCopy>
      </Split>
    </SectionInner>
  </Section>
);

const FinalCTA = ({ onPrimaryClick, onSecondaryClick }) => (
  <Section>
    <CTAContainer>
      <Heading>Ready to build your community?</Heading>
      <Paragraph>Voxxy helps people plan, host, and grow all in one place.</Paragraph>
      <ButtonRow $centered>
        <PrimaryButtonExternal href="https://apps.apple.com/us/app/voxxy/id6746337878" target="_blank" rel="noopener noreferrer" onClick={onPrimaryClick}>Try Voxxy Mobile</PrimaryButtonExternal>
        <SecondaryButtonExternal href="https://www.voxxypresents.com/" target="_blank" rel="noopener noreferrer" onClick={onSecondaryClick}>Join Voxxy Presents</SecondaryButtonExternal>
      </ButtonRow>
    </CTAContainer>
  </Section>
);

const LandingPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackPageView('Landing Page');
  }, []);

  const handleCtaClick = (label, location) => () => {
    trackEvent('CTA Clicked', { label, location });
  };

  return (
    <>
      <Page>
        <Hero onPrimaryClick={handleCtaClick('Try Voxxy Mobile', 'Hero')} onSecondaryClick={handleCtaClick('Explore Voxxy Presents', 'Hero')} />
        <FlowsSection
          onMobileCta={handleCtaClick('Get the App', 'Choose Your Flow')}
          onPresentsCta={handleCtaClick('Join Voxxy Presents', 'Choose Your Flow')}
        />
        <WhySection onCtaClick={handleCtaClick('See How It Works', 'Why Voxxy')} />
        <FinalCTA
          onPrimaryClick={handleCtaClick('Try Voxxy Mobile', 'Final CTA')}
          onSecondaryClick={handleCtaClick('Join Voxxy Presents', 'Final CTA')}
        />
      </Page>
      <Footer />
    </>
  );
};

export default LandingPage;
