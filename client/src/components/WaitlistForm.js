import React from "react";
import styled from "styled-components";

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  text-align: center;

  @media (min-width: 600px) {
    padding: 3rem;
  }
`;

const Heading = styled.h2`
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: #333;
  max-width: 90%;

  @media (min-width: 600px) {
    font-size: 1.75rem;
    max-width: 600px;
  }
`;

const WaitlistForm = () => {
  return (
    <FormContainer>
      <Heading>
        We’re currently offering early access to our Beta platform. Join our
        waitlist for an exclusive opportunity to experience Voxy’s AI-driven
        customer interviews firsthand.
      </Heading>
    </FormContainer>
  );
};

export default WaitlistForm;