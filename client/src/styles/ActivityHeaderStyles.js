import styled, { keyframes, css } from "styled-components";

export const colors = {
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  secondary: '#06b6d4',
  accent: '#f59e0b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  borderLight: '#475569',
};

export const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
`;

export const HeaderContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0.5rem;
  
  @media (min-width: 768px) {
    padding: 1rem;
  }
`;

export const TopActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 0.5rem;
  
  @media (min-width: 768px) {
    margin-bottom: 2rem;
    gap: 1rem;
  }

  > * {
    flex: 1;
  }

  > *:nth-child(2) {
    display: flex;
    justify-content: center;
  }

  > *:last-child {
    display: flex;
    justify-content: flex-end;
  }
`;

export const TitleSection = styled.div`
  text-align: center;
  position: relative;
`;

export const LeftActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
  }
`;

export const RightActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
  }
`;

export const ActionButton = styled.button`
  background: ${props =>
    props.$primary ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})` :
      props.$edit ? `rgba(139, 92, 246, 0.1)` :
        props.$delete ? `rgba(239, 68, 68, 0.1)` :
          `rgba(255, 255, 255, 0.05)`
  };
  border: 1px solid ${props =>
    props.$primary ? colors.primary :
      props.$edit ? colors.primary :
        props.$delete ? colors.error :
          colors.border
  };
  color: ${props =>
    props.$edit ? colors.primary :
      props.$delete ? colors.error :
        colors.text
  };
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;

  @media (min-width: 768px) {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    font-size: 1.25rem;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.25);
    background: ${props =>
    props.$primary ? `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})` :
      props.$edit ? `rgba(139, 92, 246, 0.2)` :
        props.$delete ? `rgba(239, 68, 68, 0.2)` :
          `rgba(255, 255, 255, 0.1)`
  };
  }

  &:active {
    transform: translateY(-1px);
  }
`;

export const HelpButton = styled(ActionButton)`
  position: relative;
  
  ${props => props.$bounce && css`
    animation: ${bounceAnimation} 2s ease-in-out infinite;
  `}

  &:hover .help-tooltip {
    opacity: 1;
    transform: translateY(-10px);
  }
`;

export const HelpTooltip = styled.div`
  position: absolute;
  top: 100%;
  left: 0; /* Simple left alignment - no centering math */
  margin-top: 5px;
  background: ${colors.surface};
  color: ${colors.text};
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  
  /* Conservative size that always fits */
  max-width: 120px;
  width: max-content;
  white-space: normal;
  text-align: center;
  word-wrap: break-word;
  
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  border: 1px solid ${colors.border};
  z-index: 100;
  
  /* Simple arrow - no centering */
  &::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 12px;
    border: 4px solid transparent;
    border-bottom-color: ${colors.surface};
  }
`;

export const ActivityTypeChip = styled.div`
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  backdrop-filter: blur(8px);
  padding: 0.5rem 1rem;
  flex-shrink: 0;
  
  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
  }
`;

export const ActivityTypeText = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: ${colors.text};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  
  @media (min-width: 768px) {
    font-size: 0.9rem;
  }
`;

export const LeaveButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${colors.error};
  color: ${colors.error};
  padding: 0.4rem 0.75rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 88px;
  height: 40px;

  @media (min-width: 768px) {
    padding: 0.5rem 1rem;
    border-radius: 12px;
    gap: 0.5rem;
    font-size: 0.9rem;
    min-width: 120px;
    height: 48px;
  }

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: translateY(-2px);
  }
`;

export const LeaveButtonText = styled.span`
  display: none;
  
  @media (min-width: 375px) {
    display: inline;
  }
`;

export const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    gap: 2rem;
  }
`;

export const ActivityTitle = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 700;
  color: ${colors.text};
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, ${colors.text}, ${colors.primaryLight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (min-width: 768px) {
    margin: 0 0 1.5rem 0;
  }
`;

export const DateTimeRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (min-width: 768px) {
    gap: 2rem;
  }
`;

export const DateTimeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${colors.textSecondary};
  font-size: 0.9rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid ${colors.border};

  @media (min-width: 768px) {
    gap: 0.75rem;
    font-size: 1.1rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
  }

  svg {
    color: ${colors.primary};
    flex-shrink: 0;
  }
`;

export const HostSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  backdrop-filter: blur(8px);
  
  @media (min-width: 768px) {
    gap: 1.25rem;
    border-radius: 20px;
  }
`;

export const HostAvatar = styled.div`
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
`;

export const HostImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${colors.primary};
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.4);
  
  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
  }
`;

export const HostBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};
  animation: ${glow} 2s ease-in-out infinite;

  @media (min-width: 768px) {
    width: 28px;
    height: 28px;
  }

  svg {
    color: white;
  }
`;

export const HostInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const HostName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  span {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    color: ${colors.text};
    font-size: 1rem;
    
    @media (min-width: 768px) {
      font-size: 1.2rem;
    }
  }

  svg {
    color: #e91e63;
    animation: ${glow} 3s ease-in-out infinite;
    flex-shrink: 0;
  }
`;

export const WelcomeMessage = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${colors.textSecondary};
  margin: 0;
  line-height: 1.6;
  font-style: italic;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const ParticipantsSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1.5rem;
    border-radius: 20px;
  }
`;

export const ParticipantsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.75rem;
  flex-wrap: wrap;
  
  @media (min-width: 768px) {
    align-items: center;
    margin-bottom: 1.25rem;
    gap: 1rem;
  }
`;

export const ParticipantsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: ${colors.text};
  font-size: 1rem;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
    font-size: 1.2rem;
  }

  svg {
    color: ${colors.primary};
    flex-shrink: 0;
  }
