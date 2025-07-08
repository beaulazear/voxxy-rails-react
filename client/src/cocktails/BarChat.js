// BarChat.js - Response form for cocktails/bars
import React, { useState, useRef, useContext, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Wine, MapPin, DollarSign, Heart, Plus, Calendar, Clock, Users } from 'lucide-react';

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
  
  &::-webkit-calendar-picker-indicator { 
    filter: invert(1) brightness(2); 
    cursor: pointer; 
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

// Availability components (same as CuisineChat)
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

    // Activity and availability state
    const [activity, setActivity] = useState(null);
    const [availability, setAvailability] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimes, setSelectedTimes] = useState([]);

    const [step, setStep] = useState(1);
    const getTotalSteps = () => {
        return activity?.allow_participant_time_selection ? 5 : 4;
    };
    const percent = (step / getTotalSteps()) * 100;

    // Bar-specific preferences
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
        'Quiet Spot',
    ];
    const [selectedAtmospheres, setSelectedAtmospheres] = useState([]);
    const [otherAtmosphere, setOtherAtmosphere] = useState('');

    const budgetOptions = [
        { label: 'No preference', icon: '🤷' },
        { label: 'Budget-friendly', icon: '💰' },
        { label: 'Prefer upscale', icon: '🥂' },
    ];
    const [selectedBudget, setSelectedBudget] = useState('No preference');

    const [preferences, setPreferences] = useState(guestMode ? '' : (user?.preferences || ''));

    // Time slots for availability (later times for bars)
    const timeSlots = [
        '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
        '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '1:00 AM', '2:00 AM'
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

    const isNextDisabled = () => {
        if (step === 1) return selectedDrinks.length === 0;
        if (step === 2) return selectedAtmospheres.length === 0;
        if (step === 3) return !selectedBudget;
        if (step === 4) return false; // Preferences are optional
        if (step === 5 && activity?.allow_participant_time_selection) {
            return Object.keys(availability).length === 0;
        }
        return false;
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
        }

        onClose();
    };

    const getStepContent = () => {
        switch (step) {
            case 1:
                return {
                    title: 'What drinks do you prefer?',
                    subtitle: 'Select your favorite types of drinks or let us surprise you.'
                };
            case 2:
                return {
                    title: 'What bar atmosphere are you looking for?',
                    subtitle: 'Choose the vibe that matches your ideal night out.'
                };
            case 3:
                return {
                    title: 'What\'s your budget preference?',
                    subtitle: 'Pick one budget option for drinks and venue.'
                };
            case 4:
                return {
                    title: 'Any special preferences?',
                    subtitle: 'Let us know about any specific needs or preferences.'
                };
            case 5:
                return {
                    title: 'When are you available?',
                    subtitle: 'Select your preferred dates and times for the night out.'
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
                    {step === 1 && (
                        <Section>
                            <Label>
                                <Wine size={16} />
                                Choose Drink Types
                            </Label>
                            <RadioCardContainer>
                                {drinkOptions.map((drink) => (
                                    <RadioCard
                                        key={drink}
                                        selected={selectedDrinks.includes(drink)}
                                        onClick={() => toggleDrink(drink)}
                                    >
                                        <IconWrapper>
                                            {drink === 'Cocktails'
                                                ? '🍸'
                                                : drink === 'Beer'
                                                    ? '🍺'
                                                    : drink === 'Wine'
                                                        ? '🍷'
                                                        : drink === 'Whiskey/Spirits'
                                                            ? '🥃'
                                                            : drink === 'Non-alcoholic'
                                                                ? '🥤'
                                                                : '🎲'}
                                        </IconWrapper>
                                        {drink}
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
                                        placeholder="Type drink preference…"
                                        value={otherDrink}
                                        onChange={(e) => setOtherDrink(e.target.value)}
                                        onFocus={handleInputFocus}
                                    />
                                </InputWrapper>
                                <AddButton
                                    onClick={addCustomDrink}
                                    disabled={!otherDrink.trim()}
                                >
                                    <Plus size={16} />
                                    Add
                                </AddButton>
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
                            <Label>
                                <MapPin size={16} />
                                Select Bar Atmosphere
                            </Label>
                            <RadioCardContainer>
                                {atmosphereOptions.map((atm) => (
                                    <RadioCard
                                        key={atm}
                                        selected={selectedAtmospheres.includes(atm)}
                                        onClick={() => toggleAtmosphereOption(atm)}
                                    >
                                        <IconWrapper>
                                            {atm === 'Dive Bar'
                                                ? '🏚️'
                                                : atm === 'Cocktail Lounge'
                                                    ? '🍸'
                                                    : atm === 'Sports Bar'
                                                        ? '⚽'
                                                        : atm === 'Rooftop Bar'
                                                            ? '🌆'
                                                            : atm === 'Wine Bar'
                                                                ? '🍷'
                                                                : atm === 'Brewery'
                                                                    ? '🍺'
                                                                    : atm === 'Dance Club'
                                                                        ? '💃'
                                                                        : atm === 'Live Music'
                                                                            ? '🎵'
                                                                            : '🤫'}
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
                                Budget Preference
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
                                Special Preferences
                            </Label>
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