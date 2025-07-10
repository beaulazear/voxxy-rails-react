import styled, { keyframes } from 'styled-components';

export const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
`;

export const fadeInNoTransform = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

export const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const pulse = keyframes`
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.03); }
`;

export const Container = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  padding-top: 1rem;
  color: #fff;
  animation: ${fadeInNoTransform} 0.8s ease-in-out,
             ${gradientAnimation} 15s ease infinite;
`;

export const TopBar = styled.div`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  display: flex;
`;

export const Heading = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  margin: 0 auto;
  text-align: center;
  
  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

export const PhaseIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    text-align: center;
  }
`;

export const PhaseIndicatorButton = styled.button`
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  color: #fff;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  margin-left: auto;
  white-space: nowrap;
  
  &:hover {
    background: linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(204, 49, 232, 0.3);
  }
  
  @media (max-width: 640px) {
    margin-left: 0;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
`;

export const PhaseIcon = styled.div`
  color: #cc31e8;
  
  @media (max-width: 640px) {
    align-self: center;
  }
`;

export const PhaseContent = styled.div`
  flex: 1;
  text-align: left;
  
  @media (max-width: 640px) {
    text-align: center;
  }
`;

export const PhaseTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

export const PhaseSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #ccc;
`;

export const ProgressBarContainer = styled.div`
  background: #333;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

export const ProgressBar = styled.div`
  height: 100%;
  background: #cc31e8;
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

export const PreferencesCard = styled.div`
  background: linear-gradient(135deg, #9051e1 0%, #cc31e8 100%);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`;

export const PreferencesIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

export const PreferencesTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
`;

export const PreferencesText = styled.p`
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
  line-height: 1.5;
`;

export const PreferencesButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 auto;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

export const SubmittedCard = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  text-align: center;
`;

export const SubmittedIcon = styled.div`
  color: #28a745;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

export const SubmittedTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  color: #28a745;
  font-weight: 600;
`;

export const SubmittedText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #ccc;
  line-height: 1.5;
  font-size: 0.9rem;
`;

export const ResubmitButton = styled.button`
  background: transparent;
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 auto;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(40, 167, 69, 0.1);
    transform: translateY(-1px);
  }
`;

export const ErrorText = styled.p`
  color: #d9534f;
  text-align: center;
  font-style: italic;
  margin-bottom: 1rem;
`;

// AI Recommendations Styles
export const AISection = styled.div`
  background: linear-gradient(135deg, rgba(204, 49, 232, 0.1) 0%, rgba(144, 81, 225, 0.1) 100%);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

export const AITitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: #cc31e8;
  font-family: 'Montserrat', sans-serif;
  text-align: left;
`;

export const RecommendationCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  text-align: left;
  transition: all 0.2s ease;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(204, 49, 232, 0.3);
    transform: translateY(-1px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const RecommendationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  gap: 1rem;
`;

export const RecommendationTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  flex: 1;
`;

export const ParticipantCount = styled.div`
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid rgba(40, 167, 69, 0.3);
`;

export const RecommendationReason = styled.p`
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #ccc;
  line-height: 1.4;
  text-align: left;
  flex: 1;
`;

export const ProsCons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

export const ProsConsSection = styled.div`
  text-align: left;
`;

export const ProsConsTitle = styled.h5`
  margin: 0 0 0.5rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $type }) => $type === 'pros' ? '#28a745' : '#ffc107'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
`;

export const ProsConsList = styled.ul`
  margin: 0;
  padding-left: 1rem;
  font-size: 0.8rem;
  color: #ccc;
  line-height: 1.3;
`;

export const ProsConsItem = styled.li`
  margin-bottom: 0.25rem;
  text-align: left;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const TimeSlotsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

export const TimeSlotCard = styled.div`
  background: ${({ $selected, $recommended }) =>
        $selected ? 'rgba(40, 167, 69, 0.2)' :
            $recommended ? 'rgba(204, 49, 232, 0.15)' :
                'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected, $recommended }) =>
        $selected ? '1px solid #28a745' :
            $recommended ? '1px solid #cc31e8' :
                '1px solid rgba(255, 255, 255, 0.1)'};
  padding: 1rem;
  border-radius: 0.75rem;
  position: relative;
  transition: all 0.2s ease;
  margin-top: ${({ $recommended }) => $recommended ? '0' : '0'};
  
  &:hover {
    background: ${({ $selected, $recommended }) =>
        $selected ? 'rgba(40, 167, 69, 0.3)' :
            $recommended ? 'rgba(204, 49, 232, 0.2)' :
                'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const SelectedBadge = styled.div`
  position: absolute;
  right: 0.5rem;
  background: #28a745;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const RecommendedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  color: #fff;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 8px rgba(204, 49, 232, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 2;
  animation: ${pulse} 2s ease-in-out infinite;
`;

export const TimeSlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  position: relative;
`;

export const TimeSlotDate = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: #fff;
`;

export const TimeSlotTime = styled.div`
  font-size: 0.9rem;
  color: #ccc;
  margin-top: 0.25rem;
`;

export const TimeSlotActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const TimeSlotStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const StatRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
`;

export const StatLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #ccc;
`;

export const StatValue = styled.div`
  color: ${({ $type }) =>
        $type === 'availability' ? '#28a745' : '#fff'};
  font-weight: 500;
`;

export const AvailabilityCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #28a745;
  font-size: 0.875rem;
`;

export const DeleteButton = styled.button`
  background: rgba(220, 38, 127, 0.2);
  border: 1px solid rgba(220, 38, 127, 0.3);
  color: #dc267f;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(220, 38, 127, 0.3);
    transform: scale(1.05);
  }
`;

// Modal Styles matching AIRecommendations
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 1rem;
`;

export const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cc31e8;
    border-radius: 2px;
  }
`;

export const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

export const ModalTitle = styled.h2`
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
`;

export const ModalSubtitle = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

export const ModalBody = styled.div`
  padding: 1.5rem 2rem 2rem 2rem;
`;

export const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const ModalProgressContainer = styled.div`
  margin: 1rem 0;
`;

export const ModalProgressBarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

export const ModalProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

export const ProgressInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ccc;
  font-size: 0.85rem;
`;

export const ProgressLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ProgressPercentage = styled.div`
  color: #cc31e8;
  font-weight: 600;
`;

export const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  color: #ffc107;
  font-size: 0.85rem;
  margin: 1rem 0;
`;

export const Button = styled.button`
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  
  background: ${({ $primary }) =>
        $primary
            ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
            : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $primary }) => ($primary ? 'white' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid rgba(204, 49, 232, 0.3)')};
  
  &:hover:not(:disabled) { 
    transform: translateY(-1px);
    box-shadow: ${({ $primary }) =>
        $primary
            ? '0 4px 12px rgba(204, 49, 232, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)'};
    background: ${({ $primary }) =>
        $primary
            ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
            : 'rgba(255, 255, 255, 0.08)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;