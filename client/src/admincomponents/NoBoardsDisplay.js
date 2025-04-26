import React from "react";
import styled, { keyframes } from "styled-components";
import Friends from "../assets/FriendLunch.svg";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const NoBoardsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  max-width: 1100px;
  margin: auto 0;
  padding-top: 0rem;
  text-align: left;
  padding-bottom: 25px;
  animation: ${fadeIn} 0.8s ease-out;

  @media (max-width: 1024px) {
    gap: 1rem;
    max-width: 900px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
`;

const Image = styled.img`
  width: 50%;
  max-width: 450px;
  height: auto;
  border-radius: 12px;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 55%;
    max-width: 380px;
  }

  @media (max-width: 768px) {
    width: 85%;
    max-width: 320px;
  }

  @media (max-width: 480px) {
    width: 100%;
    max-width: 280px;
  }
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 1.25rem;
  line-height: 1.5;

  @media (max-width: 768px) {
    text-align: center;
    font-size: 1rem;
    padding-right: 3rem;
    padding-left: 3rem;
  }
`;

export default function NoBoardsDisplay() {
  return (
    <NoBoardsContainer>
      <Image src={Friends} alt="Friends enjoying a meal" />
        <Message>
          No boards! Don’t wait for your friends to invite you—be the one to start the next activity! 🎉
        </Message>
    </NoBoardsContainer>
  );
}