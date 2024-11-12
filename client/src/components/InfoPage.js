import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Import fonts globally
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #333;
  font-family: 'Roboto', sans-serif;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-family: 'Caveat', cursive;
  color: #4b0082;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  max-width: 700px;
  color: #555;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2.2rem;
  font-family: 'Caveat', cursive;
  color: #4b0082;
  margin: 2rem 0 1rem;

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const SectionDescription = styled.p`
  font-size: 1.2rem;
  max-width: 700px;
  color: #555;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const DemoButton = styled.button`
  background-color: #4b0082;
  color: white;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 2rem;

  &:hover {
    background-color: #6a1ab1;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.6rem 1.5rem;
  }
`;

const FooterText = styled.p`
  font-size: 1rem;
  color: #333;
  max-width: 700px;
  margin: 2rem 0 1rem;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const InfoPage = () => {
  const navigate = useNavigate();

  function onSubmit() {
    navigate("/demo")
  }

  return (
    <>
      <GlobalStyle />
      <Container>
        <Title>Thank You for Joining the Voxxy Waitlist!</Title>
        <Subtitle>
          Thanks for signing up! We’re excited to have you on board as one of the
          first to experience Voxxy, where customer insights meet cutting-edge AI.
        </Subtitle>

        <SectionTitle>Want a Sneak Peek?</SectionTitle>
        <SectionDescription>
          While you’re here, would you like to try a quick demo of Voxxy? See
          firsthand how our AI-powered conversations can transform customer
          feedback into actionable insights.
        </SectionDescription>

        <DemoButton onClick={onSubmit}>Try the Demo</DemoButton>

        <FooterText>
          Don’t worry if you’re not ready for the demo just yet—we’ll be reaching
          out soon with updates and next steps as we prepare to launch!
        </FooterText>
      </Container>
    </>
  );
};

export default InfoPage;