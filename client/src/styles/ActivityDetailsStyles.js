import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 80px;
  box-sizing: border-box;
  animation: ${fadeIn} 0.8s ease-in-out;
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const ChatButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

export const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s ease;
  color: white;
  background: ${(props) => (props.$isDelete ? "red" : "linear-gradient(135deg, #6a1b9a, #8e44ad)")};

  &:hover {
    background: ${(props) => (props.$isDelete ? "darkred" : "linear-gradient(135deg, #4e0f63, #6a1b8a)")};
  }
`;

export const DimmedOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
`;

export const SmallSection = styled.div`
  padding: 1.5rem;
  border-radius: 16px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 0;
`;
