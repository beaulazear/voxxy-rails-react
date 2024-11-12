import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// Global style to import the Caveat font
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');
`;

// Main container for the section
const InfoSection = styled.div`
  max-width: 800px;
  margin: 40px auto;
  text-align: center;
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 600;
  font-family: 'Caveat', cursive;
  color: #333;
  margin-bottom: 20px;
`;

const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  font-family: 'Roboto', sans-serif;
  color: #333;
  max-width: 700px;
  margin: 0 auto;
`;

const InfoComponent = () => {
    return (
        <>
            <GlobalStyle />
            <InfoSection>
                <Title>What is Voxxy?</Title>
                <Description>
                    Voxxy is an AI-powered customer feedback platform designed to make gathering insights from your customers easy, engaging, and actionable.
                    Using advanced conversational AI, Voxxy conducts natural, interactive interviews with your customers, giving you access to deeper, more meaningful
                    feedback than traditional surveys can provide.
                </Description>
            </InfoSection>
        </>
    );
};

export default InfoComponent;