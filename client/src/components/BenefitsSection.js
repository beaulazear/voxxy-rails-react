import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const BenefitsContainer = styled.section`
  background: linear-gradient(to right,
    hsl(291, 80%, 55%, 0.9),
    hsl(262, 95%, 70%, 0.9),
    hsl(267, 90%, 65%, 0.9)); 
  padding: 6rem 2rem;
  margin: 0 auto;
  text-align: center;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const Title = styled.h2`
  font-size: clamp(2rem, 5vw, 2.25rem);
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #f0f0f0;
  max-width: 600px;
  margin: 0 auto 2.5rem auto;
`;

const CTAContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Link)`
  display: inline-block;
  background-color: #ffffff;
  color: #9d60f8;
  padding: 0.8rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
    color: #8b4ee4; /* Slightly darker shade of your primary color */
  }
`;

const SecondaryLink = styled(Link)`
  display: inline-block;
  padding: 0.8rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  text-decoration: none;
  border: 2px solid #ffffff;
  color: #ffffff;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }
`;

export default function Benefits() {
  return (
    <BenefitsContainer>
      <Title>Start planning your next adventure today</Title>

      <Subtitle>
        Join thousands of friend groups using Voxxy to create memorable
        experiences together.
      </Subtitle>

      <CTAContainer>
        <PrimaryButton to='/signup'>Get started for free</PrimaryButton>
        <SecondaryLink to="/learn-more">Learn more</SecondaryLink>
      </CTAContainer>
    </BenefitsContainer>
  );
}