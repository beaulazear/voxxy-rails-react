// Enhanced CuisineChat.js with availability selection
import React, { useState, useRef, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Utensils, MapPin, DollarSign, Heart, Plus, Calendar, Clock, Users } from 'lucide-react';
import {
  Overlay,
  ModalContainer,
  ProgressBarContainer,
  ProgressBar,
  StepLabel,
  ModalHeader,
  Title,
  Subtitle,
  StepContent,
  Section,
  OptionsGrid,
  OptionCard,
  OptionCardIcon,
  OptionCardLabel,
  Label,
  Input,
  Textarea,
  ButtonRow,
  Button,
} from '../styles/FormStyles';

// Keep only the styled components that aren't in FormStyles
// Using OptionsGrid and OptionCard from FormStyles instead of custom RadioCard

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

// ButtonRow and Button are imported from FormStyles

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

// NEW: Availability-specific styled components
const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
`;

const TimeSlot = styled.button`
  padding: 0.5rem;
  border: 2px solid ${({ selected }) => (selected ? '#cc31e8' : 'rgba(255, 255, 255, 0.1)')};
  background: ${({ selected }) => (selected ? '#cc31e8' : 'rgba(255, 255, 255, 0.05)')};
  color: #fff;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ selected }) => (selected ? '#bb2fd0' : 'rgba(255, 255, 255, 0.08)')};
    transform: translateY(-1px);
  }
`;

const AvailabilityCard = styled.div`
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  margin: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DateText = styled.div`
  color: #cc31e8;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const TimesText = styled.div`
  color: #ccc;
  font-size: 0.85rem;
`;

const RemoveButton = styled.button`
  background: rgba(255, 69, 69, 0.2);
  border: 1px solid rgba(255, 69, 69, 0.3);
  color: #ff4545;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  
  &:hover {
    background: rgba(255, 69, 69, 0.3);
  }
