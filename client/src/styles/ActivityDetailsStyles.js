import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 50% 50%; }
  20% { background-position: 80% 30%; }
  40% { background-position: 70% 80%; }
  60% { background-position: 30% 70%; }
  80% { background-position: 20% 20%; }
  100% { background-position: 50% 50%; }
`;

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 1rem;
  padding-bottom: 40px;
  padding-top: 30px;
  box-sizing: border-box;
  background-size: 400% 400%;
background-image: linear-gradient(
  to right,
  #201925,    /* your base */
  #251C2C,    /* your backgroundTwo */
  #2a1e30,    /* your cardBackground */
  #422151     /* purple2 */
);
  animation: ${fadeIn} 0.8s ease-in-out, ${gradientAnimation} 15s ease infinite;
`;

export const ChatButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  @media (max-width: 480px) {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
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
  background: ${(props) =>
    props.$isDelete ? "red" : "#cc31e8"};

  &:hover {
    background: ${(props) =>
    props.$isDelete
      ? "darkred"
      : "linear-gradient(135deg, #4e0f63, #6a1b8a)"};
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
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
