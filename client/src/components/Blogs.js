import React, { useEffect } from "react";
import WaitlistForm from "./WaitlistForm";
import Footer from "./Footer";
import styled, { keyframes } from "styled-components";
import colors from "../styles/Colors";
import mixpanel from 'mixpanel-browser';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const SectionContainer = styled.section`
  padding: 6rem 1rem;
  text-align: center;
  color: ${colors.textPrimary};
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionInner = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 600;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, ${colors.gradient.start}, ${colors.hoverHighlight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;
  animation: ${fadeIn} 1s ease-out;
`;

const Tagline = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.3rem, 3vw, 1.8rem);
  color: ${colors.textPrimary};
  margin: 1.5rem auto;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: ${fadeIn} 1s ease-out 0.2s both;
`;

const InstagramBadge = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 2rem;
  color: ${colors.textMuted};
  text-decoration: none;
  animation: ${fadeIn} 1s ease-out 0.3s both;
  transition: all 0.3s ease;
  
  &:hover {
    color: ${colors.textSecondary};
    transform: translateY(-2px);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const MainCTALink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, ${colors.purple1}, ${colors.primaryButton});
  color: white;
  text-decoration: none;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 1rem 2rem;
  border-radius: 50px;
  margin-top: 2rem;
  transition: all 0.3s ease;
  animation: ${fadeIn} 1s ease-out 0.6s both;
  box-shadow: 0 4px 15px rgba(162, 89, 255, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(162, 89, 255, 0.4);
    background: linear-gradient(135deg, ${colors.primaryButton}, ${colors.hoverHighlight});
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;


const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem auto;
  max-width: 500px;
  animation: ${fadeIn} 1s ease-out 0.5s both;
`;

const FeatureItem = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${colors.gradient.start};
  }
`;

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function Blogs() {

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Voxxy Presents Page Loaded');
    }
    
  }, []);

  return (
    <div style={{ paddingTop: '100px', backgroundColor: colors.background }}>
      <SectionContainer>
        <SectionInner>
          <Title>Voxxy Presents</Title>
          <Tagline>Where Events Come Alive</Tagline>
          <InstagramBadge href="https://www.instagram.com/voxxypresents" target="_blank" rel="noopener noreferrer">
            View our Instagram
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
            </svg>
          </InstagramBadge>
          
          <FeatureList>
            <FeatureItem>
              <CheckIcon />
              Curated events by Voxxy AI
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              Building the future of live experiences
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              Collabs, vibes & opportunities
            </FeatureItem>
          </FeatureList>

          <MainCTALink href="https://www.voxxypresents.com" target="_blank" rel="noopener noreferrer">
            Visit Voxxy Presents Beta
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </MainCTALink>
        </SectionInner>
      </SectionContainer>
      <WaitlistForm />
      <Footer />
    </div>
  )
}