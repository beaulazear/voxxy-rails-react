import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ScrollableContainer = styled.div`
  overflow-x: auto;
  display: flex;
  padding: 20px 10px;
  background-color: #f9f9f9;
  white-space: nowrap;
  height: fit-content;
  scroll-snap-type: x mandatory;
  justify-content: flex-start;
  gap: 20px;

  @media (min-width: 768px) {
    justify-content: flex-start;
  }
`;

const InfoBox = styled.div`
  min-width: 310px;
  width: 300px;
  height: 200px;
  padding: 20px;
  background-color: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  text-align: center;
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  white-space: normal;
  scroll-snap-align: center;
`;

const InfoTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`;

const InfoDescription = styled.p`
  font-size: 18px;
  color: #555;
  line-height: 1.6;
`;

const InfoBoxes = () => {
  const boxesData = [
    {
      title: "Engage Customers at Scale",
      description:
        "Voxxy chats with hundreds of customers at once, saving you time and resources."
    },
    {
      title: "Turn Feedback into Growth",
      description:
        "Use Voxxy's insights to improve customer satisfaction, guide product development, and build loyalty."
    },
    {
      title: "Increased Response Rates",
      description:
        "Voxxy's conversational style makes feedback collection feel natural, leading to higher customer engagement and response rates."
    },
    {
      title: "Get Real-Time Insights",
      description:
        "With instant analytics and summaries, you can make data-driven decisions faster."
    },
    {
      title: "Customize to Fit Your Brand",
      description:
        "Set the tone, style, and questions that align with your brand's voice and values."
    },
    {
      title: "Qualitative Data Made Simple",
      description:
        "Transforms open-ended feedback into organized insights, so you can quickly understand customer trends and needs."
    }
  ];

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container && boxesData.length > 1) {
      const scrollPosition = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [boxesData.length]);

  return (
    <ScrollableContainer ref={containerRef}>
      {boxesData.map((box, index) => (
        <InfoBox key={index}>
          <InfoTitle>{box.title}</InfoTitle>
          <InfoDescription>{box.description}</InfoDescription>
        </InfoBox>
      ))}
    </ScrollableContainer>
  );
};

export default InfoBoxes;