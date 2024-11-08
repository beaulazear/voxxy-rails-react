import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ScrollableContainer = styled.div`
  overflow-x: auto;
  display: flex;
  padding: 20px 10px; /* Adjust horizontal padding to match gap */
  background-color: #f9f9f9;
  white-space: nowrap;
  height: fit-content;
  scroll-snap-type: x mandatory;
  justify-content: flex-start;
  gap: 20px; /* Space between InfoBox elements */

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
      title: "Personalized & Brand-Consistent",
      description:
        "Customize Voxxy to match your brand’s voice and style, so every conversation feels authentic and aligned with your values.",
    },
    {
      title: "Focus on What Matters",
      description:
        "With Voxxy handling customer interviews, your team can stay focused on driving innovation and enhancing growth."
    },
    {
      title: "Insightful, Data-Driven Decisions",
      description:
        "Gather actionable insights directly from your customers, empowering your team to make data-backed decisions confidently.",
    },
    {
      title: "Seamless Integration & Efficiency",
      description:
        "Easily integrate Voxxy into your existing workflows, helping your team operate efficiently while delivering exceptional customer experiences.",
    }
  ];

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container && boxesData.length > 1) {
      // Center the content in the scrollable area
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