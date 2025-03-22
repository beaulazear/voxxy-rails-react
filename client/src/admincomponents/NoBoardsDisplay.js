import React from "react";
import styled from "styled-components";
import Friends from "../assets/FriendLunch.svg"; // Your uploaded image

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

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  max-width: 500px;

  @media (max-width: 768px) {
    align-items: center;
    max-width: 100%;
  }
`;

const Title = styled.h2`
  font-size: clamp(2rem, 3vw, 2.5rem);
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    text-align: center;
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
  }
`;

const StartButton = styled.button`
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #ffffff40, #ffffff20);
  border: 2px solid white;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  backdrop-filter: blur(8px);

  &:hover {
    background: white;
    color: #8e44ad;
  }

  @media (max-width: 768px) {
    width: 100%;
    text-align: center;
  }
`;

export default function NoBoardsDisplay({ onCreateBoard }) {
  return (
    <NoBoardsContainer>
      <Image src={Friends} alt="Friends enjoying a meal" />
      <Content>
        <Title>No Boards? 😲</Title>
        <Message>
          Don’t wait for your friends to invite you—be the one to start the next activity! Get your group together, plan something fun, and make unforgettable memories. 🚀
        </Message>
        <StartButton onClick={onCreateBoard}>➕ Start Planning Now</StartButton>
      </Content>
    </NoBoardsContainer>
  );
}