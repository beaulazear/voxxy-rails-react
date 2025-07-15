import styled, { keyframes, css } from 'styled-components';

// Keyframes
export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const progressFill = keyframes`
  0%   { width: 0%; }
  100% { width: var(--progress-width); }
`;

export const progressShine = keyframes`
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

export const progressPulse = keyframes`
  0%,100% { opacity: 0.9; box-shadow: 0 0 20px rgba(207,56,221,0.6); }
  50%     { opacity: 1;   box-shadow: 0 0 30px rgba(207,56,221,1); }
`;

export const gentlePulse = keyframes`
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.02); }
`;

export const subtleGlow = keyframes`
  0%,100% { box-shadow: 0 0 15px rgba(207,56,221,0.4); }
  50%     { box-shadow: 0 0 20px rgba(207,56,221,0.6); }
`;

// Styled Components
export const Container = styled.div`
  background: linear-gradient(135deg, #201925, #2A1E33, #3C2A47);
  min-height: 100vh;
  animation: ${fadeIn} 0.8s ease-in-out;
  padding: 3rem;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
    max-width: 100%;
  }
`;

export const HeroContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  padding-top: 4rem;
  margin: 2rem auto;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 4rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const HeroContent = styled.div`
  flex: 1;
  text-align: left;
`;

export const HeroTitle = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  font-weight: 900;
  color: #fff;
  margin: 0;
  line-height: 1.2;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
`;

export const HeroSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  color: #D8CCE2;
  margin: 0.5rem 0 0;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
`;

export const FilterRow = styled.div`
  display: flex;
  margin: 0 1rem;
  margin-right: -1rem;
  margin-left: -1rem;
  gap: 1rem;
  padding: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
