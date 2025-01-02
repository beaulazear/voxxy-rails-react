import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Benefits from '../components/Benefits';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  margin-top: 80px; /* Prevents content from overlapping navbar */
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 100px 20px;
  background-color: #fff;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 80px 10px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin: 10px 0;
  background: linear-gradient(to right, #6c63ff, #e942f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 30px;
  max-width: 700px;
  color: #555;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const PrimaryButton = styled.button`
  padding: 10px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 5px;
  width: 210px;
  border: none;
  cursor: pointer;
  background: linear-gradient(to right, #ff4d4d, #ff7878);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const SecondaryButton = styled.button`
  padding: 10px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 5px;
  width: 210px;
  border: none;
  cursor: pointer;
  background: linear-gradient(to right, #6c63ff, #e942f5);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const SectionWrapper = styled.section`
  width: 100%;
  margin-top: 50px;
`;

function Home() {
  const navigate = useNavigate();

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <HomeContainer>
      <HeroSection>
        <HeroTitle>Plan your next adventure</HeroTitle>
        <HeroSubtitle>
          Voxxy helps you and your crew plan without the chaos.
        </HeroSubtitle>
        <ButtonContainer>
          <PrimaryButton onClick={handleSignupClick}>Sign up to get started</PrimaryButton>
          <SecondaryButton onClick={handleLoginClick}>Log in to continue</SecondaryButton>
        </ButtonContainer>
      </HeroSection>

      <SectionWrapper>
        <Benefits />
      </SectionWrapper>
    </HomeContainer>
  );
}

export default Home;