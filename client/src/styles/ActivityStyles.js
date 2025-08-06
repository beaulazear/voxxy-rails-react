// styles/ActivityStyles.js
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

// Main Container
export const Container = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  color: #fff;
  padding-top: 2rem;
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
`;

// Phase Indicator Components
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
`;

export const PhaseIcon = styled.div`
  color: #cc31e8;
`;

export const PhaseContent = styled.div`
  flex: 1;
  text-align: left;
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

// Progress Bar Components
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

// Preferences Card Components
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

// Submitted Card Components
export const SubmittedCard = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
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
`;

export const SubmittedText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #ccc;
  line-height: 1.5;
  text-align: left;
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

// Organizer Section Components
export const OrganizerSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

export const OrganizerTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
`;

export const ParticipantsList = styled.div`
  margin-bottom: 1.5rem;
`;

export const ParticipantItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

export const ParticipantName = styled.span`
  font-size: 0.9rem;
  ${({ $isGuest }) => $isGuest && `
    font-style: italic;
    opacity: 0.9;
  `}
`;

export const ParticipantStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${({ $submitted }) => $submitted ? '#28a745' : '#ffc107'};
`;

// Warning and Error Components
export const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  color: #ffc107;
  font-size: 0.85rem;
  margin: 1rem 0;
`;

export const ErrorText = styled.p`
  color: #d9534f;
  text-align: center;
  font-style: italic;
  margin-bottom: 1rem;
`;

// Availability Components
export const AvailabilitySection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

export const AvailabilityTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const AvailabilityGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

export const DateCard = styled.div`
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
`;

export const DateHeader = styled.div`
  font-weight: 600;
  color: #cc31e8;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

export const TimeSlots = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

export const TimeSlot = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  color: #ccc;
`;

export const ParticipantAvailability = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  border-left: 3px solid #cc31e8;
`;

export const ParticipantNameAvailability = styled.div`
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

export const OverlapAnalysis = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
  border-radius: 0.75rem;
`;

export const OverlapTitle = styled.h4`
  color: #28a745;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const TimeOverlapItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

export const TimeText = styled.span`
  color: #fff;
`;

export const AvailabilityBadge = styled.span`
  color: ${({ $percentage }) => $percentage >= 70 ? '#28a745' : $percentage >= 50 ? '#ffc107' : '#dc3545'};
  font-size: 0.8rem;
  font-weight: 600;
`;

// Recommendations List Components
export const RecommendationsList = styled.ul`
  list-style: none;
  padding: 0;
`;

export const ListItem = styled.li`
  position: relative;
  background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected }) => $selected ? '1px solid #28a745' : '1px solid rgba(255, 255, 255, 0.1)'};
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const SelectedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
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

export const ContentWrapper = styled.div``;

export const ListTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ListName = styled.span`
  font-weight: 600;
  text-align: left;
`;

export const ListMeta = styled.span`
  font-size: 0.875rem;
  color: #ccc;
`;

export const ListBottom = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const LikeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: ${(props) => (props.$liked ? "#e25555" : "#ccc")};
  cursor: pointer;
  font-size: 0.875rem;
  & svg {
    fill: ${(props) => (props.$liked ? "#e25555" : "none")};
  }
`;

export const VoteCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ccc;
  font-size: 0.875rem;
`;

// Modal Components
export const DimOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 997;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 1rem;
`;

export const ModalContainer = styled.div`
  background: linear-gradient(135deg, #3A2D44 0%, #2C1E33 100%);
  padding: 0;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 70px rgba(102, 126, 234, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(102, 126, 234, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px 24px 0 0;
  }
  
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

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #cc31e8;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #ccc;
`;

export const DetailLabel = styled.span`
  font-weight: 600;
  color: #fff;
`;

export const DetailValue = styled.span`
  color: #ccc;
`;

export const PhotoGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

export const Photo = styled.img`
  width: 100%;
  height: 120px;
  border-radius: 0.75rem;
  object-fit: cover;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

export const Description = styled.p`
  color: #ccc;
  line-height: 1.5;
  margin: 0;
  text-align: left;
`;

export const Reason = styled.div`
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-top: 1rem;
  text-align: left;
`;

export const ReasonTitle = styled.div`
  color: #cc31e8;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
`;

export const ReasonText = styled.p`
  color: #ccc;
  margin: 0;
  line-height: 1.4;
  font-size: 0.85rem;
`;

export const WebsiteLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #cc31e8;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.85rem;
  margin-top: 1rem;
  padding: 0.6rem 1rem;
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(204, 49, 232, 0.2);
    transform: translateY(-1px);
  }
`;

export const GoogleMapContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  margin-top: 1rem;
  
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

export const MapLoadingContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

export const MapLoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid rgba(204, 49, 232, 0.3);
  border-top: 3px solid #cc31e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const MapLoadingText = styled.div`
  color: #ccc;
  font-size: 0.85rem;
  text-align: center;
`;

// Button Components
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

export const FullWidthButton = styled.button`
  width: 100%;
  background: ${({ $primary }) => ($primary ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'transparent')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid rgba(204, 49, 232, 0.3)')};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    ${({ $primary }) =>
        $primary
            ? `background: linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(204, 49, 232, 0.3);`
            : `background: rgba(204, 49, 232, 0.1); color: #cc31e8; transform: translateY(-1px);`}
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Modal Progress Components
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

// Reviews Components
export const ReviewsContainer = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
`;

export const ReviewItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
`;

export const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

export const ReviewAuthor = styled.div`
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
`;

export const ReviewRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ffd700;
  font-size: 0.85rem;
`;

export const ReviewText = styled.p`
  color: #ccc;
  margin: 0;
  line-height: 1.4;
  font-size: 0.85rem;
`;