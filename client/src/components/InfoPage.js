import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  color: #333;
`;

const Title = styled.h1`
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 2em;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2em;
  margin-bottom: 30px;
  max-width: 600px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 1em;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2em;
  font-weight: bold;
  margin: 30px 0 15px;

  @media (max-width: 768px) {
    font-size: 1.5em;
  }
`;

const SectionDescription = styled.p`
  font-size: 1.1em;
  margin-bottom: 30px;
  max-width: 600px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 1em;
  }
`;

const DemoButton = styled.button`
  background-color: #8a2be2;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 30px;

  &:hover {
    background-color: #6a1ab1;
  }

  @media (max-width: 768px) {
    font-size: 0.9em;
    padding: 12px 24px;
  }
`;

const FooterText = styled.p`
  font-size: 1em;
  color: #333;
  margin: 40px 0 10px;
  max-width: 600px;

  @media (max-width: 768px) {
    font-size: 0.9em;
  }
`;

const InfoPage = () => {
    const navigate = useNavigate();

    function onSubmit() {
        navigate("/demo")
    }

    return (
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
    );
};

export default InfoPage;