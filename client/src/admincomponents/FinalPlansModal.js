import React, { useState, useContext } from "react";
import styled, { keyframes } from "styled-components";
import { Share2, Lightbulb, X, Send, SkipForward } from "lucide-react";
import { UserContext } from "../context/user";
import { message } from "antd";

const FinalPlansModal = ({ isVisible, onClose, onShare, shareUrl }) => {
  const [currentStep, setCurrentStep] = useState('initial'); // 'initial', 'options', 'feedback'
  const [selectedOption, setSelectedOption] = useState('');
  const [feedbackText, setFeedbackText] = useState("");

  const { user } = useContext(UserContext)

  if (!isVisible) return null;

  const handleShareClick = () => {
    onShare();
    window.open(shareUrl, '_blank');
  };

  const handleHelpVoxxyClick = () => {
    setCurrentStep('options');
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setCurrentStep('feedback');
  };

  const handleSkip = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = '/feedbacks';
    const body = {
      feedback: {
        name: user.name,
        email: user.email,
        rating: 5,
        message: feedbackText,
        selected_feature: selectedOption,
      }
    };

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${url}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error('Network response was not ok');
      message.success('Submission successful!');
      onClose();
    } catch (err) {
      message.error('Oops, something went wrong.');
    }
  };

  const nextOptions = [
    { value: 'movie-night', emoji: '🎥', title: 'Movie Night', subtitle: 'Plan your perfect movie night.' },
    { value: 'ski-trip', emoji: '🎿', title: 'Ski Trip', subtitle: 'Organize your next ski adventure.' },
    { value: 'kids-playdate', emoji: '👩‍👧‍👦', title: 'Kids Play Date', subtitle: 'Coordinate a fun playdate for little ones.' },
    { value: 'find-destination', emoji: '🗺️', title: 'Find a Destination', subtitle: 'Discover new travel destinations.' },
    { value: 'game-night', emoji: '🎮', title: 'Game Night', subtitle: 'Set up a memorable game night.' },
    { value: 'family-reunion', emoji: '👨‍👩‍👧‍👦', title: 'Family Reunion', subtitle: 'Plan a family gathering.' },
    { value: 'road-trip', emoji: '🚗', title: 'Road Trip', subtitle: 'Map out your road trip route.' },
    { value: 'other', emoji: '✨', title: 'Choose Another', subtitle: 'Something else entirely.' },
  ];

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>

        {currentStep === 'initial' && (
          <>
            <ModalHeader>
              <Title>Share your plans</Title>
              <Subtitle>What would you like to do next?</Subtitle>
            </ModalHeader>

            <StepContent>
              <ButtonContainer>
                <ActionButton onClick={handleShareClick}>
                  <ButtonIcon>
                    <Share2 size={20} />
                  </ButtonIcon>
                  <ButtonContent>
                    <ButtonTitle>Share</ButtonTitle>
                    <ButtonDescription>Send the finalized details to all attendees</ButtonDescription>
                  </ButtonContent>
                </ActionButton>

                <ActionButton onClick={handleHelpVoxxyClick}>
                  <ButtonIcon>
                    <Lightbulb size={20} />
                  </ButtonIcon>
                  <ButtonContent>
                    <ButtonTitle>Help Voxxy decide what's next</ButtonTitle>
                    <ButtonDescription>Let us know what you're planning to do next</ButtonDescription>
                  </ButtonContent>
                </ActionButton>
              </ButtonContainer>
            </StepContent>
          </>
        )}

        {currentStep === 'options' && (
          <>
            <ModalHeader>
              <Title>What's next?</Title>
              <Subtitle>Choose what you'd like us to help you plan next</Subtitle>
            </ModalHeader>

            <StepContent>
              <OptionsGrid>
                {nextOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    <OptionEmoji>{option.emoji}</OptionEmoji>
                    <OptionTitle>{option.title}</OptionTitle>
                    <OptionSubtitle>{option.subtitle}</OptionSubtitle>
                  </OptionCard>
                ))}
              </OptionsGrid>
            </StepContent>
          </>
        )}

        {currentStep === 'feedback' && (
          <>
            <ModalHeader>
              <Title>Coming soon</Title>
              <Subtitle>Help us prioritize what to build next!</Subtitle>
            </ModalHeader>

            <StepContent>
              <Section>
                <Textarea
                  placeholder="Tell us more about what you'd like to see or any feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                />
              </Section>
            </StepContent>

            <ButtonRow>
              <Button onClick={handleSkip}>
                <SkipForward size={16} />
                Skip for now
              </Button>
              <Button
                $primary
                onClick={handleSubmit}
                disabled={!feedbackText.trim()}
              >
                <Send size={16} />
                Submit feedback
              </Button>
            </ButtonRow>
          </>
        )}
      </ModalContainer>
    </Overlay>
  );
};

export default FinalPlansModal;

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
`;

const Overlay = styled.div`
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
  z-index: 2000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
`;

const Subtitle = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const StepContent = styled.div`
  padding: 1.5rem 2rem;
  flex: 1;
  overflow-y: auto;
  
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

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #cc31e8;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(204, 49, 232, 0.3);
  }
`;

const ButtonIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  border-radius: 0.75rem;
  margin-right: 1rem;
  flex-shrink: 0;
`;

const ButtonContent = styled.div`
  flex: 1;
`;

const ButtonTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ButtonDescription = styled.div`
  font-size: 0.9rem;
  color: #ccc;
  line-height: 1.3;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const OptionCard = styled.div`
  padding: 1.5rem 1rem;
  text-align: center;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(204, 49, 232, 0.3);
    border-color: #cc31e8;
  }
`;

const OptionEmoji = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const OptionTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const OptionSubtitle = styled.div`
  font-size: 0.75rem;
  color: #ccc;
  text-align: center;
  line-height: 1.3;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:focus { 
    border-color: #cc31e8; 
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder { 
    color: #aaa; 
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
`;

const Button = styled.button`
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
  min-width: 100px;
  
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