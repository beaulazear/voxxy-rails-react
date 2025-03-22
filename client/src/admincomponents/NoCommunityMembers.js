import React from "react";
import styled from "styled-components";
import Friends from "../assets/Friends.svg";

const NoCommunityContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1100px;
  margin: auto 0;
  padding-top: 0rem;
  text-align: left;

  @media (max-width: 1200px) {
    flex-direction: column;
    text-align: center;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Image = styled.img`
  width: 50%;
  max-width: 450px;
  height: auto;
  border-radius: 12px;
  flex-shrink: 0;
  margin-top: -5vh;

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
  max-width: 550px;

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


export default function NoCommunityMembers() {
    return (
        <NoCommunityContainer>
            <Content>
                <Title>No Community Members Yet? 🤝</Title>
                <Message>
                    Start making connections! Create new boards, plan activities, and watch your community grow. Your friends will show up here soon! 🚀
                </Message>
            </Content>
            <Image src={Friends} alt="People connecting and making friends" />
        </NoCommunityContainer>
    );
}