`;

export const FilterButton = styled.button`
  flex-shrink: 0;
  padding: 0.6rem 1.2rem;
  background: ${props => props.$active
    ? 'linear-gradient(135deg, #cf38dd, #d394f5, #b954ec)'
    : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: ${props => props.$active
    ? '2px solid rgba(207, 56, 221, 0.8)'
    : 'none'};
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$active
    ? '0 4px 16px rgba(207, 56, 221, 0.4)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  position: relative;
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  &:hover {
    background: ${props => props.$active
    ? 'linear-gradient(135deg, #bf2aca, #be7fdd, #a744d7)'
    : 'rgba(207, 56, 221, 0.2)'};
    transform: translateY(-1px);
    box-shadow: ${props => props.$active
    ? '0 6px 20px rgba(207, 56, 221, 0.5)'
    : '0 4px 12px rgba(207, 56, 221, 0.3)'};
  }
`;

export const NewBoardButton = styled.button`
  flex-shrink: 0;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #cf38dd, #d394f5);
  color: #fff;
  border: 2px solid rgba(207, 56, 221, 0.6);
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(207, 56, 221, 0.3);
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  &:hover {
    background: linear-gradient(135deg, #bf2aca, #be7fdd);
    border-color: rgba(207, 56, 221, 1);
    box-shadow: 0 6px 20px rgba(207, 56, 221, 0.5);
    transform: translateY(-1px);
  }
`;

export const FilterBadge = styled.span`
  margin-left: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
    padding: 0.1rem 0.3rem;
  }
`;

export const CardsContainer = styled.div`
  padding: 0 1rem 1rem;
  
  @media (max-width: 768px) {
    padding: 0;
  }
`;

export const ActivitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.75rem 1rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.5rem 1rem;
  }
`;

export const ActivityCard = styled.div`
  height: 380px;
  flex-shrink: 0;
  background: linear-gradient(135deg, 
    rgba(42, 30, 46, 0.95), 
    rgba(64, 51, 71, 0.95),
    rgba(207, 56, 221, 0.08)
  );
  border-radius: 24px;
  overflow: hidden;
  border: ${props => props.$isInvite
    ? '2px solid rgba(211, 148, 245, 0.9)'
    : '1px solid rgba(207, 56, 221, 0.5)'};
  box-shadow: ${props => props.$isInvite
    ? '0 12px 24px rgba(211, 148, 245, 0.5), 0 0 25px rgba(211, 148, 245, 0.15)'
    : '0 12px 20px rgba(0, 0, 0, 0.3), 0 0 18px rgba(207, 56, 221, 0.15)'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    height: 320px;
    border-radius: 20px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(207, 56, 221, 0.03), 
      transparent 50%, 
      rgba(185, 84, 236, 0.03)
    );
    border-radius: 24px;
    animation: ${subtleGlow} 6s ease-in-out infinite;
    z-index: 1;
    
    @media (max-width: 768px) {
      border-radius: 20px;
    }
  }
  
  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.$isInvite
    ? 'rgba(185, 84, 236, 1)'
    : 'rgba(207, 56, 221, 0.9)'};
    box-shadow: ${props => props.$isInvite
    ? '0 16px 32px rgba(211, 148, 245, 0.7), 0 0 35px rgba(211, 148, 245, 0.25)'
    : '0 16px 24px rgba(207, 56, 221, 0.5), 0 0 30px rgba(207, 56, 221, 0.2)'};
    
    &::before {
      background: linear-gradient(135deg, 
        rgba(207, 56, 221, 0.06), 
        transparent 50%, 
        rgba(185, 84, 236, 0.06)
      );
    }
  }
  
  ${props => props.$isInvite && css`
    animation: ${gentlePulse} 3s ease-in-out infinite;
    
    &::before {
      background: linear-gradient(135deg, 
        rgba(211, 148, 245, 0.04), 
        transparent 50%, 
        rgba(185, 84, 236, 0.04)
      );
    }
  `}
`;

export const ImageContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
  opacity: ${props => props.$hasOverlay ? '0.2' : '0.35'};
  filter: grayscale(10%) brightness(0.8) contrast(0.9) saturate(1.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(135deg, 
      rgba(207,56,221,0.3), 
      rgba(211,148,245,0.25), 
      rgba(185,84,236,0.3),
      rgba(207,56,221,0.2)
    );
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(45deg, 
      rgba(32,25,37,0.4), 
      transparent 30%, 
      rgba(207,56,221,0.1) 50%,
      transparent 70%,
      rgba(32,25,37,0.4)
    );
    animation: ${subtleGlow} 4s ease-in-out infinite;
  }
  
  ${props => props.$isInvite && css`
    filter: grayscale(5%) brightness(0.9) contrast(1.1) saturate(1.3);
    &::before {
      background: linear-gradient(135deg, 
        rgba(207,56,221,0.4), 
        rgba(211,148,245,0.35), 
        rgba(185,84,236,0.4),
        rgba(211,148,245,0.3)
      );
    }
  `}
  
  ${ActivityCard}:hover & {
    transform: scale(1.02);
    filter: grayscale(5%) brightness(0.9) contrast(1.0) saturate(1.2);
  }
`;

export const CreateCard = styled.div`
  height: 380px;
  flex-shrink: 0;
  background: linear-gradient(135deg, 
    rgba(42, 30, 46, 0.95), 
    rgba(64, 51, 71, 0.95),
    rgba(207, 56, 221, 0.05)
  );
  border-radius: 24px;
  overflow: hidden;
  border: ${props => props.$isInvitesEmpty
    ? '2px dashed rgba(211, 148, 245, 0.6)'
    : '2px dashed rgba(78, 205, 196, 0.6)'};
  box-shadow: ${props => props.$isInvitesEmpty
    ? '0 12px 20px rgba(211, 148, 245, 0.3)'
    : '0 12px 20px rgba(78, 205, 196, 0.3)'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
  
  @media (max-width: 768px) {
    height: 320px;
    border-radius: 20px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(207, 56, 221, 0.02), 
      transparent 50%, 
      rgba(185, 84, 236, 0.02)
    );
    border-radius: 24px;
    animation: ${subtleGlow} 6s ease-in-out infinite;
    z-index: 1;
    
    @media (max-width: 768px) {
      border-radius: 20px;
    }
  }
  
  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.$isInvitesEmpty
    ? 'rgba(211, 148, 245, 1)'
    : 'rgba(78, 205, 196, 1)'};
    box-shadow: ${props => props.$isInvitesEmpty
    ? '0 16px 32px rgba(211, 148, 245, 0.5)'
    : '0 16px 32px rgba(78, 205, 196, 0.5)'};
    
    &::before {
      background: linear-gradient(135deg, 
        rgba(207, 56, 221, 0.05), 
        transparent 50%, 
        rgba(185, 84, 236, 0.05)
      );
    }
  }
