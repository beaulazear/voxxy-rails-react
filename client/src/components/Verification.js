import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const VerificationSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 60vh;
  background: linear-gradient(to right, #7f31d9 0%, #431a73 100%);
  color: white;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 400;
  font-family: 'Unbounded', sans-serif;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  margin-top: 10px;
  font-size: 1.8rem;
  margin-bottom: 20px;
  max-width: 750px;
  line-height: 1.6;
  font-family: 'Montserrat', sans-serif;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const StyledLink = styled(Link)`
  background-color: white;
  color: #6a0dad;
  text-decoration: none;
  font-size: 1rem;
  padding: 0.75rem 2rem;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f3f3f3;
    color: #6a0dad;
  }
`;

const Verification = () => {
    return (
        <VerificationSection>
            <Title>Email Verified Successfully!</Title>
            <Subtitle>
                Thank you for verifying your email. You can now log in to your account.
            </Subtitle>
            <StyledLink to="/login">Go to Login</StyledLink>
        </VerificationSection>
    );
};

export default Verification;