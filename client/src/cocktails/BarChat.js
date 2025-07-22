// BarChat.js - Response form for cocktails/bars
import { useState, useRef, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Wine, Plus, Calendar, Clock, Users, ChevronLeft, ChevronRight, Send, X } from 'lucide-react';
import {
  Overlay,
  ModalContainer,
  ProgressBarContainer,
  ProgressBar,
  StepLabel,
  ModalHeader,
  CloseButton,
  Title,
  StepContent,
  Section,
  SectionTitle,
  SectionDescription,
  OptionsGrid,
  OptionCard,
  MultiSelectGrid,
  MultiSelectCard,
  Label,
  Input,
  Textarea,
  ButtonRow,
  Button,
  DateTimeGrid,
  FormGroup,
  AvailabilitySection,
} from '../styles/FormStyles';

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

const InputRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const CustomAddButton = styled.button`
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

// Availability components for time selection
const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
`;

const TimeSlotButton = styled.button`
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

export default function BarChat({
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

    const [activity, setActivity] = useState(null);
    const [availability, setAvailability] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimes, setSelectedTimes] = useState([]);

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const getTotalSteps = () => {
        return activity?.allow_participant_time_selection ? 5 : 4;
    };
    const percent = (step / getTotalSteps()) * 100;

    const drinkOptions = [
        'Cocktails',
        'Beer',
        'Wine',
        'Whiskey/Spirits',
        'Non-alcoholic',
        'Surprise me!',
    ];
    const [selectedDrinks, setSelectedDrinks] = useState(['Surprise me!']);
    const [otherDrink, setOtherDrink] = useState('');

    const atmosphereOptions = [
        'Dive Bar',
        'Cocktail Lounge',
        'Sports Bar',
        'Rooftop Bar',
        'Wine Bar',
        'Brewery',
        'Dance Club',
        'Live Music',
        'LGBTQ+',
    ];
    const [selectedAtmospheres, setSelectedAtmospheres] = useState([]);
    const [otherAtmosphere, setOtherAtmosphere] = useState('');

    const budgetOptions = [
        'No preference',
        'Budget-friendly',
        'Prefer upscale',
    ];
    const [selectedBudget, setSelectedBudget] = useState('No preference');

    const [preferences, setPreferences] = useState(guestMode ? '' : (user?.preferences || ''));

    const timeSlots = [
        '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
        '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '1:00 AM', '2:00 AM'
    ];

    const stepTitles = [
        "What drinks do you prefer?",
        "What bar atmosphere are you looking for?",
        "What's your budget preference?",
        "Any special preferences?"
    ];

    if (activity?.allow_participant_time_selection) {
        stepTitles.push("When are you available?");
    }

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
                    setActivity(data);
                }
            } catch (error) {
                console.error('Error fetching activity:', error);
            }
        };
        fetchActivity();
    }, [activityId, API_URL, guestMode, guestActivity]);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [step]);

    const handleInputFocus = (e) => {
        const target = e.target;
        if (contentRef.current && target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const toggleDrink = (drink) => {
        if (drink === 'Surprise me!') {
            setSelectedDrinks(['Surprise me!']);
            setOtherDrink('');
            return;
        }
        const withoutSurprise = selectedDrinks.filter((d) => d !== 'Surprise me!');
        if (withoutSurprise.includes(drink)) {
            setSelectedDrinks(withoutSurprise.filter((d) => d !== drink));
        } else {
            setSelectedDrinks([...withoutSurprise, drink]);
        }
    };

    const addCustomDrink = () => {
        const trimmed = otherDrink.trim();
        if (!trimmed) return;
        const withoutSurprise = selectedDrinks.filter((d) => d !== 'Surprise me!');
        if (!withoutSurprise.includes(trimmed)) {
            setSelectedDrinks([...withoutSurprise, trimmed]);
        }
        setOtherDrink('');
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

    // Availability functions
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

    const isStepValid = () => {
        if (step === 1) return selectedDrinks.length > 0;
        if (step === 2) return selectedAtmospheres.length > 0;
        if (step === 3) return selectedBudget !== '';
        if (step === 4) return true; // Preferences are optional
        if (step === 5 && activity?.allow_participant_time_selection) {
            return Object.keys(availability).length > 0;
        }
        return true;
    };

    const handleNext = () => {
        const totalSteps = getTotalSteps();
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        const drinksText = selectedDrinks.join(', ');
        const atmosText = selectedAtmospheres.join(', ');
        const budgetText = selectedBudget;
        const preferencesText = preferences || 'None';

        const notes = [
            `Drink Preferences: ${drinksText}`,
            `Atmosphere: ${atmosText}`,
            `Budget: ${budgetText}`,
            `Special Preferences: ${preferencesText}`,
        ].join('\n\n');

        if (process.env.NODE_ENV === 'production' && !guestMode) {
            mixpanel.track('Bar Chat Completed', {
                name: user.name,
            });
        }

        try {
            let endpoint, requestOptions;

            if (guestMode) {
                endpoint = `${API_URL}/activities/${activityId}/respond/${guestToken}`;
                requestOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        response: {
                            notes,
                            ...(activity?.allow_participant_time_selection && { availability })
                        },
                    }),
                };
            } else {
                endpoint = `${API_URL}/responses`;
                requestOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        response: {
                            notes,
                            activity_id: activityId,
                            ...(activity?.allow_participant_time_selection && { availability })
                        },
                    }),
                };
            }

            const res = await fetch(endpoint, requestOptions);

            if (!res.ok) {
                const errorData = await res.json();
                console.error('❌ Failed to save response:', errorData);
                setError('Failed to submit preferences. Please try again.');
                return;
            }

            const data = await res.json();

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
                onChatComplete();
            }

        } catch (error) {
            console.error('❌ Error submitting response:', error);
            setError('Failed to submit preferences. Please try again.');
        } finally {
            setSubmitting(false);
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
                    Step {step} of {getTotalSteps()}
                </StepLabel>

                {error && (
                    <div style={{
                        background: 'rgba(220, 53, 69, 0.1)',
                        border: '1px solid rgba(220, 53, 69, 0.3)',
                        color: '#dc3545',
                        padding: '1rem 2rem',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <ModalHeader>
                    <Title>
                        <Wine />
                        {stepTitles[step - 1]}
                    </Title>
                    <CloseButton onClick={onClose}>
                        <X size={20} />
                    </CloseButton>
                </ModalHeader>

                <StepContent ref={contentRef}>
                    {step === 1 && (
                        <Section>
                            <SectionDescription>Select your favorite types of drinks or let us surprise you.</SectionDescription>
                            <MultiSelectGrid>
                                {drinkOptions.map((drink) => (
                                    <MultiSelectCard
                                        key={drink}
                                        $selected={selectedDrinks.includes(drink)}
                                        onClick={() => toggleDrink(drink)}
                                    >
                                        {drink}
                                    </MultiSelectCard>
                                ))}
                            </MultiSelectGrid>

                            <Label>
                                <Plus size={16} />
                                Other (specify)
                            </Label>
                            <InputRow>
                                <InputWrapper>
                                    <Input
                                        placeholder="Type drink preference…"
                                        value={otherDrink}
                                        onChange={(e) => setOtherDrink(e.target.value)}
                                        onFocus={handleInputFocus}
                                    />
                                </InputWrapper>
                                <CustomAddButton
                                    onClick={addCustomDrink}
                                    disabled={!otherDrink.trim()}
                                >
                                    <Plus size={16} />
                                    Add
                                </CustomAddButton>
                            </InputRow>

                            {selectedDrinks.length > 0 && (
                                <PillContainer>
                                    {selectedDrinks.map((d) => (
                                        <Pill key={d}>
                                            {d}
                                            <RemoveIcon
                                                onClick={() =>
                                                    handleRemovePill(
                                                        d,
                                                        setSelectedDrinks,
                                                        selectedDrinks
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
                            <SectionDescription>Choose the vibe that matches your ideal night out.</SectionDescription>
                            <MultiSelectGrid>
                                {atmosphereOptions.map((atm) => (
                                    <MultiSelectCard
                                        key={atm}
                                        $selected={selectedAtmospheres.includes(atm)}
                                        onClick={() => toggleAtmosphereOption(atm)}
                                    >
                                        {atm}
                                    </MultiSelectCard>
                                ))}
                            </MultiSelectGrid>

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
                                <CustomAddButton
                                    onClick={addCustomAtmosphere}
                                    disabled={!otherAtmosphere.trim()}
                                >
                                    <Plus size={16} />
                                    Add
                                </CustomAddButton>
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
                            <SectionDescription>Pick one budget option for drinks and venue.</SectionDescription>
                            <OptionsGrid>
                                {budgetOptions.map((budget) => (
                                    <OptionCard
                                        key={budget}
                                        $selected={selectedBudget === budget}
                                        onClick={() => setSelectedBudget(budget)}
                                    >
                                        {budget}
                                    </OptionCard>
                                ))}
                            </OptionsGrid>
                        </Section>
                    )}

                    {step === 4 && (
                        <Section>
                            <SectionDescription>Let us know about any specific needs or preferences.</SectionDescription>
                            <Textarea
                                rows={4}
                                placeholder="e.g. Need non-alcoholic options, prefer late night hours, want food available, quiet conversation space..."
                                value={preferences}
                                onChange={(e) => setPreferences(e.target.value)}
                                onFocus={handleInputFocus}
                            />
                        </Section>
                    )}

                    {step === 5 && activity?.allow_participant_time_selection && (
                        <Section>
                            <SectionTitle><Calendar size={20} />Your Availability</SectionTitle>
                            <SectionDescription>Select your preferred dates and times for the night out.</SectionDescription>

                            <DateTimeGrid>
                                <FormGroup>
                                    <Label style={{ fontSize: '0.8rem', color: '#ccc' }}>Date</Label>
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <Label style={{ fontSize: '0.8rem', color: '#ccc' }}>Time</Label>
                                    <Input
                                        type="time"
                                        value={selectedDate ? '' : ''}
                                        style={{ display: 'none' }}
                                    />
                                </FormGroup>
                            </DateTimeGrid>

                            {selectedDate && (
                                <>
                                    <Label>
                                        <Clock size={16} />
                                        Available Times on {new Date(selectedDate).toLocaleDateString()}
                                    </Label>
                                    <TimeGrid>
                                        {timeSlots.map(time => (
                                            <TimeSlotButton
                                                key={time}
                                                selected={selectedTimes.includes(time)}
                                                onClick={() => handleTimeToggle(time)}
                                            >
                                                {time}
                                            </TimeSlotButton>
                                        ))}
                                    </TimeGrid>

                                    {selectedTimes.length > 0 && (
                                        <CustomAddButton onClick={addAvailability} style={{ marginTop: '1rem', width: '100%' }}>
                                            <Users size={16} />
                                            Add This Date ({selectedTimes.length} times selected)
                                        </CustomAddButton>
                                    )}
                                </>
                            )}

                            {Object.keys(availability).length > 0 && (
                                <AvailabilitySection>
                                    <h4 style={{ color: '#fff', margin: '1.5rem 0 0.5rem 0', fontSize: '0.9rem' }}>
                                        Your Selected Availability:
                                    </h4>
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
                                </AvailabilitySection>
                            )}
                        </Section>
                    )}
                </StepContent>

                <ButtonRow>
                    {step > 1 ? (
                        <Button onClick={() => setStep(step - 1)}>
                            <ChevronLeft size={16} />
                            Back
                        </Button>
                    ) : (
                        <Button onClick={onClose}>
                            Cancel
                        </Button>
                    )}
                    
                    <Button
                        $primary
                        onClick={handleNext}
                        disabled={!isStepValid() || submitting}
                    >
                        {step === getTotalSteps() ? (
                            submitting ? 'Submitting...' : <><Send size={16} />Submit Preferences</>
                        ) : (
                            <><ChevronRight size={16} />Next</>
                        )}
                    </Button>
                </ButtonRow>
            </ModalContainer>
        </Overlay>
    );
}