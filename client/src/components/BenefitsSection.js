import React from 'react';
import styled from 'styled-components';

const BenefitsContainer = styled.section`
  background: linear-gradient(90deg, #b279fa, #9d60f8); 
  padding: 4rem 2rem;
  margin: 0 auto;
  text-align: center;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

// 2. Main heading
const Title = styled.h2`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
`;

// 3. Subtitle text
const Subtitle = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #f0f0f0;
  max-width: 600px;
  margin: 0 auto 2.5rem auto;
`;

// 4. Container for the call-to-action buttons/links
const CTAContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

// 5. Primary solid button
const PrimaryButton = styled.a`
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

// 6. Secondary link or button
const SecondaryLink = styled.a`
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
      {/* Main Heading */}
      <Title>Start planning your next adventure today</Title>

      {/* Subtitle */}
      <Subtitle>
        Join thousands of friend groups using Voxxy to create memorable
        experiences together.
      </Subtitle>

      {/* CTA Buttons */}
      <CTAContainer>
        <PrimaryButton href="#get-started">Get started for free</PrimaryButton>
        <SecondaryLink href="#learn-more">Learn more</SecondaryLink>
      </CTAContainer>
    </BenefitsContainer>
  );
}