`;

export const CreateImageContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: ${props => props.$isInvitesEmpty
    ? 'linear-gradient(135deg, #D394F5, #B954EC)'
    : 'linear-gradient(135deg, #4ECDC4, #44A08D)'};
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
  opacity: 0.15;
  filter: brightness(0.8) contrast(0.9) saturate(1.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: ${props => props.$isInvitesEmpty
    ? 'linear-gradient(135deg, rgba(211,148,245,0.4), rgba(185,84,236,0.3))'
    : 'linear-gradient(135deg, rgba(78,205,196,0.4), rgba(68,160,141,0.3))'};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(45deg, 
      rgba(32,25,37,0.3), 
      transparent 30%, 
      ${props => props.$isInvitesEmpty ? 'rgba(211,148,245,0.1)' : 'rgba(78,205,196,0.1)'} 50%,
      transparent 70%,
      rgba(32,25,37,0.3)
    );
    animation: ${subtleGlow} 4s ease-in-out infinite;
  }
  
  ${CreateCard}:hover & {
    transform: scale(1.02);
    filter: brightness(0.9) contrast(1.0) saturate(1.2);
  }
`;

export const CreateTypeTag = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: ${props => props.$isInvitesEmpty
    ? 'rgba(211, 148, 245, 0.98)'
    : 'rgba(78, 205, 196, 0.98)'};
  padding: 8px 12px;
  border-radius: 18px;
  z-index: 10;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: ${props => props.$isInvitesEmpty
    ? '0 6px 14px rgba(211, 148, 245, 0.7)'
    : '0 6px 14px rgba(78, 205, 196, 0.7)'};
  backdrop-filter: blur(4px);
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    border-radius: 14px;
    top: 10px;
    right: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  span {
    color: #fff;
    font-size: 12px;
    font-weight: 900;
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.4px;
    
    @media (max-width: 768px) {
      font-size: 10px;
      letter-spacing: 0.2px;
    }
  }
`;

export const CreateCardContent = styled.div`
  flex: 1;
  margin-top: 50px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  gap: 12px;
  z-index: 2;
  text-align: center;
  
  @media (max-width: 768px) {
    margin-top: 40px;
    padding: 12px;
    gap: 8px;
  }
`;

export const CreateIconContainer = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: ${props => props.$isInvitesEmpty
    ? 'rgba(211, 148, 245, 0.15)'
    : 'rgba(78, 205, 196, 0.15)'};
  border: 3px solid ${props => props.$isInvitesEmpty
    ? 'rgba(211, 148, 245, 0.4)'
    : 'rgba(78, 205, 196, 0.4)'};
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: ${props => props.$isInvitesEmpty
    ? '0 8px 16px rgba(211, 148, 245, 0.4)'
    : '0 8px 16px rgba(78, 205, 196, 0.4)'};
    
  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: 2px solid ${props => props.$isInvitesEmpty
    ? 'rgba(211, 148, 245, 0.4)'
    : 'rgba(78, 205, 196, 0.4)'};
  }
`;

export const CreateTitle = styled.h3`
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  text-align: center;
  line-height: 1.3;
  margin: 0;
  text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const CreateSubtitle = styled.p`
  color: #B8A5C4;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
  margin: 0;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7);
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const CreateSuggestions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const SuggestionIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    border-radius: 14px;
  }
