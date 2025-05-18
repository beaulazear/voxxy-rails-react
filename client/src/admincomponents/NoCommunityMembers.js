import React from "react";
import styled from "styled-components";
import SmallTriangle from "../assets/SmallTriangle.png";
import colors from '../styles/Colors';

export default function NoCommunityMembers() {
  return (
    <Hero>
      <Overlay />
      <Content>
        <Icon src={SmallTriangle} alt="Voxxy icon" />
        <Title>Voxxy Community</Title>
        <Subtitle>
          Grow your community by creating activities and inviting friends!
        </Subtitle>
        <ActionButton>Make Some Memories</ActionButton>
      </Content>
    </Hero>
  );
}

const Hero = styled.section`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 3rem;

  @media(max-width: 800px) {
    padding: 1rem;
    padding-top: 3rem;
  }
`;

const Overlay = styled.div`
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 1rem;
  max-width: 800px;
`;

const Icon = styled.img`
  width: clamp(96px, 10vw, 120px);
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: bold;
  color: #fff;
  padding: 1rem 0 0;
`;

const Subtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #fff;
  margin: 0.5rem 0 1rem;
  padding: 1rem;
`;

const ActionButton = styled.button`
  font-family: 'Lato', sans-serif;
  font-size: clamp(0.875rem, 2vw, 1.125rem);
  padding: 0.6em 1.8em;
  font-weight: 600;
  border-radius: 999px;
  background: white;
  color: ${colors.primaryDark};
  border: 2px solid rgba(255,255,255,0.8);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255,255,255,0.9);
    transform: translateY(-1px);
  }
`;