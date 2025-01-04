import React from 'react';
import styled from 'styled-components';
import BikingImage from '../assets/Biking.png';
import CommentsImage from '../assets/Comments.png';
import TargetImage from '../assets/Target.png';

const BenefitsContainer = styled.section`
  padding: 4rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
  background: radial-gradient(ellipse at center, #e9dfff 30%, #ffffff 70%);
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: bold;
  text-align: center;
  margin-bottom: 3rem;
  color: #000;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;

  &:nth-child(even) {
    flex-direction: row-reverse;
  }

  @media (max-width: 768px) {
    flex-direction: column !important;
    text-align: center;
    gap: 1.5rem;
  }
`;

const BenefitText = styled.div`
  flex: 1;
`;

const BenefitTitle = styled.h3`
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #000;
`;

const BenefitSubtitle = styled.p`
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #666;
`;

const BenefitDescription = styled.p`
  font-size: clamp(0.9rem, 1.8vw, 1rem);
  color: #444;
  line-height: 1.6;
`;

const BenefitImage = styled.img`
  flex: 1;
  max-width: 300px;
  height: auto;

  @media (max-width: 768px) {
    max-width: 250px;
  }
`;

const Benefits = () => (
    <BenefitsContainer>
        <Title>More Than Just Planning: The Voxxy Way</Title>

        {/* Benefit 1 */}
        <BenefitItem>
            <BenefitImage src={BikingImage} alt="Enjoy the Journey" />
            <BenefitText>
                <BenefitTitle>Enjoy the Journey, Not Just the Event</BenefitTitle>
                <BenefitSubtitle>
                    From first idea to final memory, Voxxy is with you every step of the way
                </BenefitSubtitle>
                <BenefitDescription>
                    Voxxy handles the entire planning process—from the first idea, coordinating flights, setting dates, and finalizing itineraries—to keep everyone aligned from start to finish.
                </BenefitDescription>
            </BenefitText>
        </BenefitItem>

        {/* Benefit 2 */}
        <BenefitItem>
            <BenefitImage src={CommentsImage} alt="Conversations That Drive Decisions" />
            <BenefitText>
                <BenefitTitle>Conversations That Drive Decisions</BenefitTitle>
                <BenefitSubtitle>
                    Everyone gets a voice, and every voice leads to action.
                </BenefitSubtitle>
                <BenefitDescription>
                    Voxxy doesn’t rely on endless group chats. It uses smart, time-flexible conversations to gather input from everyone individually and consolidates their thoughts into clear, actionable decisions everyone can agree on.
                </BenefitDescription>
            </BenefitText>
        </BenefitItem>

        {/* Benefit 3 */}
        <BenefitItem>
            <BenefitImage src={TargetImage} alt="A Living Plan That Evolves With You" />
            <BenefitText>
                <BenefitTitle>A Living Plan That Evolves With You</BenefitTitle>
                <BenefitSubtitle>
                    Stay connected before, during, and after the plan comes to life.
                </BenefitSubtitle>
                <BenefitDescription>
                    With Voxxy, planning doesn’t stop once the itinerary is set. Log flight details, pin lodging locations, share restaurant picks, update dates, track tasks, and keep conversations alive—all in one shared space.
                </BenefitDescription>
            </BenefitText>
        </BenefitItem>
    </BenefitsContainer>
);

export default Benefits;