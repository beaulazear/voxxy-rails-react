// CuisineChat.js
import React, { useState, useRef, useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 998;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  background: #2C1E33;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #eee;
`;

const ProgressBarContainer = styled.div`
  height: 6px;
  background: #333;
  width: 100%;
`;

const ProgressBar = styled.div`
  height: 6px;
  background: #cc31e8;
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const StepLabel = styled.div`
  padding: 0.75rem 1.5rem 0.5rem;
  font-size: 0.85rem;
  color: #ccc;
  text-align: center;
`;

const ModalHeader = styled.div`
  padding: 0 1.5rem 1rem;
  text-align: left;
`;

const Title = styled.h2`
  color: #fff;
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
`;

const Subtitle = styled.p`
  color: #aaa;
  margin: 0;
  font-size: 0.9rem;
`;

const StepContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  color: #ddd;
  text-align: left;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eee;
  margin-bottom: 1rem;
  &::placeholder {
    color: #777;
  }
  &:focus {
    border-color: #6c63ff;
    outline: none;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.6rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eee;
  margin-bottom: 1rem;
  &::placeholder {
    color: #777;
  }
  &:focus {
    border-color: #6c63ff;
    outline: none;
  }
`;

const RadioCardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const RadioCard = styled.div`
  flex: 1 1 28%;
  padding: 0.7rem 0;
  text-align: center;
  border-radius: 8px;
  background: #2a2a2a;
  border: ${({ selected }) => (selected ? '2px solid #cc31e8' : '1px solid #444')};
  color: #eee;
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: background 0.2s ease, border-color 0.2s ease;
  &:hover {
    border-color: #bb2fd0;
    background: #333;
  }
`;

const IconWrapper = styled.div`
  font-size: 1.4rem;
  margin-bottom: 0.3rem;
`;

const PillContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Pill = styled.div`
  background: #444;
  color: #eee;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
`;

const RemoveIcon = styled.span`
  cursor: pointer;
  font-weight: bold;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
`;

const Button = styled.button`
  background: ${({ $primary }) => ($primary ? '#cc31e8' : 'transparent')};
  color: ${({ $primary }) => ($primary ? 'white' : '#6c63ff')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid #6c63ff')};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  background: transparent;
  border: 1px solid #6c63ff;
  color: #6c63ff;
  border-radius: 6px;
  padding: 0 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  height: 2.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: #6c63ff;
    color: white;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function CuisineChat({ onClose, activityId, onChatComplete }) {
  const { user, setUser } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const contentRef = useRef(null);

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const percent = (step / totalSteps) * 100;

  console.log(user)

  // Step 1: Cuisine selections (nine popular cuisines + 'Surprise me!')
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

  // Step 2: Atmosphere selections (nine options)
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

  // Step 3: Budget cards
  const budgetOptions = [
    { label: 'No preference', icon: '🤷' },
    { label: 'Budget-friendly', icon: '💰' },
    { label: 'Prefer upscale', icon: '🍾' },
  ];
  const [selectedBudget, setSelectedBudget] = useState('No preference');

  // Step 4: Dietary preferences
  const [dietary, setDietary] = useState(user.preferences || '');

  // Scroll input into view on focus
  const handleInputFocus = (e) => {
    const target = e.target;
    if (contentRef.current && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Step 1 handlers
  const toggleCuisine = (cuisine) => {
    if (cuisine === 'Surprise me!') {
      setSelectedCuisines(['Surprise me!']);
      setOtherCuisine('');
      return;
    }
    // If any other cuisine is chosen, unselect 'Surprise me!'
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
    // If adding a custom cuisine, unselect 'Surprise me!'
    const withoutSurprise = selectedCuisines.filter((c) => c !== 'Surprise me!');
    if (!withoutSurprise.includes(trimmed)) {
      setSelectedCuisines([...withoutSurprise, trimmed]);
    }
    setOtherCuisine('');
  };

  // Step 2 handlers
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

  // Validation for Next
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

  // Remove pill helper
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
      const response = await fetch(`${API_URL}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          response: { notes, activity_id: activityId },
        }),
      });

      if (response.ok) {
        const newResponse = await response.json();

        setUser((prevUser) => {
          const updatedActivities = prevUser.activities.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                responses: [...(activity.responses || []), newResponse],
              };
            }
            return activity;
          });

          const updatedParticipantActivities =
            prevUser.participant_activities.map((participant) => {
              if (participant.activity.id === activityId) {
                return {
                  ...participant,
                  activity: {
                    ...participant.activity,
                    responses: [
                      ...(participant.activity.responses || []),
                      newResponse,
                    ],
                  },
                };
              }
              return participant;
            });

          return {
            ...prevUser,
            activities: updatedActivities,
            participant_activities: updatedParticipantActivities,
          };
        });

        onChatComplete(newResponse);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save response:', errorData);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }

    onClose();
  };

  return (
    <>
      <Overlay onClick={onClose} />
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
            {step === 3 && 'What’s your individual budget?'}
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
          {/* Step 1: Cuisine */}
          {step === 1 && (
            <>
              <Label>Choose Cuisines</Label>
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

              <Label>Other (specify)</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Input
                  placeholder="Type cuisine…"
                  value={otherCuisine}
                  onChange={(e) => setOtherCuisine(e.target.value)}
                  onFocus={handleInputFocus}
                />
                <AddButton
                  onClick={addCustomCuisine}
                  disabled={!otherCuisine.trim()}
                >
                  Add
                </AddButton>
              </div>

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
            </>
          )}

          {/* Step 2: Atmosphere */}
          {step === 2 && (
            <>
              <Label>Select Atmospheres</Label>
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

              <Label>Other (specify)</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Input
                  placeholder="Type atmosphere…"
                  value={otherAtmosphere}
                  onChange={(e) => setOtherAtmosphere(e.target.value)}
                  onFocus={handleInputFocus}
                />
                <AddButton
                  onClick={addCustomAtmosphere}
                  disabled={!otherAtmosphere.trim()}
                >
                  Add
                </AddButton>
              </div>

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
            </>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <>
              <Label>Budget</Label>
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
            </>
          )}

          {/* Step 4: Dietary Preferences */}
          {step === 4 && (
            <>
              <Label>Dietary Preferences / Food Preferences</Label>
              <Textarea
                rows={4}
                placeholder="e.g. Vegetarian, No nuts, Keto..."
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                onFocus={handleInputFocus}
              />
            </>
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
    </>
  );
}