`;

export default function CuisineChat({
  onClose,
  activityId,
  onChatComplete,
  guestMode = false,
  guestToken = null,
  guestEmail = null,
  guestActivity
}) {
  const { user, setUser } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const contentRef = useRef(null);

  // NEW: Add activity state and availability states
  const [activity, setActivity] = useState(null);
  const [availability, setAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState([]);

  const [step, setStep] = useState(1);
  // NEW: Dynamic total steps based on whether availability is needed
  const getTotalSteps = () => {
    return activity?.allow_participant_time_selection ? 5 : 4;
  };
  const percent = (step / getTotalSteps()) * 100;

  // All existing state variables remain the same
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

  const [dietary, setDietary] = useState(guestMode ? '' : (user?.preferences || ''));

  // NEW: Time slots for availability selection
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  useEffect(() => {
    const fetchActivity = async () => {
      if (guestMode && guestActivity) {
        setActivity(guestActivity);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/activities/${activityId}`, {
          credentials: guestMode ? 'omit' : 'include'
        });
        const data = await response.json();

        let foundActivity = null;

        if (data.participant_activities) {
          foundActivity = data.participant_activities.find(pa => pa.id === parseInt(activityId));
        }

        if (!foundActivity && data.activities) {
          foundActivity = data.activities.find(act => act.id === parseInt(activityId));
        }

        if (foundActivity) {
          setActivity(foundActivity);
        } else {
          console.error('Activity not found in activities or participant_activities');
          setActivity(data);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
    };
    fetchActivity();
  }, [activityId, API_URL, guestMode, guestActivity]);

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

  const handleRemovePill = (item, listSetter, list) => {
    listSetter(list.filter((i) => i !== item));
  };

  // NEW: Availability functions
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimes(availability[date] || []);
  };

  const handleTimeToggle = (time) => {
    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter(t => t !== time)
      : [...selectedTimes, time];

    setSelectedTimes(newTimes);
  };

  const addAvailability = () => {
    if (selectedDate && selectedTimes.length > 0) {
      setAvailability(prev => ({
        ...prev,
        [selectedDate]: selectedTimes
      }));
      setSelectedDate('');
      setSelectedTimes([]);
    }
  };

  const removeAvailability = (date) => {
    setAvailability(prev => {
      const newAvailability = { ...prev };
      delete newAvailability[date];
      return newAvailability;
    });
  };

  // UPDATED: Enhanced validation logic
  const isNextDisabled = () => {
    if (step === 1) return selectedCuisines.length === 0;
    if (step === 2) return selectedAtmospheres.length === 0;
    if (step === 3) return !selectedBudget;
    if (step === 4) return false; // Dietary preferences are optional
    if (step === 5 && activity?.allow_participant_time_selection) {
      return Object.keys(availability).length === 0;
    }
    return false;
  };

  // UPDATED: Handle navigation including new availability step
  const handleNext = () => {
    const totalSteps = getTotalSteps();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // UPDATED: Enhanced submission with availability data
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

    if (process.env.NODE_ENV === 'production' && !guestMode) {
      mixpanel.track('Voxxy Chat Custom Completed', {
        name: user.name,
      });
    }

    try {
      let endpoint, requestOptions;

      if (guestMode) {
        // Guest response submission
        endpoint = `${API_URL}/activities/${activityId}/respond/${guestToken}`;
        requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response: {
              notes,
              // NEW: Include availability for guests if needed
              ...(activity?.allow_participant_time_selection && { availability })
            },
          }),
        };
      } else {
        // Authenticated user response submission
        endpoint = `${API_URL}/responses`;
        requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            response: {
              notes,
              activity_id: activityId,
              // NEW: Include availability if activity allows it
              ...(activity?.allow_participant_time_selection && { availability })
            },
          }),
        };
      }

      const res = await fetch(endpoint, requestOptions);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Failed to save response:', errorData);
        return;
      }

      const data = await res.json();

      // Only update user state for authenticated users
      if (!guestMode && user) {
        const { response: newResponse, comment: newComment } = data;

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
      } else {
        // For guest mode, just call onChatComplete
        onChatComplete();
      }

    } catch (error) {
      console.error('❌ Error submitting response:', error);
    }

    onClose();
  };

  // NEW: Dynamic step titles and subtitles
  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: 'What cuisine do you prefer?',
          subtitle: 'Select up to nine popular cuisines or add your own.'
        };
      case 2:
        return {
          title: 'What atmosphere are you looking for?',
          subtitle: 'Choose from the nine atmosphere options, or add your own.'
        };
      case 3:
        return {
          title: 'Whats your individual budget?',
          subtitle: 'Pick one budget option.'
        };
      case 4:
        return {
          title: 'Dietary / Food Preferences',
          subtitle: 'Enter any dietary or food preferences.'
        };
      case 5:
        return {
          title: 'When are you available?',
          subtitle: 'Select your preferred dates and times for the restaurant outing.'
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const { title, subtitle } = getStepContent();

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ProgressBarContainer>
          <ProgressBar $percent={percent} />
        </ProgressBarContainer>

        <StepLabel>
          Step {step} of {getTotalSteps()}
        </StepLabel>

        <ModalHeader>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </ModalHeader>

        <StepContent ref={contentRef}>
          {/* All existing steps remain exactly the same */}
          {step === 1 && (
            <Section>
              <Label>
                <Utensils size={16} />
                Choose Cuisines
              </Label>
              <OptionsGrid>
                {cuisineOptions.map((cuisine) => (
                  <OptionCard
                    key={cuisine}
                    $selected={selectedCuisines.includes(cuisine)}
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    <OptionCardIcon>
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
                    </OptionCardIcon>
                    <OptionCardLabel>{cuisine}</OptionCardLabel>
                  </OptionCard>
                ))}
              </OptionsGrid>

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
              <OptionsGrid>
                {atmosphereOptions.map((atm) => (
                  <OptionCard
                    key={atm}
                    $selected={selectedAtmospheres.includes(atm)}
                    onClick={() => toggleAtmosphereOption(atm)}
                  >
                    <OptionCardIcon>
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
                    </OptionCardIcon>
                    <OptionCardLabel>{atm}</OptionCardLabel>
                  </OptionCard>
                ))}
              </OptionsGrid>

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
              <OptionsGrid>
                {budgetOptions.map((opt) => (
                  <OptionCard
                    key={opt.label}
                    $selected={selectedBudget === opt.label}
                    onClick={() => setSelectedBudget(opt.label)}
                  >
                    <OptionCardIcon>{opt.icon}</OptionCardIcon>
                    <OptionCardLabel>{opt.label}</OptionCardLabel>
                  </OptionCard>
                ))}
              </OptionsGrid>
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

          {/* NEW: Availability step (step 5) - only shown if activity allows participant time selection */}
          {step === 5 && activity?.allow_participant_time_selection && (
            <Section>
              <Label>
                <Calendar size={16} />
                Select Date
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />

              {selectedDate && (
                <>
                  <Label>
                    <Clock size={16} />
                    Available Times on {new Date(selectedDate).toLocaleDateString()}
                  </Label>
                  <TimeGrid>
                    {timeSlots.map(time => (
                      <TimeSlot
                        key={time}
                        selected={selectedTimes.includes(time)}
                        onClick={() => handleTimeToggle(time)}
                      >
                        {time}
                      </TimeSlot>
                    ))}
                  </TimeGrid>

                  {selectedTimes.length > 0 && (
                    <AddButton onClick={addAvailability} style={{ marginTop: '1rem', width: '100%' }}>
                      <Users size={16} />
                      Add This Date ({selectedTimes.length} times selected)
                    </AddButton>
                  )}
                </>
              )}

              {Object.keys(availability).length > 0 && (
                <>
                  <Label style={{ marginTop: '1.5rem' }}>Your Selected Availability:</Label>
                  {Object.entries(availability).map(([date, times]) => (
                    <AvailabilityCard key={date}>
                      <div>
                        <DateText>{new Date(date).toLocaleDateString()}</DateText>
                        <TimesText>{times.join(', ')}</TimesText>
                      </div>
                      <RemoveButton onClick={() => removeAvailability(date)}>
                        Remove
                      </RemoveButton>
                    </AvailabilityCard>
                  ))}
                </>
              )}
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
            {step < getTotalSteps() ? 'Next' : 'Finish'}
          </Button>
        </ButtonRow>
      </ModalContainer>
    </Overlay>
  );
}