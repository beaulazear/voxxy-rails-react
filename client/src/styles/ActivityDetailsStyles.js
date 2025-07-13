import styled, { keyframes } from 'styled-components';
import { colors } from "../styles/ActivityHeaderStyles";

// Keyframes
export const gradientMove = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const smokeDriftA = keyframes`
  0%   { transform: translate(-20%, -20%) scale(1); opacity: 0.5; }
  50%  { transform: translate(20%, 20%) scale(1.2); opacity: 0.3; }
  100% { transform: translate(-20%, -20%) scale(1); opacity: 0.5; }
`;

export const smokeDriftB = keyframes`
  0%   { transform: translate(20%, -20%) scale(1); opacity: 0.4; }
  50%  { transform: translate(-20%, 20%) scale(1.3); opacity: 0.2; }
  100% { transform: translate(20%, -20%) scale(1); opacity: 0.4; }
`;

// Styled Components
export const AnimatedSmokeBackground = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  
  background: linear-gradient(
    135deg,
    #201925,
    #1e1824,
    #1c1422
  );
  background-size: 300% 300%;
  animation: ${gradientMove} 25s ease infinite;

  &::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.08),
      transparent 60%
    );
    filter: blur(100px);
    mix-blend-mode: overlay;
    animation: ${smokeDriftA} 40s ease-in-out infinite;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%; right: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.06),
      transparent 50%
    );
    filter: blur(120px);
    mix-blend-mode: overlay;
    animation: ${smokeDriftB} 55s ease-in-out infinite;
    pointer-events: none;
  }
`;

export const BlurredOverlay = styled.div`
  position: relative;
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
`;

export const InvitePromptOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

export const InvitePromptCard = styled.div`
  background: linear-gradient(135deg, #2C1E33, #1a1425);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(to right, rgba(207, 56, 221, 0.9), rgba(211, 148, 245, 0.9), rgba(185, 84, 236, 0.9));
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { background-position: 200% 0; }
    50% { background-position: -200% 0; }
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const InviteTitle = styled.h2`
  color: #fff;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

export const InviteSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

export const InviteButton = styled.button`
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  
  background: ${({ $decline }) =>
    $decline
      ? "linear-gradient(135deg, #e74c3c, #c0392b)"
      : "linear-gradient(to right, rgba(207, 56, 221, 0.9), rgba(211, 148, 245, 0.9), rgba(185, 84, 236, 0.9))"};
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    background: ${({ $decline }) =>
    $decline
      ? "linear-gradient(135deg, #c0392b, #a93226)"
      : "linear-gradient(135deg, #7b3ea1, #5a1675)"};
  }

  &:active {
    transform: translateY(0);
  }
`;

export const ActivityName = styled.span`
  color: #CC31E8;
  font-weight: 600;
`;

export const HostName = styled.span`
  color: #f39c12;
  font-weight: 600;
`;

export const FinalizedMessage = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
  color: ${colors.text};

  h3 {
    color: ${colors.success};
    font-size: 1.6rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
  }

  > p {
    color: ${colors.textSecondary};
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
  }
`;

export const FinalizedContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
`;

export const CountdownContainer = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;

  h4 {
    color: ${colors.primary};
    font-size: 1.1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
  }
`;

export const CountdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 640px) {
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  @media (max-width: 320px) {
    gap: 0.375rem;
  }
`;

export const CountdownCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 1rem 0.5rem;
  text-align: center;
  min-width: 0; /* Prevent overflow */

  @media (max-width: 640px) {
    padding: 0.75rem 0.375rem;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.25rem;
    border-radius: 8px;
  }

  strong {
    display: block;
    font-size: 1.5rem;
    color: ${colors.text};
    font-weight: 700;
    margin-bottom: 0.25rem;
    line-height: 1;
    
    @media (max-width: 640px) {
      font-size: 1.25rem;
    }
    
    @media (max-width: 480px) {
      font-size: 1.1rem;
      margin-bottom: 0.125rem;
    }
    
    @media (max-width: 320px) {
      font-size: 1rem;
    }
  }

  small {
    color: ${colors.primary};
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
    
    @media (max-width: 640px) {
      font-size: 0.75rem;
      letter-spacing: 0.25px;
    }
    
    @media (max-width: 480px) {
      font-size: 0.7rem;
      letter-spacing: 0;
    }
    
    @media (max-width: 320px) {
      font-size: 0.65rem;
    }
  }
`;

export const SelectedRestaurant = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 1.5rem;
  text-align: left;

  h4 {
    color: ${colors.primary};
    font-size: 1.1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
  }

  .restaurant-name {
    color: ${colors.text};
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-family: 'Montserrat', sans-serif;
  }

  .restaurant-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${colors.textSecondary};
    font-size: 0.9rem;
    margin-bottom: 0.5rem;

    svg {
      color: ${colors.primary};
      flex-shrink: 0;
    }
  }

  .restaurant-description {
    color: ${colors.textMuted};
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 1rem 0;
    font-style: italic;
  }
`;

export const RestaurantActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

export const RestaurantButton = styled.a`
  padding: 0.5rem 1rem;
  border: 1px solid ${colors.primary};
  border-radius: 10px;
  color: ${colors.primary};
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  background: rgba(139, 92, 246, 0.1);

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    transform: translateY(-1px);
    color: ${colors.primary};
    text-decoration: none;
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.25);
  }

  svg {
    font-size: 0.75rem;
  }
`;

export const FinalizedButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const FinalizedButton = styled.button`
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 160px;
  
  background: ${({ $primary }) =>
    $primary
      ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`
      : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $primary }) => ($primary ? 'white' : colors.primary)};
  border: ${({ $primary }) => ($primary ? 'none' : `1px solid ${colors.primary}`)};
  
  &:hover { 
    transform: translateY(-3px);
    box-shadow: ${({ $primary }) =>
    $primary
      ? '0 8px 25px rgba(139, 92, 246, 0.4)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)'};
    background: ${({ $primary }) =>
    $primary
      ? `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})`
      : 'rgba(255, 255, 255, 0.1)'};
  }

  &:active {
    transform: translateY(-1px);
  }
`;
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
  padding-top: 20px;
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
