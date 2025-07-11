import styled from 'styled-components';

// Main container for unified cards
export const UnifiedCardsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

// Unified card component for both recommendations and time slots
export const UnifiedCard = styled.div`
  background: ${props => props.$isRecommendation ?
        'linear-gradient(135deg, rgba(204, 49, 232, 0.1) 0%, rgba(139, 69, 255, 0.05) 100%)' :
        'rgba(255, 255, 255, 0.05)'};
  border: ${props => props.$isRecommendation ?
        '1.5px solid rgba(204, 49, 232, 0.3)' :
        props.$selected ? '1.5px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  padding: 1rem 1.25rem;
  transition: all 0.2s ease;
  position: relative;
  width: 100%;
  max-width: none;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    border-color: ${props => props.$isRecommendation ?
        'rgba(204, 49, 232, 0.5)' :
        props.$selected ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

// Badge for recommendations and selected items - NOW IN BOTTOM-RIGHT
export const CardBadge = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: ${props => props.$type === 'recommendation' ?
        'linear-gradient(135deg, #cc31e8 0%, #8b45ff 100%)' :
        '#22c55e'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
`;

// Header section of each card
export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
  text-align: left;
`;

// Main content area of the card
export const CardContent = styled.div`
  flex: 1;
`;

// Title for recommendations
export const CardTitle = styled.h3`
  color: ${props => props.$isRecommendation ? '#cc31e8' : '#ffffff'};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  font-family: 'Montserrat', sans-serif;
`;

// Date and time subtitle
export const CardSubtitle = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Statistics section at bottom of card
export const CardStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

// Individual stat item
export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
`;

// Highlighted stat number
export const StatNumber = styled.span`
  color: #ffffff;
  font-weight: 600;
`;

// Loading section for AI recommendations
export const LoadingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.8);
  
  h3 {
    color: #cc31e8;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
  }
`;

// Modal styles for detailed time slot view
export const DetailModalOverlay = styled.div`
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
  padding: 1rem;
`;

export const DetailModalContainer = styled.div`
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

export const DetailModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  text-align: left;
`;

export const DetailModalTitle = styled.h2`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  display: flex;
  align-items: center;
  text-align: left;
`;

export const DetailModalSubtitle = styled.div`
  color: #cc31e8;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  text-align: left;
`;

export const DetailModalAvailability = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
`;

export const DetailModalCloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

export const DetailModalBody = styled.div`
  padding: 1.5rem;
  text-align: left;
`;

export const DetailModalDescription = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  text-align: left;
`;

export const ProConsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  text-align: left;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ProConsSection = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  text-align: left;
`;

export const ProConsTitle = styled.h4`
  color: ${props => props.$type === 'pros' ? '#22c55e' : '#f59e0b'};
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
`;

export const ProConsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
`;

export const ProsConsItem = styled.li`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
  padding-left: 1rem;
  position: relative;
  text-align: left;
  
  &:before {
    content: "•";
    color: ${props => props.$type === 'pros' ? '#22c55e' : '#f59e0b'};
    position: absolute;
    left: 0;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;