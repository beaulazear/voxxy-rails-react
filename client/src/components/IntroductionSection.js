import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Heading1, MutedText } from '../styles/Typography';
import colors from '../styles/Colors'; // make sure filename matches (lowercase 'colors.js')

const HeroSection = styled.section`
  background-color: ${colors.background};zz
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

//THE Gradient for voxxy logos and headers.
const GradientText = styled.span`
  background: linear-gradient(to right,
    hsl(291, 80%, 55%, 0.9),
    hsl(262, 95%, 70%, 0.9),
    hsl(267, 90%, 65%, 0.9));

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  padding: 0.8rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  text-decoration: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${colors.hoverHighlight};
  }
`;

const GradientButton = styled.a`
  display: inline-block;
  background: none;
  border: solid 1px;
  color: ${colors.primaryButton};
  padding: 0.8rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  text-decoration: none;
  transition: opacity 0.2s ease;

  &:hover {
    box-shadow: 0 0 10px #592566, 0 0 20px #592566;
    background-color: ${colors.cardBackground}; /* keep same background, or tweak if you like */
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