import React from "react";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function NoBoardsDisplay() {
  return (
    <Container>
      <Row>
        <TextContainer>
          <Content>
            <Message>
              Nothing to see here. Don’t wait for your friends to invite you—be the one to start the next activity! 🎉
            </Message>
          </Content>
        </TextContainer>
      </Row>
    </Container>
  );
}

const Container = styled.div`
  border-radius: 1rem;
  max-width: 450px;
  padding-left:0.5rem;
  animation: ${fadeIn} 0.8s ease-out;
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

const TextContainer = styled.div`
  @media (min-width: 768px) {
    text-align: left;
    flex: 1;
    margin-right: 2rem;
  }
`;

const Content = styled.div`
  max-width: 600px;
`;

const Message = styled.p`
  font-family: 'Lato', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 300;       /* light */
  color: rgba(255,255,255,0.8);
  margin-bottom: 1rem;
  line-height: 1.6;
  letter-spacing: -0.25px;
  text-align: left;
`;