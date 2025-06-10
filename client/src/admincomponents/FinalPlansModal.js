import React, { useState, useContext } from "react";
import styled, { keyframes } from "styled-components";
import { Share2, BookOpen, X } from "lucide-react";
import { UserContext } from "../context/user";
import { message } from "antd";

const FinalPlansModal = ({ isVisible, onClose, onShare, shareUrl }) => {
    const [showNextStep, setShowNextStep] = useState(false);
    const [nextPlanText, setNextPlanText] = useState("");

    const { user } = useContext(UserContext)

    if (!isVisible) return null;

    const handleShareClick = () => {
        onShare();
        window.open(shareUrl, '_blank');
    };

    const handleTellUsNextClick = () => {
        setShowNextStep(true);
    };

    const handleSkip = () => {
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = '/feedbacks';
        const body = { feedback: { 
            name: user.name,
            email: user.email,
            rating: 5, 
            message: nextPlanText,
        }};

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

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={onClose}>
                    <X size={20} />
                </CloseButton>

                {!showNextStep ? (
                    <>
                        <ModalTitle>Final Plans</ModalTitle>
                        <ModalSubtitle>What would you like to do next?</ModalSubtitle>

                        <ButtonContainer>
                            <ActionButton onClick={handleShareClick}>
                                <ButtonIcon>
                                    <Share2 size={24} />
                                </ButtonIcon>
                                <ButtonContent>
                                    <ButtonTitle>Share Final Plans</ButtonTitle>
                                    <ButtonDescription>Send the finalized details to all attendees</ButtonDescription>
                                </ButtonContent>
                            </ActionButton>

                            <ActionButton onClick={handleTellUsNextClick}>
                                <ButtonIcon>
                                    <BookOpen size={24} />
                                </ButtonIcon>
                                <ButtonContent>
                                    <ButtonTitle>Tell Us What's Next</ButtonTitle>
                                    <ButtonDescription>Let us know what you're planning to do next</ButtonDescription>
                                </ButtonContent>
                            </ActionButton>
                        </ButtonContainer>
                    </>
                ) : (
                    <>
                        <ModalTitle>What's Next?</ModalTitle>
                        <ModalSubtitle>
                            We will use this information to inform the future direction of this app. Totally optional, but in the future we hope to help you here too!
                        </ModalSubtitle>

                        <TextAreaContainer>
                            <StyledTextArea
                                placeholder="Tell us about your next activity, event, or anything you're planning..."
                                value={nextPlanText}
                                onChange={(e) => setNextPlanText(e.target.value)}
                                rows={4}
                            />
                        </TextAreaContainer>

                        <BottomButtonContainer>
                            <SecondaryButton onClick={handleSkip}>
                                Skip
                            </SecondaryButton>
                            <PrimaryButton onClick={handleSubmit}>
                                Submit
                            </PrimaryButton>
                        </BottomButtonContainer>
                    </>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};

export default FinalPlansModal;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const modalFadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: ${fadeIn} 0.25s ease-out;
`;

const ModalContent = styled.div`
  background: #201925;
  padding: 2rem;
  border-radius: 18px;
  max-width: 500px;
  width: 90%;
  color: #fff;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: ${modalFadeIn} 0.25s ease-out;
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
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModalTitle = styled.h2`
  font-family: "Montserrat", sans-serif;
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  margin: 0 0 0.5rem 0;
  text-align: left;
`;

const ModalSubtitle = styled.p`
  font-family: "Montserrat", sans-serif;
  font-size: 1rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 2rem 0;
  line-height: 1.4;
  text-align: left;
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
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: #9051e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(144, 81, 225, 0.3);
  }
`;

const ButtonIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #9051e1;
  border-radius: 8px;
  margin-right: 1rem;
  flex-shrink: 0;
`;

const ButtonContent = styled.div`
  flex: 1;
`;

const ButtonTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ButtonDescription = styled.div`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
`;

const TextAreaContainer = styled.div`
  margin: 1.5rem 0;
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  color: #eee;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-family: "Inter", sans-serif;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s, background 0.2s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.12);
    border-color: #9051e1;
    box-shadow: 0 0 0 3px rgba(144, 81, 225, 0.2);
  }
`;

const BottomButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const PrimaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #9051e1;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: #7a42c7;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(144, 81, 225, 0.4);
  }
`;

const SecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;