`;

export const ParticipantsTitleText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ResponseBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: ${colors.success};
  padding: 0.375rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (min-width: 768px) {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
`;

export const ParticipantsGrid = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow: visible;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;

  @media (min-width: 768px) {
    gap: 0.75rem;
  }

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }
`;

export const InviteButton = styled.button`
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border: 2px dashed rgba(255, 255, 255, 0.5);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 0.125rem;

  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
    gap: 0.25rem;
  }

  svg {
    width: 24px;
    height: 24px;
    
    @media (min-width: 768px) {
      width: 28px;
      height: 28px;
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
    border-style: solid;
  }
`;

export const InviteButtonText = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  
  @media (min-width: 768px) {
    font-size: 0.7rem;
  }
`;

export const ViewAllButton = styled(InviteButton)`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
  }
`;

export const ViewAllButtonText = styled(InviteButtonText)``;

export const ParticipantAvatar = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: ${props =>
    props.$isHost ? `3px solid ${colors.primary}` :
      props.$guestResponded ? `2px solid ${colors.success}` :
        props.$pending ? `2px dashed ${colors.textMuted}` :
          `2px solid ${colors.border}`
  };
  opacity: ${props => props.$pending && !props.$guestResponded ? 0.6 : 1};
  transition: all 0.3s ease;

  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
  }
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #fff;
  border-radius: 50%;
`;

export const HostIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};
  animation: ${glow} 2s ease-in-out infinite;

  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
  }

  svg {
    color: white;
  }
`;

export const ResponseIndicator = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  background: ${colors.success};
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};

  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
    top: 3px;
    right: 3px;
  }

  svg {
    color: white;
  }
`;

export const ParticipantsScrollContainer = styled.div`
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }
`;

export const PendingIndicator = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  background: ${colors.warning};
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};

  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
    top: 3px;
    right: 3px;
  }

  svg {
    color: white;
  }
`;

export const HelpOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
`;

export const HelpPopup = styled.div`
  background: ${colors.surface};
  border-radius: 16px;
  border: 1px solid ${colors.border};
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  text-align: left;
  
  @media (min-width: 768px) {
    border-radius: 20px;
  }
`;

export const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

export const PopupTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${colors.text};
  font-family: 'Montserrat', sans-serif;
  
  @media (min-width: 768px) {
    font-size: 1.2rem;
  }
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.textMuted};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: ${colors.text};
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const StepContainer = styled.div`
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

export const StepTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 0.75rem;
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

export const StepDesc = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${colors.textSecondary};
  margin-bottom: 1.5rem;
  
  @media (min-width: 768px) {
    font-size: 0.95rem;
  }
`;

export const NavControls = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

export const NavButton = styled.button`
  background: ${colors.primary};
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
  }

  &:disabled {
    background: ${colors.textMuted};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${colors.primaryDark};
    transform: translateY(-1px);
  }
`;

export const AllParticipantsOverlay = styled(HelpOverlay)``;

export const AllParticipantsContent = styled(HelpPopup)`
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
`;

export const ProgressContainer = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

export const MessageLine = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${colors.textSecondary};
  margin: 0 0 0.75rem 0;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const ProgressBarBackground = styled.div`
  width: 100%;
  background: ${colors.border};
  border-radius: 8px;
  height: 8px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 8px;
  transition: width 0.3s ease;
  background-size: 200% 100%;
  animation: ${shimmer} 2s linear infinite;
`;

export const AllList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  text-align: left;
  
  @media (min-width: 768px) {
    padding: 1rem;
  }
`;

export const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
  border-radius: 10px;
  margin-bottom: 0.75rem;
  border: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1rem;
    border-radius: 12px;
  }
`;

export const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  
  @media (min-width: 768px) {
    gap: 1rem;
  }
`;

export const ParticipantCircle = styled.div`
  position: relative;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  flex-shrink: 0;
  
  @media (min-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

export const ParticipantImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

export const HostIndicatorLarge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};

  @media (min-width: 768px) {
    width: 18px;
    height: 18px;
  }

  svg {
    color: white;
  }
`;

export const Details = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ParticipantName = styled.div`
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  
  @media (min-width: 768px) {
    gap: 0.5rem;
  }
`;

export const StatusText = styled.span`
  font-size: 0.75rem;
  color: ${colors.textMuted};
  
  @media (min-width: 768px) {
    font-size: 0.8rem;
  }
`;

export const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.error};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
`;

export const InviteOverlay = styled(HelpOverlay)``;

export const InviteContent = styled(HelpPopup)`
  max-width: 500px;
`;

export const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem;
  margin-bottom: 1rem;
  margin-top: 1rem;
  
  @media (min-width: 768px) {
    padding: 0 1.5rem;
  }
`;

export const EmailInput = styled.input`
  flex: 1;
  padding: 0.625rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: ${colors.text};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
  }

  &::placeholder {
    color: ${colors.textMuted};
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.1);
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

export const AddEmailButton = styled.button`
  background: ${colors.primary};
  border: none;
  color: white;
  padding: 0.625rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (min-width: 768px) {
    padding: 0.75rem;
    border-radius: 12px;
  }

  &:hover {
    background: ${colors.primaryDark};
  }
`;

export const EmailsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 1.5rem 1rem;
  }
`;

export const EmailPill = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(139, 92, 246, 0.1);
  color: ${colors.primary};
  padding: 0.375rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  
  @media (min-width: 768px) {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
`;

export const PillClose = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${colors.error};
  }
`;

export const InviteActions = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    gap: 1rem;
    padding: 1.5rem;
  }
`;

export const CancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  background: transparent;
  color: ${colors.textMuted};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${colors.text};
  }
`;