`;

export const CreateArrow = styled.div`
  margin-top: auto;
  padding: 10px 20px;
  background: ${props => props.$isInvitesEmpty
    ? 'rgba(211, 148, 245, 0.25)'
    : 'rgba(78, 205, 196, 0.25)'};
  border-radius: 16px;
  border: 2px solid ${props => props.$isInvitesEmpty
    ? 'rgba(211, 148, 245, 0.6)'
    : 'rgba(78, 205, 196, 0.6)'};
    
  @media (max-width: 768px) {
    padding: 8px 16px;
    border-radius: 12px;
  }
  
  span {
    color: #fff;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.6px;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
    
    @media (max-width: 768px) {
      font-size: 11px;
      letter-spacing: 0.4px;
    }
  }
`;

export const CreateCardFooter = styled.div`
  padding: 16px 20px;
  background: rgba(10, 8, 12, 0.95);
  border-top: 1px solid rgba(64, 51, 71, 0.4);
  z-index: 2;
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

export const CreateFooterText = styled.div`
  color: #D8CCE2;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 11px;
    letter-spacing: 0.3px;
  }
`;

export const InvitesEmptyIcon = styled.div`
  font-size: 32px;
`;

export const HostTag = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(185, 84, 236, 0.98);
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 18px;
  z-index: 10;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 12px rgba(185, 84, 236, 0.6);
  gap: 4px;
  backdrop-filter: blur(4px);
  
  @media (max-width: 768px) {
    padding: 5px 8px;
    border-radius: 14px;
    top: 10px;
    left: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    gap: 3px;
  }
  
  span {
    color: #fff;
    font-size: 11px;
    font-weight: 900;
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.4px;
    
    @media (max-width: 768px) {
      font-size: 9px;
      letter-spacing: 0.2px;
    }
  }
`;

export const TypeTag = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: ${props => props.$isInvite
    ? 'rgba(211, 148, 245, 0.98)'
    : 'rgba(207, 56, 221, 0.98)'};
  padding: 8px 10px;
  border-radius: 18px;
  z-index: 10;
  border: 2px solid ${props => props.$isInvite
    ? 'rgba(255, 255, 255, 0.4)'
    : 'rgba(255, 255, 255, 0.3)'};
  box-shadow: ${props => props.$isInvite
    ? '0 6px 14px rgba(211, 148, 245, 0.7)'
    : '0 6px 12px rgba(207, 56, 221, 0.6)'};
  backdrop-filter: blur(4px);
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    border-radius: 14px;
    top: 10px;
    right: 10px;
    border: 1px solid ${props => props.$isInvite
    ? 'rgba(255, 255, 255, 0.4)'
    : 'rgba(255, 255, 255, 0.3)'};
  }
  
  span {
    color: #fff;
    font-size: 12px;
    font-weight: 900;
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.4px;
    
    @media (max-width: 768px) {
      font-size: 10px;
      letter-spacing: 0.2px;
    }
  }
`;

export const CardContent = styled.div`
  flex: 1;
  margin-top: 50px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    margin-top: 40px;
  }
`;

export const ProgressOverlay = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(42, 30, 46, 0.95);
  margin: 16px 20px;
  border-radius: 20px;
  border: 1px solid rgba(207, 56, 221, 0.3);
  padding: 24px;
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    margin: 12px 16px;
    padding: 16px;
    border-radius: 16px;
  }
`;

export const ProgressStage = styled.div`
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 14px;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }
`;

export const ProgressBarContainer = styled.div`
  width: 100%;
  height: 16px;
  background: rgba(64, 51, 71, 0.8);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

export const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #cf38dd, #d394f5);
  border-radius: 8px;
  box-shadow: 0 0 12px rgba(207, 56, 221, 0.8);
  width: ${props => props.$progress}%;
  transition: width 0.8s ease;
  animation: ${progressFill} 2s ease-out;
  --progress-width: ${props => props.$progress}%;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: ${progressShine} 2s ease-in-out infinite;
  }
  
  ${props => props.$progress === 100 && css`
    animation: ${progressFill} 2s ease-out, ${progressPulse} 3s ease-in-out infinite 2s;
  `}
