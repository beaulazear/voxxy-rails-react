// CuisineChat.js
import React, { useState, useRef, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Utensils, MapPin, DollarSign, Heart, Plus } from 'lucide-react';

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
  z-index: 999;
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
`;

const ProgressBarContainer = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  width: 100%;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const StepLabel = styled.div`
  padding: 1rem 2rem 0.5rem;
  font-size: 0.85rem;
  color: #cc31e8;
  text-align: center;
  font-weight: 600;
`;

const ModalHeader = styled.div`
  padding: 0 2rem 1rem;
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

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
`;

const Input = styled.input`
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
  
  &::placeholder { 
    color: #aaa; 
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
  min-height: 120px;
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

const RadioCardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const RadioCard = styled.div`
  padding: 1rem 0.75rem;
  text-align: center;
  border-radius: 0.75rem;
  background: ${({ selected }) => (selected ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'rgba(255, 255, 255, 0.05)')};
  color: #fff;
  border: ${({ selected }) => (selected ? 'none' : '2px solid rgba(255, 255, 255, 0.1)')};
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ selected }) => (selected ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)' : 'rgba(255, 255, 255, 0.08)')};
    transform: translateY(-2px);
    box-shadow: ${({ selected }) => (selected ? '0 8px 20px rgba(204, 49, 232, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)')};
    border-color: ${({ selected }) => (selected ? 'transparent' : '#cc31e8')};
  }
`;

const IconWrapper = styled.div`
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
  line-height: 1;
`;

const PillContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Pill = styled.div`
  background: rgba(204, 49, 232, 0.2);
  color: #cc31e8;
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(204, 49, 232, 0.3);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(204, 49, 232, 0.3);
  }
`;

const RemoveIcon = styled.span`
  cursor: pointer;
  font-weight: bold;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(220, 38, 127, 0.2);
  color: #dc267f;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(220, 38, 127, 0.4);
    transform: scale(1.1);
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

const AddButton = styled.button`
  background: rgba(204, 49, 232, 0.1);
  border: 2px solid rgba(204, 49, 232, 0.3);
  color: #cc31e8;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
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

const InputRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

export default function CuisineChat({ onClose, activityId, onChatComplete }) {
  const { user, setUser } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const contentRef = useRef(null);

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const percent = (step / totalSteps) * 100;

  const cuisineOptions = [
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Indian',
    'Thai',
    'Mediterranean',
    'American',
    'Surprise me!',
  ];
  const [selectedCuisines, setSelectedCuisines] = useState(['Surprise me!']);
  const [otherCuisine, setOtherCuisine] = useState('');

  const atmosphereOptions = [
    'Casual',
    'Trendy',
    'Romantic',
    'Outdoor',
    'Family Friendly',
    'Cozy',
    'Rooftop',
    'Waterfront',
    'Historic',
  ];
  const [selectedAtmospheres, setSelectedAtmospheres] = useState([]);
  const [otherAtmosphere, setOtherAtmosphere] = useState('');

  const budgetOptions = [
    { label: 'No preference', icon: '🤷' },
    { label: 'Budget-friendly', icon: '💰' },
    { label: 'Prefer upscale', icon: '🍾' },
  ];
  const [selectedBudget, setSelectedBudget] = useState('No preference');

  const [dietary, setDietary] = useState(user.preferences || '');

  const handleInputFocus = (e) => {
    const target = e.target;
    if (contentRef.current && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleCuisine = (cuisine) => {
    if (cuisine === 'Surprise me!') {
      setSelectedCuisines(['Surprise me!']);
      setOtherCuisine('');
      return;
    }
    const withoutSurprise = selectedCuisines.filter((c) => c !== 'Surprise me!');
    if (withoutSurprise.includes(cuisine)) {
      setSelectedCuisines(withoutSurprise.filter((c) => c !== cuisine));
    } else {
      setSelectedCuisines([...withoutSurprise, cuisine]);
    }
  };
  const addCustomCuisine = () => {
    const trimmed = otherCuisine.trim();
    if (!trimmed) return;
    const withoutSurprise = selectedCuisines.filter((c) => c !== 'Surprise me!');
    if (!withoutSurprise.includes(trimmed)) {
      setSelectedCuisines([...withoutSurprise, trimmed]);
    }
    setOtherCuisine('');
  };

  const toggleAtmosphereOption = (atm) => {
    setSelectedAtmospheres((prev) =>
      prev.includes(atm) ? prev.filter((a) => a !== atm) : [...prev, atm]
    );
  };
  const addCustomAtmosphere = () => {
    const trimmed = otherAtmosphere.trim();
    if (!trimmed) return;
    if (!selectedAtmospheres.includes(trimmed)) {
      setSelectedAtmospheres((prev) => [...prev, trimmed]);
    }
    setOtherAtmosphere('');
  };

  const isNextDisabled = () => {
    if (step === 1) return selectedCuisines.length === 0;
    if (step === 2) return selectedAtmospheres.length === 0;
    if (step === 3) return !selectedBudget;
    return false;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleRemovePill = (item, listSetter, list) => {
    listSetter(list.filter((i) => i !== item));
  };

  const handleSubmit = async () => {
    const cuisinesText = selectedCuisines.join(', ');
    const atmosText = selectedAtmospheres.join(', ');
    const budgetText = selectedBudget;
    const dietaryText = dietary || 'None';

    const notes = [
      `Cuisines: ${cuisinesText}`,
      `Atmospheres: ${atmosText}`,
      `Budget: ${budgetText}`,
      `Dietary Preferences: ${dietaryText}`,
    ].join('\n\n');

    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Voxxy Chat Custom Completed', {
        name: user.name,
      });
    }

    try {
      const res = await fetch(`${API_URL}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          response: { notes, activity_id: activityId },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Failed to save response:', errorData);
        return;
      }

      const { response: newResponse, comment: newComment } = await res.json();

      setUser((prev) => {
        const activities = prev.activities.map((act) => {
          if (act.id === activityId) {
            const filteredResponses = (act.responses || []).filter(
              response => response.user_id !== user.id
            );
            const filteredComments = (act.comments || []).filter(
              comment => comment.user_id !== user.id
            );

            return {
              ...act,
              responses: [...filteredResponses, newResponse],
              comments: [...filteredComments, newComment],
            };
          }
          return act;
        });

        const participant_activities = prev.participant_activities.map((pa) => {
          if (pa.activity.id === activityId) {
            // Filter out any existing responses from this user
            const filteredResponses = (pa.activity.responses || []).filter(
              response => response.user_id !== user.id
            );
            const filteredComments = (pa.activity.comments || []).filter(
              comment => comment.user_id !== user.id
            );

            return {
              ...pa,
              activity: {
                ...pa.activity,
                responses: [...filteredResponses, newResponse],
                comments: [...filteredComments, newComment],
              },
            };
          }
          return pa;
        });

        return {
          ...prev,
          activities,
          participant_activities,
        };
      });

      onChatComplete(newResponse, newComment);
    } catch (error) {
      console.error('❌ Error submitting response:', error);
    }

    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ProgressBarContainer>
          <ProgressBar $percent={percent} />
        </ProgressBarContainer>

        <StepLabel>
          Step {step} of {totalSteps}
        </StepLabel>

        <ModalHeader>
          <Title>
            {step === 1 && 'What cuisine do you prefer?'}
            {step === 2 && 'What atmosphere are you looking for?'}
            {step === 3 && 'Whats your individual budget?'}
            {step === 4 && 'Dietary / Food Preferences'}
          </Title>
          <Subtitle>
            {step === 1 && 'Select up to nine popular cuisines or add your own.'}
            {step === 2 &&
              'Choose from the nine atmosphere options, or add your own.'}
            {step === 3 && 'Pick one budget option.'}
            {step === 4 && 'Enter any dietary or food preferences.'}
          </Subtitle>
        </ModalHeader>

        <StepContent ref={contentRef}>
          {step === 1 && (
            <Section>
              <Label>
                <Utensils size={16} />
                Choose Cuisines
              </Label>
              <RadioCardContainer>
                {cuisineOptions.map((cuisine) => (
                  <RadioCard
                    key={cuisine}
                    selected={selectedCuisines.includes(cuisine)}
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    <IconWrapper>
                      {cuisine === 'Italian'
                        ? '🍝'
                        : cuisine === 'Mexican'
                          ? '🌮'
                          : cuisine === 'Chinese'
                            ? '🥡'
                            : cuisine === 'Japanese'
                              ? '🍣'
                              : cuisine === 'Indian'
                                ? '🍛'
                                : cuisine === 'Thai'
                                  ? '🥘'
                                  : cuisine === 'Mediterranean'
                                    ? '🫒'
                                    : cuisine === 'American'
                                      ? '🍔'
                                      : '🎲'}
                    </IconWrapper>
                    {cuisine}
                  </RadioCard>
                ))}
              </RadioCardContainer>

              <Label>
                <Plus size={16} />
                Other (specify)
              </Label>
              <InputRow>
                <InputWrapper>
                  <Input
                    placeholder="Type cuisine…"
                    value={otherCuisine}
                    onChange={(e) => setOtherCuisine(e.target.value)}
                    onFocus={handleInputFocus}
                  />
                </InputWrapper>
                <AddButton
                  onClick={addCustomCuisine}
                  disabled={!otherCuisine.trim()}
                >
                  <Plus size={16} />
                  Add
                </AddButton>
              </InputRow>

              {selectedCuisines.length > 0 && (
                <PillContainer>
                  {selectedCuisines.map((c) => (
                    <Pill key={c}>
                      {c}
                      <RemoveIcon
                        onClick={() =>
                          handleRemovePill(
                            c,
                            setSelectedCuisines,
                            selectedCuisines
                          )
                        }
                      >
                        ×
                      </RemoveIcon>
                    </Pill>
                  ))}
                </PillContainer>
              )}
            </Section>
          )}

          {step === 2 && (
            <Section>
              <Label>
                <MapPin size={16} />
                Select Atmospheres
              </Label>
              <RadioCardContainer>
                {atmosphereOptions.map((atm) => (
                  <RadioCard
                    key={atm}
                    selected={selectedAtmospheres.includes(atm)}
                    onClick={() => toggleAtmosphereOption(atm)}
                  >
                    <IconWrapper>
                      {atm === 'Casual'
                        ? '👕'
                        : atm === 'Trendy'
                          ? '🎉'
                          : atm === 'Romantic'
                            ? '❤️'
                            : atm === 'Outdoor'
                              ? '🌳'
                              : atm === 'Family Friendly'
                                ? '👨‍👩‍👧‍👦'
                                : atm === 'Cozy'
                                  ? '🛋️'
                                  : atm === 'Rooftop'
                                    ? '🌆'
                                    : atm === 'Waterfront'
                                      ? '🌊'
                                      : '🏛️'}
                    </IconWrapper>
                    {atm}
                  </RadioCard>
                ))}
              </RadioCardContainer>

              <Label>
                <Plus size={16} />
                Other (specify)
              </Label>
              <InputRow>
                <InputWrapper>
                  <Input
                    placeholder="Type atmosphere…"
                    value={otherAtmosphere}
                    onChange={(e) => setOtherAtmosphere(e.target.value)}
                    onFocus={handleInputFocus}
                  />
                </InputWrapper>
                <AddButton
                  onClick={addCustomAtmosphere}
                  disabled={!otherAtmosphere.trim()}
                >
                  <Plus size={16} />
                  Add
                </AddButton>
              </InputRow>

              {selectedAtmospheres.length > 0 && (
                <PillContainer>
                  {selectedAtmospheres.map((a) => (
                    <Pill key={a}>
                      {a}
                      <RemoveIcon
                        onClick={() =>
                          handleRemovePill(
                            a,
                            setSelectedAtmospheres,
                            selectedAtmospheres
                          )
                        }
                      >
                        ×
                      </RemoveIcon>
                    </Pill>
                  ))}
                </PillContainer>
              )}
            </Section>
          )}

          {step === 3 && (
            <Section>
              <Label>
                <DollarSign size={16} />
                Budget
              </Label>
              <RadioCardContainer>
                {budgetOptions.map((opt) => (
                  <RadioCard
                    key={opt.label}
                    selected={selectedBudget === opt.label}
                    onClick={() => setSelectedBudget(opt.label)}
                  >
                    <IconWrapper>{opt.icon}</IconWrapper>
                    {opt.label}
                  </RadioCard>
                ))}
              </RadioCardContainer>
            </Section>
          )}

          {step === 4 && (
            <Section>
              <Label>
                <Heart size={16} />
                Dietary Preferences / Food Preferences
              </Label>
              <Textarea
                rows={4}
                placeholder="e.g. Vegetarian, No nuts, Keto..."
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                onFocus={handleInputFocus}
              />
            </Section>
          )}
        </StepContent>

        <ButtonRow>
          {step > 1 ? (
            <Button onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <div />
          )}
          <Button $primary onClick={handleNext} disabled={isNextDisabled()}>
            {step < totalSteps ? 'Next' : 'Finish'}
          </Button>
        </ButtonRow>
      </ModalContainer>
    </Overlay>
  );
}