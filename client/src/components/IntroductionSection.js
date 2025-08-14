import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors'; // make sure filename matches (lowercase 'colors.js')

const HeroSection = styled.section`
  background-color: ${colors.background};
  color: ${colors.textPrimary};
  text-align: center;
  padding: 3rem 1.5rem;
  padding-top: 150px;
  box-sizing: border-box;
  overflow: hidden;
`;

const HeroContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled(Heading1)`
  font-size: clamp(2.5rem, 6vw, 3.75rem);
  font-weight: 700;
  line-height: 1;
  margin-bottom: 1.5rem;
  color: ${colors.textPrimary}
`;

//THE Gradient for voxxy logos and headers
const GradientText = styled.span`
  background: linear-gradient(to right,
    ${colors.gradient.start},
    ${colors.gradient.end});

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
`;

const Subtitle = styled(MutedText)`
  font-size: 1.125rem;
  color: ${colors.textMuted};
  max-width: 700px;
  margin: 0 auto 2.5rem auto;
  line-height: 1.6;
`;

const CTAContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 4rem;
`;

const PrimaryButton = styled(Link)`
  display: inline-block;
  background-color: ${colors.primaryButton};
  color: ${colors.textPrimary};
  padding: 0.9rem 1.8rem;
  border-radius: 9999px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
  
  // Better hover state with transform
  &:hover {
    background-color: ${colors.hoverHighlight};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(107, 70, 193, 0.3);
  }
  
  // Focus state for keyboard navigation
  &:focus {
    outline: none;
    border-color: ${colors.focus};
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }
  
  // Active state
  &:active {
    transform: translateY(0);
  }
`;

const GradientButton = styled.a`
  display: inline-block;
  background: transparent;
  border: 2px solid ${colors.primaryButton};
  color: ${colors.primaryButton};
  padding: 0.9rem 1.8rem;
  border-radius: 9999px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  
  // Better hover with background fill
  &:hover {
    background-color: ${colors.primaryButton};
    color: ${colors.textPrimary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(107, 70, 193, 0.3);
  }
  
  // Focus state for keyboard navigation
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.4);
  }
  
  // Active state
  &:active {
    transform: translateY(0);
  }
`;

export default function IntroductionSection() {
  return (
    <HeroSection>
      <HeroContainer>
        <Title>
          Plan together <GradientText>effortlessly</GradientText>
        </Title>

        <Subtitle>
          Voxxy is your AI-powered group planning assistant that makes
          organizing activities with friends as fun as the events themselves.
        </Subtitle>

        <CTAContainer>
          <PrimaryButton to="/signup">Get Started</PrimaryButton>
          <GradientButton href="#try-voxxy">Try Voxxy</GradientButton>
        </CTAContainer>
      </HeroContainer>
    </HeroSection>
  );
}