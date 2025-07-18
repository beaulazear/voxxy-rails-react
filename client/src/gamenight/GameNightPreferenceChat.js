import React, { useState, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Gamepad2, Calendar, Send, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
    Textarea,
    Input as BaseInput,
    FormGroup,
    DateTimeGrid,
    AddTimeButton,
    AvailabilitySection,
    TimeSlotsList,
    TimeSlot,
    RemoveTimeButton,
    ButtonRow,
    Button
} from '../styles/FormStyles';

// Override Input to remove margin-bottom for date/time inputs
const Input = styled(BaseInput)`
  margin-bottom: 0;
`;

export default function GameNightPreferenceChat({
    activityId,
    onClose,
    onChatComplete,
    guestMode = false,
    guestToken = null,
    guestEmail = null,
    guestActivity
}) {
    const { user, setUser } = useContext(UserContext);
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state for new questions
    const [gameTypes, setGameTypes] = useState([]);
    const [vibe, setVibe] = useState('');
    const [skillLevel, setSkillLevel] = useState('');
    const [gamePreferences, setGamePreferences] = useState('');
    const [ownedGames, setOwnedGames] = useState('');

    // Availability state
    const [availability, setAvailability] = useState({});
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const [activity, setActivity] = useState(null);
    const stepContentRef = useRef(null);

    useEffect(() => {
        fetch(`${API_URL}/activities/${activityId}`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => setActivity(data))
            .catch(err => console.error('Error fetching activity:', err));
    }, [activityId, API_URL]);

    // Scroll to top when step changes
    useEffect(() => {
        if (stepContentRef.current) {
            stepContentRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [currentStep]);

    const stepTitles = [
        "What types of games do you enjoy playing with friends?",
        "What's your ideal vibe for the night?",
        "What's your skill level with games?",
        "Are there any games you'd love to play (or avoid)?",
        "Got any games you could bring or already love playing?"
    ];

    if (activity?.allow_participant_time_selection) {
        stepTitles.push("Your availability");
    }

    const totalSteps = stepTitles.length;

    const handleGameTypeSelect = (gameType) => {
        const openToAnything = "I'm open to anything!";

        if (gameType === openToAnything) {
            // If selecting "open to anything", clear all other selections
            setGameTypes([openToAnything]);
        } else {
            // If selecting any other option, remove "open to anything" if it's selected
            let newGameTypes = gameTypes.includes(gameType)
                ? gameTypes.filter(item => item !== gameType)
                : [...gameTypes, gameType];

            // Remove "open to anything" from the array if present
            newGameTypes = newGameTypes.filter(item => item !== openToAnything);

            setGameTypes(newGameTypes);
        }
    };

    const addTimeSlot = () => {
        if (!currentDate || !currentTime) return;

        const dateKey = currentDate;
        const timeValue = currentTime;

        setAvailability(prev => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), timeValue]
        }));

        setCurrentDate('');
        setCurrentTime('');
    };

    const removeTimeSlot = (date, timeToRemove) => {
        setAvailability(prev => {
            const newAvailability = { ...prev };
            newAvailability[date] = newAvailability[date].filter(time => time !== timeToRemove);

            if (newAvailability[date].length === 0) {
                delete newAvailability[date];
            }

            return newAvailability;
        });
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1: return gameTypes.length > 0;
            case 2: return vibe !== '';
            case 3: return skillLevel !== '';
            case 4: return true; // Optional
            case 5: return true; // Optional
            case 6: return !activity?.allow_participant_time_selection || Object.keys(availability).length > 0;
            default: return true;
        }
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        // Compile all preferences into notes
        const notes = `Game Night Preferences:

Game Types: ${gameTypes.join(', ')}
Ideal Vibe: ${vibe}
Skill Level: ${skillLevel}
${gamePreferences ? `Game Preferences: ${gamePreferences}` : ''}
${ownedGames ? `Games I Could Bring: ${ownedGames}` : ''}`.trim();

        if (process.env.NODE_ENV === 'production' && !guestMode) {
            mixpanel.track('Game Night Preferences Submitted', {
                user: user.id,
                activityId: activityId,
                gameTypes: gameTypes,
                vibe: vibe,
                skillLevel: skillLevel
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

            const response = await fetch(endpoint, requestOptions);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to save response:', errorData);
                setError('Failed to submit preferences. Please try again.');
                return;
            }

            const data = await response.json();

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
            console.error('Error submitting preferences:', error);
            setError('Failed to submit preferences. Please try again.');
        } finally {
            setSubmitting(false);
        }

        onClose();
    };

    const percent = (currentStep / totalSteps) * 100;

    return (
        <Overlay onClick={() => onClose()}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ProgressBarContainer>
                    <ProgressBar $percent={percent} />
                </ProgressBarContainer>

                <StepLabel>
                    Step {currentStep} of {totalSteps}
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
                        <Gamepad2 />
                        {stepTitles[currentStep - 1]}
                    </Title>
                    <CloseButton onClick={() => onClose()}>
                        <X size={20} />
                    </CloseButton>
                </ModalHeader>

                <StepContent ref={stepContentRef}>
                    {currentStep === 1 && (
                        <Section>
                            <SectionDescription>Pick as many as you like — we'll use this to narrow it down.</SectionDescription>
                            <MultiSelectGrid>
                                {[
                                    'Trivia or quiz games',
                                    'Word or party games',
                                    'Strategy or logic games',
                                    'Fast-paced games',
                                    'Cooperative games',
                                    'Silly or improv games',
                                    "I'm open to anything!"
                                ].map(gameType => (
                                    <MultiSelectCard
                                        key={gameType}
                                        $selected={gameTypes.includes(gameType)}
                                        onClick={() => handleGameTypeSelect(gameType)}
                                    >
                                        {gameType}
                                    </MultiSelectCard>
                                ))}
                            </MultiSelectGrid>
                        </Section>
                    )}

                    {currentStep === 2 && (
                        <Section>
                            <SectionDescription>Your answer helps us match the energy to the game.</SectionDescription>
                            <OptionsGrid>
                                {[
                                    'Chill & relaxed',
                                    'Lightly competitive',
                                    'Very competitive — I came to win',
                                    'Loud & chaotic fun',
                                    'Anything goes — surprise me'
                                ].map(vibeOption => (
                                    <OptionCard
                                        key={vibeOption}
                                        $selected={vibe === vibeOption}
                                        onClick={() => setVibe(vibeOption)}
                                    >
                                        {vibeOption}
                                    </OptionCard>
                                ))}
                            </OptionsGrid>
                        </Section>
                    )}

                    {currentStep === 3 && (
                        <Section>
                            <SectionDescription>No judgment here, just helps the host pick something everyone enjoys.</SectionDescription>
                            <OptionsGrid>
                                {[
                                    "I'm new to most games",
                                    'I know a few popular ones',
                                    'I play regularly',
                                    "I'm a game night pro"
                                ].map(skill => (
                                    <OptionCard
                                        key={skill}
                                        $selected={skillLevel === skill}
                                        onClick={() => setSkillLevel(skill)}
                                    >
                                        {skill}
                                    </OptionCard>
                                ))}
                            </OptionsGrid>
                        </Section>
                    )}

                    {currentStep === 4 && (
                        <Section>
                            <SectionDescription>Drop a fave or let us know if something's not your jam.</SectionDescription>
                            <Textarea
                                value={gamePreferences}
                                onChange={(e) => setGamePreferences(e.target.value)}
                                placeholder='e.g., "Please no Cards Against Humanity" or "Would love to try Codenames"'
                            />
                        </Section>
                    )}

                    {currentStep === 5 && (
                        <Section>
                            <SectionDescription>Totally optional — if you have a favorite game or one you could bring, let the host know!</SectionDescription>
                            <Textarea
                                value={ownedGames}
                                onChange={(e) => setOwnedGames(e.target.value)}
                                placeholder="e.g. Exploding Kittens, Mario Kart, Codenames…"
                            />
                        </Section>
                    )}

                    {currentStep === 6 && activity?.allow_participant_time_selection && (
                        <Section>
                            <SectionTitle><Calendar size={20} />Your Availability</SectionTitle>
                            <SectionDescription>When are you available for this game night?</SectionDescription>

                            <DateTimeGrid>
                                <FormGroup>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem' }}>Date</label>
                                    <Input
                                        type="date"
                                        value={currentDate}
                                        onChange={(e) => setCurrentDate(e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem' }}>Time</label>
                                    <Input
                                        type="time"
                                        value={currentTime}
                                        onChange={(e) => setCurrentTime(e.target.value)}
                                    />
                                </FormGroup>
                            </DateTimeGrid>

                            <AddTimeButton
                                onClick={addTimeSlot}
                                disabled={!currentDate || !currentTime}
                            >
                                Add Time Slot
                            </AddTimeButton>

                            {Object.keys(availability).length > 0 && (
                                <AvailabilitySection>
                                    <h4 style={{ color: '#fff', margin: '1rem 0 0.5rem 0', fontSize: '0.9rem' }}>
                                        Your Availability:
                                    </h4>
                                    <TimeSlotsList>
                                        {Object.entries(availability).map(([date, times]) =>
                                            times.map((time, index) => (
                                                <TimeSlot key={`${date}-${time}-${index}`}>
                                                    {new Date(date).toLocaleDateString()} at {time}
                                                    <RemoveTimeButton
                                                        onClick={() => removeTimeSlot(date, time)}
                                                        title="Remove this time slot"
                                                    >
                                                        ×
                                                    </RemoveTimeButton>
                                                </TimeSlot>
                                            ))
                                        )}
                                    </TimeSlotsList>
                                </AvailabilitySection>
                            )}
                        </Section>
                    )}
                </StepContent>

                <ButtonRow>
                    {currentStep > 1 ? (
                        <Button onClick={() => setCurrentStep(currentStep - 1)}>
                            <ChevronLeft size={16} />
                            Back
                        </Button>
                    ) : (
                        <Button onClick={() => onClose()}>
                            Cancel
                        </Button>
                    )}

                    <Button
                        $primary
                        onClick={handleNext}
                        disabled={!isStepValid() || submitting}
                    >
                        {currentStep === totalSteps ? (
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