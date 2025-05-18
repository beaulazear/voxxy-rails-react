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
              Nothing to see here yet!
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
  text-align: left;
  @media (min-width: 768px) {
    flex: 1;
    margin-right: 2rem;
  }
`;

const Content = styled.div`
  max-width: 600px;
`;

const Message = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #fff;
  margin: 0.5rem 0.5rem 0;
`;