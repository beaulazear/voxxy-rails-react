import React from "react";
import styled from "styled-components";

const PinnedActivityCard = ({ pinned }) => {
    return (
        <Card>
            <Title>{pinned.title}</Title>
            <Description>{pinned.description}</Description>
            <Details>
                <DetailItem>⏰ {pinned.hours || "N/A"}</DetailItem>
                <DetailItem>💸 {pinned.price_range || "N/A"}</DetailItem>
                <DetailItem>📍 {pinned.address || "N/A"}</DetailItem>
            </Details>
        </Card>
    );
};

export default PinnedActivityCard;

// Styled Components
const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  border-left: 8px solid #ff6b6b;
  margin-bottom: 16px; /* More space between elements */

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  }
`;

const Title = styled.h3`
  font-size: 1.4rem;
  font-weight: bold;
  color: #222;
  margin-bottom: 6px;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #444;
  line-height: 1.5;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 500;
`;

const DetailItem = styled.span`
  font-size: 1rem;
  color: #666;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;