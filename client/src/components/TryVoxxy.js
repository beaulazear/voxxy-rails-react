import React, { useEffect } from "react";
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import Footer from './Footer';

const colors = {
  background: '#0D0B1F',
  foreground: '#FFFFFF',
  muted: '#A8A8A8',
  primary: 'rgba(157,96,248,1)',
  cardBackground: 'rgba(27,24,49,0.95)',
};

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${colors.background};
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex-grow: 1;
  padding-top: 6rem;
  padding-bottom: 4rem;
`;

const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const TitleSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: white;
  @media (min-width: 640px) {
    font-size: 3.125rem;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(90deg, ${colors.primary} 0%, rgba(98,69,250,1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-size: 1.125rem;
  color: ${colors.muted};
  max-width: 32rem;
  margin: 0 auto;
`;

const CardWrapper = styled.div`
  max-width: 28rem;
  margin: 0 auto 4rem;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  padding: 2rem;
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const IconWrapper = styled.div`
  background-color: rgba(157, 96, 248, 0.1);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${colors.foreground};
  margin-bottom: 1rem;
`;

const CardText = styled.p`
  color: ${colors.muted};
  margin-bottom: 1.5rem;
`;

const StyledLink = styled(Link)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: ${colors.primary};
  color: ${colors.foreground};
  padding: 0.75rem;
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(157, 96, 248, 0.9);
  }
`;

const CTASection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const CTAHeading = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  color: ${colors.foreground};
  margin-bottom: 1.5rem;
`;

const CTAButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  text-decoration: none;
  background-color: ${colors.primary};
  color: ${colors.foreground};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(157, 96, 248, 0.9);
  }
`;

export default function TryVoxxy() {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageContainer>
      <Main>
        <Container>
          <TitleSection>
            <Title>
              Try <GradientText>Voxxy</GradientText> Today
            </Title>
            <Description>
              Take a quick quiz to get recommendations on the perfect spot for your group meals.
            </Description>
          </TitleSection>

          <CardWrapper>
            <Card>
              <IconWrapper>
                <Calendar size={24} color={colors.primary} />
              </IconWrapper>
              <CardTitle>Plan a Group Restaurant Visit</CardTitle>
              <CardText>
                Find the perfect restaurant for your group based on everyone's preferences and dietary needs.
              </CardText>
              <div style={{ marginTop: 'auto' }}>
                <StyledLink to="/dinner/form">
                  Try Restaurant Planning <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                </StyledLink>
              </div>
            </Card>
          </CardWrapper>

          <CTASection>
            <CTAHeading>Ready to get started?</CTAHeading>
            <CTAButtons>
              <CTAButton to="/signup">Create Your Account</CTAButton>
            </CTAButtons>
          </CTASection>
        </Container>
      </Main>
      <Footer />
    </PageContainer>
  );
}