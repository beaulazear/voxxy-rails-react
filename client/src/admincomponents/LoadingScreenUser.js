import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff; /* or any background you like */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* ensure it appears on top */
`;

const Title = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 10px;
  color: #6c63ff;
  font-family: 'Arial', sans-serif;
`;

const SubText = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 20px;
  font-family: 'Arial', sans-serif;
`;

const fillAnimation = keyframes`
  0% {
    stroke-dashoffset: 226.19; /* length around the circle's perimeter */
  }
  100% {
    stroke-dashoffset: 0;
  }
`;

const SvgContainer = styled.svg`
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
`;

const BackgroundCircle = styled.circle`
  stroke: #eee;
  stroke-width: 8;
  fill: none;
`;

const ProgressCircle = styled.circle`
  stroke: #6c63ff;
  stroke-width: 8;
  fill: none;
  stroke-dasharray: 226.19;
  stroke-dashoffset: 226.19;
  animation: ${fillAnimation} 2s linear forwards;
`;

function LoadingScreenUser({ onComplete }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <Overlay>
            <Title>Finding the perfect spots...</Title>
            <SubText>Searching for the best restaurant recommendations based on your preferences</SubText>
            <SvgContainer viewBox="0 0 80 80">
                <BackgroundCircle cx="40" cy="40" r="36" />
                <ProgressCircle cx="40" cy="40" r="36" />
            </SvgContainer>
        </Overlay>
    );
}

export default LoadingScreenUser;