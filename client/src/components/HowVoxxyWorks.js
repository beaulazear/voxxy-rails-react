import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import WalkingAroundImage from '../assets/WalkingAround.png';
import OrganizingImage from '../assets/Organizing.png'; // Placeholder
import PlanningImage from '../assets/Planning.png';
import GroupCallImage from '../assets/GroupCall.png'

const SectionContainer = styled.section`
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 16px;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: bold;
  margin-bottom: 2rem;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 1rem;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c7d2fe;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const Tab = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  text-align: center;
  padding: 1rem;
  width: clamp(120px, 15vw, 200px);
  height: 60px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  white-space: normal;

  &:hover {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  }

  &.active {
    background: linear-gradient(135deg, #c7d2fe, #e0e7ff);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    flex-shrink: 0;
  }
`;

const TabText = styled.p`
  font-size: clamp(0.9rem, 1.2vw, 1rem);
  font-weight: 600;
  color: ${(props) => (props.active ? '#000' : '#444')};
  margin: 0;
  text-align: left;
`;

const ContentContainer = styled.div`
  display: flex;
  align-items: left;
  justify-content: center;
  gap: 2rem;
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 20px rgba(173, 151, 255, 0.3);
  height: 400px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    height: auto;
    padding: 1.5rem;
  }
`;

const TextContainer = styled.div`
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ContentTitle = styled.h3`
  font-size: clamp(1.5rem, 2.5vw, 1.8rem);
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: left;
`;

const ContentDescription = styled.p`
  font-size: clamp(1rem, 1.8vw, 1.1rem);
  color: #555;
  line-height: 1.5;
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    max-width: 350px;
    height: auto;
  }

  @media (max-width: 768px) {
    max-width: 300px;
    margin: 0 auto;
    justify-content:
    align-items: center;
  }
`;

const ButtonsContainer = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const CTAButton = styled.button`
  padding: 0.7rem .9rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  width: 100px;

  &:first-child {
    background: linear-gradient(135deg, #f3f4f6, #e0e7ff);
    color: #000;
  }

  &:last-child {
    background: linear-gradient(135deg, #c7d2fe, #e0e7ff);
    color: #000;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const HowVoxxyWorks = () => {
  const [activeTab, setActiveTab] = useState('tab1');

  const navigate = useNavigate()

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleSignupClick = () => {
    navigate('/signup')
  }

  const contentData = {
    tab1: {
      title: 'Finallyyyy make it out of the group chat',
      description:
        'We’ve all been there: endless group chats filled with “We should totally go on that trip!” or “Let’s plan a dinner soon!”—but somehow, it never happens. Voxxy takes those good intentions, organizes them into clear action steps, and gets your group from “someday” to “it’s happening.”',
      image: WalkingAroundImage,
      buttons: true,
    },
    tab2: {
      title: 'Every Voice Heard, Every Preference Counted',
      description:
        'Voxxy turns scattered group prefences into actionable insights. By collecting and analyzing everyone’s input, Voxxy delivers summaries that make decision-making fast, easy, and frustration-free.',
      image: GroupCallImage,
      buttons: false,
    },
    tab3: {
      title: 'Your group’s central hub for plans, tasks, and updates.',
      description:
        'Keeping track of who needs to do what—and by when—shouldn’t feel like detective work. The Voxxy Board centralizes all your trip details, deadlines, and updates in one easy-to-find place, so nothing slips through the cracks.',
      image: OrganizingImage,
      buttons: true,
    },
    tab4: {
      title: 'Because great plans rely on great follow-through',
      description:
        'No more last-minute scrambles. Voxxy sends friendly reminders to ensure tasks—like booking tickets or making payments—are done on time, keeping your group’s plans smooth and stress-free.',
      image: PlanningImage,
      buttons: false,
    },
  };

  const { title, description, image, buttons } = contentData[activeTab];

  return (
    <SectionContainer>
      <Title>How Voxxy Brings Us Together</Title>
      <TabsContainer>
        <Tab
          className={activeTab === 'tab1' ? 'active' : ''}
          onClick={() => setActiveTab('tab1')}
        >
          <TabText>Say Goodbye to Endless Text Chains</TabText>
        </Tab>
        <Tab
          className={activeTab === 'tab2' ? 'active' : ''}
          onClick={() => setActiveTab('tab2')}
        >
          <TabText>Plans That Fit Everyone's Needs</TabText>
        </Tab>
        <Tab
          className={activeTab === 'tab3' ? 'active' : ''}
          onClick={() => setActiveTab('tab3')}
        >
          <TabText>Stay Organized with the Voxxy Board</TabText>
        </Tab>
        <Tab
          className={activeTab === 'tab4' ? 'active' : ''}
          onClick={() => setActiveTab('tab4')}
        >
          <TabText>Never Miss a Deadline with Task Reminders</TabText>
        </Tab>
      </TabsContainer>
      <ContentContainer>
        <ImageContainer>
          <img src={image} alt="Feature Illustration" />
        </ImageContainer>
        <TextContainer>
          <ContentTitle>{title}</ContentTitle>
          <ContentDescription>{description}</ContentDescription>
          {buttons && (
            <ButtonsContainer>
              <CTAButton onClick={handleSignupClick}>Sign Up</CTAButton>
              <CTAButton onClick={handleLoginClick}>Log In</CTAButton>
            </ButtonsContainer>
          )}
        </TextContainer>
      </ContentContainer>
    </SectionContainer>
  );
};

export default HowVoxxyWorks;