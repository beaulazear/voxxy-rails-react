import React from 'react';
import styled from 'styled-components';

const InfoBoxesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 20px 50px;
  background-color: #f9f9f9;

  @media (max-width: 768px) {
    padding: 10px 20px;
    flex-direction: column;
  }
`;

const InfoBox = styled.div`
  flex: 1 1 45%;
  margin: 10px;
  padding: 20px;
  background-color: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  text-align: center;
  max-width: 300px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const InfoTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`;

const InfoDescription = styled.p`
  font-size: 16px;
  color: #555;
  line-height: 1.5;
`;

const InfoBoxes = () => {
    const boxesData = [
        {
            title: "Personalized & Brand-Consistent",
            description:
                "Customize Voxxy to match your brand’s voice and style, so every conversation feels authentic and aligned with your values.",
        },
        {
            title: "Focus on What Matters",
            description:
                "With Voxxy supporting with customer interviews, your team can stay focused on innovation and growth.",
        },
        {
            title: "Insightful, Data-Driven Decisions",
            description:
                "Gather actionable insights directly from your customers, empowering your team to make data-backed decisions confidently.",
        },
        // Add more boxes here if needed
    ];

    return (
        <InfoBoxesContainer>
            {boxesData.map((box, index) => (
                <InfoBox key={index}>
                    <InfoTitle>{box.title}</InfoTitle>
                    <InfoDescription>{box.description}</InfoDescription>
                </InfoBox>
            ))}
        </InfoBoxesContainer>
    );
};

export default InfoBoxes;