`;

export const CountdownContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(42, 30, 46, 0.95);
  margin: 16px 20px;
  border-radius: 20px;
  border: 1px solid rgba(207, 56, 221, 0.3);
  padding: 24px;
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    margin: 12px 16px;
    padding: 16px;
    border-radius: 16px;
  }
`;

export const CountdownLabel = styled.div`
  color: #d394f5;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 11px;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }
`;

export const CountdownGrid = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const CountdownBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 45px;
  
  @media (max-width: 768px) {
    min-width: 36px;
  }
`;

export const CountdownNumber = styled.span`
  color: #fff;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.2;
  text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

export const CountdownUnit = styled.span`
  color: #d8cce2;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 4px;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  
  @media (max-width: 768px) {
    font-size: 9px;
    letter-spacing: 0.5px;
  }
`;

export const InviteContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: rgba(42, 30, 46, 0.95);
  margin: 16px 20px 8px 20px;
  border-radius: 20px;
  border: 2px solid rgba(211, 148, 245, 0.4);
  padding: 20px 20px 16px 20px;
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    margin: 12px 16px 8px 16px;
    padding: 16px 16px 12px 16px;
    border-radius: 16px;
  }
`;

export const InviteContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const InviteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const InviteLabel = styled.span`
  color: #d394f5;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  text-align: center;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 12px;
    letter-spacing: 0.8px;
  }
`;

export const FunMessage = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7);
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

export const AddParticipantButton = styled.div`
  padding: 10px 20px;
  background: rgba(211, 148, 245, 0.2);
  border: 2px solid rgba(211, 148, 245, 0.5);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 8px 16px;
    border-radius: 12px;
  }
  
  &:hover {
    background: rgba(211, 148, 245, 0.3);
    border-color: rgba(211, 148, 245, 0.8);
    transform: translateY(-2px);
  }
  
  span {
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
    
    @media (max-width: 768px) {
      font-size: 11px;
      letter-spacing: 0.4px;
    }
  }
`;

export const CompletedContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(42, 30, 46, 0.95);
  margin: 16px 20px;
  border-radius: 20px;
  border: 1px solid rgba(100, 100, 100, 0.3);
  padding: 28px;
  gap: 16px;
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    margin: 12px 16px;
    padding: 20px;
    gap: 12px;
    border-radius: 16px;
  }
`;

export const CompletedLabel = styled.span`
  color: #aaa;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  text-align: center;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  
  @media (max-width: 768px) {
    font-size: 10px;
    letter-spacing: 0.8px;
  }
`;

export const CompletedMessage = styled.div`
  color: #d8cce2;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7);
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const CardFooter = styled.div`
  padding: 20px 24px;
  background: linear-gradient(135deg, 
    rgba(207, 56, 221, 0.85), 
    rgba(185, 84, 236, 0.9),
    rgba(211, 148, 245, 0.85)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

export const CardTitle = styled.h3`
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  margin: 0 0 16px 0;
  line-height: 1.3;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin: 0 0 12px 0;
  }
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 20px;
  
  @media (max-width: 768px) {
    margin-bottom: 12px;
    gap: 16px;
  }
`;

export const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    gap: 6px;
  }
  
  span {
    color: rgba(255, 255, 255, 0.95);
    font-size: 13px;
    font-weight: 600;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
    
    @media (max-width: 768px) {
      font-size: 11px;
    }
  }
`;

export const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
`;

export const ViewLink = styled.div`
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
  
  &:hover {
    color: rgba(255, 255, 255, 0.8);
    transform: translateX(2px);
  }
`;

export const PartCount = styled.div`
  display: flex;
  align-items: center;
  
  span {
    color: rgba(255, 255, 255, 0.95);
    font-size: 13px;
    font-weight: 600;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
    
    @media (max-width: 768px) {
      font-size: 11px;
    }
  }
`;

export const NoActivitiesMessage = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #D8CCE2;
  font-size: 1.1rem;
  
  h3 {
    color: #fff;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  
  p {
    margin-bottom: 2rem;
    line-height: 1.6;
  }
`;