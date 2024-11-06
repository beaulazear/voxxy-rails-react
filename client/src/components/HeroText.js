// src/components/HeroText.js
import React from 'react';
import styled from 'styled-components';

const HeroTextContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  padding: 2rem 1rem;
  background-color: #f5f5f5;
  text-align: center;
  box-sizing: border-box; /* Ensure padding does not cause overflow */
`;

const HeroTextHeading = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
  max-width: 90%;
  
  @media (min-width: 768px) {
    font-size: 3rem;
  }

  @media (min-width: 1024px) {
    font-size: 3.5rem;
  }
`;

const HeroText = () => {
  return (
    <HeroTextContainer>
      <HeroTextHeading>Ready to Supercharge Your Customer Insights?</HeroTextHeading>
    </HeroTextContainer>
  );
};

export default HeroText;