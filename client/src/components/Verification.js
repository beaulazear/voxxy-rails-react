import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 400px;
  margin: 3rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-family: 'Inter', sans-serif;
  animation: ${fadeIn} 0.8s ease-out;
`;

const IconWrapper = styled.div`
  width: 50px;
  height: 50px;
  background: #f2e8ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const Icon = styled.img`
  width: 24px;
  height: 24px;
  filter: invert(38%) sepia(66%) saturate(750%) hue-rotate(230deg);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
`;

const Message = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
`;

const Verification = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Container>
      <IconWrapper>
        <Icon src="/email-icon.svg" alt="Check Icon" />
      </IconWrapper>
      <Title>Email Verified Successfully!</Title>
      <Message>Thank you for verifying your email. You will be redirected to the login page shortly.</Message>
    </Container>
  );
};

export default Verification;
