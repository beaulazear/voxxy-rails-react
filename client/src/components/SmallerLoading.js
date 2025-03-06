import React from "react";
import styled, { keyframes } from "styled-components";
import Voxxy from "../assets/Voxxy.png";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 20vh; /* Smaller height */
  animation: ${fadeIn} 1.5s ease-in-out;
  text-align: center;
  padding: 1rem; /* Less padding */
`;

const Logo = styled.img`
  width: 90px;
  height: 90px;
  animation: ${spin} 2s infinite ease-in-out;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
  }
`;

const LoadingTitle = styled.h2`
  font-size: 1rem;
  font-weight: bold;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1.6rem;
  }
`;

const SmallerLoading = ({title}) => (
    <LoadingContainer>
        <Logo src={Voxxy} alt="Voxxy Logo" />
        <LoadingTitle>{title} Loading...</LoadingTitle>
    </LoadingContainer>
);

export default SmallerLoading;