// FormStyles.js
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

export const Overlay = styled.div`
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
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
`;

export const ProgressBarContainer = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  width: 100%;
`;

export const ProgressBar = styled.div`
  height: 4px;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

export const StepLabel = styled.div`
  padding: 1rem 2rem 0.5rem;
  font-size: 0.85rem;
  color: #cc31e8;
  text-align: left;
  font-weight: 600;
  
  @media (max-width: 768px) {
    padding: 1rem 1.5rem 0.5rem;
  }
`;

export const ModalHeader = styled.div`
  padding: 0 2rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  
  @media (max-width: 768px) {
    padding: 0 1.5rem 1rem;
  }
`;

export const Title = styled.h2`
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  text-align: left;
  
  svg {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    
    @media (max-width: 768px) {
      width: 32px;
      height: 32px;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
    gap: 1rem;
  }
`;

export const Subtitle = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: left;
`;

export const StepContent = styled.div`
  padding: 1.5rem 2rem;
  flex: 1;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem;
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

export const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const SectionDescription = styled.p`
  color: #ccc;
  font-size: 0.85rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
  text-align: left;
`;

export const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

export const OptionCard = styled.button`
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
      : 'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected }) =>
    $selected
      ? 'none'
      : '2px solid rgba(255, 255, 255, 0.1)'};
  color: #fff;
  padding: 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    font-size: 0.9rem;
    text-align: left;
  }
  
  &:hover {
    background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
      : 'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-2px);
    box-shadow: ${({ $selected }) =>
    $selected
      ? '0 8px 20px rgba(204, 49, 232, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)'};
    border-color: ${({ $selected }) =>
    $selected
      ? 'transparent'
      : '#cc31e8'};
  }
`;

export const MultiSelectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }
`;

export const MultiSelectCard = styled.button`
  background: ${({ $selected }) =>
    $selected
      ? 'rgba(204, 49, 232, 0.3)'
      : 'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected }) =>
    $selected
      ? '2px solid #cc31e8'
      : '2px solid rgba(255, 255, 255, 0.1)'};
  color: #fff;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  
  @media (max-width: 768px) {
    padding: 1rem;
    font-size: 0.85rem;
    text-align: left;
  }
  
  &:hover {
    background: ${({ $selected }) =>
    $selected
      ? 'rgba(204, 49, 232, 0.4)'
      : 'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-1px);
    border-color: #cc31e8;
  }
`;

export const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
  text-align: left;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
  
  &:focus { 
    border-color: #cc31e8; 
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &:-webkit-autofill { 
    box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.05) inset !important; 
    -webkit-text-fill-color: #fff !important; 
  }
  
  &::-webkit-calendar-picker-indicator, 
  &::-moz-color-swatch-button { 
    filter: invert(1) brightness(2); 
    cursor: pointer; 
  }
  
  &::placeholder { 
    color: #aaa; 
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Range = styled.input.attrs({ type: 'range', min: 1, max: 50 })`
  width: 100%;
  margin: 0.5rem 0 1rem;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(204, 49, 232, 0.3);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(204, 49, 232, 0.3);
  }
`;

export const RangeLabel = styled.div`
  color: #cc31e8;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  text-align: left;
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:focus { 
    border-color: #cc31e8; 
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 2px rgba(204, 49, 232, 0.2);
  }
  
  &::placeholder { 
    color: #aaa; 
  }
`;

export const GroupSizeContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

export const GroupSizeCard = styled.div`
  padding: 1.25rem 1rem;
  text-align: center;
  border-radius: 1rem;
  background: ${({ selected }) => (selected ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'rgba(255, 255, 255, 0.05)')};
  color: #fff;
  border: ${({ selected }) => (selected ? 'none' : '2px solid rgba(255, 255, 255, 0.1)')};
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${({ selected }) => (selected ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)' : 'rgba(255, 255, 255, 0.08)')};
    transform: translateY(-2px);
    box-shadow: ${({ selected }) => (selected ? '0 8px 20px rgba(204, 49, 232, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)')};
    border-color: ${({ selected }) => (selected ? 'transparent' : '#cc31e8')};
  }
`;

export const GroupIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`;

export const GroupLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
`;

export const GroupSubtitle = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
`;

export const TimeCardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const TimeCard = styled.div`
  padding: 1rem;
  text-align: center;
  border-radius: 0.75rem;
  background: ${({ selected }) => (selected ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'rgba(255, 255, 255, 0.05)')};
  color: #fff;
  border: ${({ selected }) => (selected ? 'none' : '2px solid rgba(255, 255, 255, 0.1)')};
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ selected }) => (selected ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)' : 'rgba(255, 255, 255, 0.08)')};
    transform: translateY(-2px);
    box-shadow: ${({ selected }) => (selected ? '0 8px 20px rgba(204, 49, 232, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)')};
    border-color: ${({ selected }) => (selected ? 'transparent' : '#cc31e8')};
  }
`;

export const ToggleWrapper = styled.div`
  display: inline-block;
  position: relative;
  width: 50px;
  height: 24px;
  background: ${({ checked }) => (checked ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'rgba(255, 255, 255, 0.1)')};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${({ checked }) => (checked ? 'transparent' : 'rgba(255, 255, 255, 0.2)')};
`;

export const ToggleCircle = styled.div`
  position: absolute;
  top: 2px;
  left: ${({ checked }) => (checked ? '26px' : '2px')};
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: left 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
  gap: 0.75rem;
  text-align: left;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem 2rem;
  }
`;

export const Button = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  
  background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
      : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $primary }) => ($primary ? 'white' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '2px solid rgba(204, 49, 232, 0.3)')};
  
  &:hover:not(:disabled) { 
    transform: translateY(-2px);
    box-shadow: ${({ $primary }) =>
    $primary
      ? '0 8px 20px rgba(204, 49, 232, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)'};
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

export const CloseButton = styled.button`
  position: absolute;
  top: -0.5rem;
  right: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  margin-right: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
  width: 34px;
  height: 34px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

export const UseLocationButton = styled.button`
  background: rgba(204, 49, 232, 0.1);
  border: 2px solid rgba(204, 49, 232, 0.3);
  color: #cc31e8;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: rgba(204, 49, 232, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(204, 49, 232, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const DateTimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const AddTimeButton = styled.button`
  background: rgba(204, 49, 232, 0.1);
  border: 2px solid rgba(204, 49, 232, 0.3);
  color: #cc31e8;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(204, 49, 232, 0.2);
    transform: translateY(-1px);
  }
`;

export const AvailabilitySection = styled.div`
  margin-top: 1rem;
`;

export const TimeSlotsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

export const TimeSlot = styled.div`
  background: rgba(204, 49, 232, 0.2);
  border: 1px solid rgba(204, 49, 232, 0.4);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const RemoveTimeButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #ff6b6b;
  }
`;