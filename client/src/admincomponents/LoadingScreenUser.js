import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import voxxyLogo from '../assets/Voxxy_header.jpeg'; // adjust path as needed

// Animations
const fadeInPulse = keyframes`
  0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.03); }
  100% { opacity: 0.7; transform: scale(1); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled Components
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
`;

const Modal = styled.div`
  background: white;
  padding: 30px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 90%;
  width: 420px;
`;

const Logo = styled.img`
  width: 100px;
  margin-bottom: 20px;
  animation: ${fadeInPulse} 1.8s ease-in-out infinite;
`;

const Title = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #6c63ff;
  font-family: 'Arial', sans-serif;
`;

const SubText = styled.p`
  font-size: 0.95rem;
  color: #555;
  font-family: 'Arial', sans-serif;
`;

const Spinner = styled.div`
  margin: 20px auto 0;
  width: 40px;
  height: 40px;
  border: 3px solid #ccc;
  border-top: 3px solid #6c63ff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

function LoadingScreenUser({ onComplete, autoDismiss = true }) {
  useEffect(() => {
    if (autoDismiss && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [onComplete, autoDismiss]);

  return (
    <Backdrop>
      <Modal>
        <Logo src={voxxyLogo} alt="Voxxy logo" />
        <Title>Loading your board...</Title>
        <SubText>Voxxy is finding the best restaurant matches based on everyone's preferences 🍽️</SubText>
        <Spinner />
      </Modal>
    </Backdrop>
  );
}

export default LoadingScreenUser;