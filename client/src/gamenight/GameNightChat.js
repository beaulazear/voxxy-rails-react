import React, { useState, useContext } from 'react';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Users, Calendar, Clock, MessageSquare, Edit3, Home } from 'lucide-react';
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
    Label,
    Input,
    GroupSizeContainer,
    GroupSizeCard,
    GroupIcon,
    GroupLabel,
    GroupSubtitle,
    TimeCardContainer,
    TimeCard,
    ToggleWrapper,
    ToggleCircle,
    CheckboxLabel,
    Textarea,
    ButtonRow,
    Button,
    DateTimeGrid,
    FormGroup
} from '../styles/FormStyles';

function GameNightChat({ onClose }) {
    const { user, setUser } = useContext(UserContext);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const percent = (step / totalSteps) * 100;

    const [eventName, setEventName] = useState('');
    const [location, setLocation] = useState('');

    const [groupSize, setGroupSize] = useState('');

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [skipDateTime, setSkipDateTime] = useState(false);
    const [timeOfDay, setTimeOfDay] = useState('');

    const [welcomeMessage, setWelcomeMessage] = useState('');

    const [allowParticipantTimeSelection, setAllowParticipantTimeSelection] = useState(false);

    const headers = [
        {
            title: 'Game Night Details',
            subtitle: 'What\'s the name and where will you host?',
        },
        {
            title: 'How large is your group?',
            subtitle: 'Select one option.',
        },
        {
            title: 'When will it happen?',
            subtitle: 'Pick a date & time, or choose a time-of-day.',
        },
        {
            title: 'Welcome Message',
            subtitle: 'Leave a detailed message for your group about the game night!',
        },
    ];
    const { title, subtitle } = headers[step - 1];

    const groupSizeOptions = [
        {
            value: '2-3',
            icon: '🎯',
            label: 'Small Group',
            subtitle: '2-3 people'
        },
        {
            value: '4-6',
            icon: '🎲',
            label: 'Perfect Size',
            subtitle: '4-6 people'
        },
        {
            value: '7-10',
            icon: '🃏',
            label: 'Big Group',
            subtitle: '7-10 people'
        },
        {
            value: '10+',
            icon: '🎊',
            label: 'Party Night',
            subtitle: '10+ people'
        }
    ];

    const isNextDisabled = () => {
        if (step === 1) return !eventName.trim() || !location.trim();
        if (step === 2) return !groupSize;
        if (step === 3) {
            if (allowParticipantTimeSelection) return false;
            if (skipDateTime) return !timeOfDay;
            if (!date || !time) return true;
            const selected = new Date(`${date}T${time}`);
            return !(selected > new Date());
        }
        if (step === 4) return !welcomeMessage.trim();
        return false;
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const computeDateNotes = () => {
        if (skipDateTime) {
            return 'evening game night';
        }
        const [hourStr] = time.split(':');
        const hour = parseInt(hourStr, 10);
        if (hour >= 5 && hour < 12) {
            return 'morning game session';
        }
        if (hour >= 12 && hour < 17) {
            return 'afternoon gaming';
        }
        if (hour >= 17 && hour < 21) {
            return 'evening game night';
        }
        return 'late night gaming';
    };

    const handleSubmit = async () => {
        const date_notes = allowParticipantTimeSelection ? 'TBD' : computeDateNotes();

        const payload = {
            activity_type: 'Game Night',
            emoji: '🎮',
            activity_location: location.trim(),
            radius: 0,
            group_size: groupSize,
            date_day: skipDateTime ? null : date,
            date_time: skipDateTime ? null : time,
            activity_name: eventName.trim(),
            welcome_message: welcomeMessage.trim(),
            allow_participant_time_selection: allowParticipantTimeSelection,
            date_notes,
            participants: [],
            collecting: true
        };

        try {
            const res = await fetch(`${API_URL}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ activity: payload }),
            });
            if (!res.ok) throw new Error('Save failed');
            const data = await res.json();

            if (process.env.NODE_ENV === 'production') {
                mixpanel.track('Game Night Chat Completed', { user: user.id });
            }

            setUser((prev) => ({
                ...prev,
                activities: [
                    ...(prev.activities || []),
                    { ...data, user: prev, responses: [] },
                ],
            }));

            onClose(data.id);
        } catch (err) {
            console.error(err);
            alert('Oops, something went wrong.');
        }
    };

    return (
        <Overlay onClick={() => onClose(null)}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ProgressBarContainer>
                    <ProgressBar $percent={percent} />
                </ProgressBarContainer>

                <StepLabel>
                    Step {step} of {totalSteps}
                </StepLabel>

                <ModalHeader>
                    <Title>{title}</Title>
                    <Subtitle>{subtitle}</Subtitle>
                </ModalHeader>

                <StepContent>
                    {step === 1 && (
                        <>
                            <Section>
                                <Label htmlFor="name">
                                    <Edit3 size={16} />
                                    Event Name
                                </Label>
                                <Input
                                    id="name"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g. Friday Night Board Games"
                                />
                            </Section>

                            <Section>
                                <Label htmlFor="location">
                                    <Home size={16} />
                                    Game Night Location
                                </Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. My place, Sarah's apartment, The game cafe..."
                                />
                            </Section>
                        </>
                    )}

                    {step === 2 && (
                        <Section>
                            <Label>
                                <Users size={16} />
                                Choose Group Size
                            </Label>
                            <GroupSizeContainer>
                                {groupSizeOptions.map((option) => (
                                    <GroupSizeCard
                                        key={option.value}
                                        selected={groupSize === option.value}
                                        onClick={() => setGroupSize(option.value)}
                                    >
                                        <GroupIcon>{option.icon}</GroupIcon>
                                        <GroupLabel>{option.label}</GroupLabel>
                                        <GroupSubtitle>{option.subtitle}</GroupSubtitle>
                                    </GroupSizeCard>
                                ))}
                            </GroupSizeContainer>
                        </Section>
                    )}

                    {step === 3 && (
                        <Section>
                            {/* <CheckboxLabel onClick={() => setAllowParticipantTimeSelection(!allowParticipantTimeSelection)}>
                                <ToggleWrapper checked={allowParticipantTimeSelection}>
                                    <ToggleCircle checked={allowParticipantTimeSelection} />
                                </ToggleWrapper>
                                Let participants vote on their preferred times
                            </CheckboxLabel> */}

                            {!allowParticipantTimeSelection && !skipDateTime && (
                                <DateTimeGrid style={{ marginTop: '1rem' }}>
                                    <FormGroup>
                                        <Label htmlFor="date">
                                            <Calendar size={16} />
                                            Event Date
                                        </Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            disabled={skipDateTime}
                                        />
                                    </FormGroup>

                                    <FormGroup>
                                        <Label htmlFor="time">
                                            <Clock size={16} />
                                            Event Time
                                        </Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            disabled={skipDateTime}
                                        />
                                    </FormGroup>
                                </DateTimeGrid>
                            )}

                            {!allowParticipantTimeSelection && skipDateTime && (
                                <div style={{ marginTop: '1rem' }}>
                                    <Label>
                                        <Clock size={16} />
                                        Choose Time of Day
                                    </Label>
                                    <TimeCardContainer>
                                        <TimeCard
                                            selected={timeOfDay === 'morning game session'}
                                            onClick={() => setTimeOfDay('morning game session')}
                                        >
                                            Morning Session ☀️
                                        </TimeCard>
                                        <TimeCard
                                            selected={timeOfDay === 'afternoon gaming'}
                                            onClick={() => setTimeOfDay('afternoon gaming')}
                                        >
                                            Afternoon Gaming 🌤️
                                        </TimeCard>
                                        <TimeCard
                                            selected={timeOfDay === 'evening game night'}
                                            onClick={() => setTimeOfDay('evening game night')}
                                        >
                                            Evening Game Night 🌙
                                        </TimeCard>
                                        <TimeCard
                                            selected={timeOfDay === 'late night gaming'}
                                            onClick={() => setTimeOfDay('late night gaming')}
                                        >
                                            Late Night Gaming 🌃
                                        </TimeCard>
                                    </TimeCardContainer>
                                </div>
                            )}

                            {!allowParticipantTimeSelection && (
                                <CheckboxLabel onClick={() => setSkipDateTime(!skipDateTime)} style={{ marginTop: '1rem' }}>
                                    <ToggleWrapper checked={skipDateTime}>
                                        <ToggleCircle checked={skipDateTime} />
                                    </ToggleWrapper>
                                    I'll select time &amp; date later
                                </CheckboxLabel>
                            )}

                            {allowParticipantTimeSelection && (
                                <div style={{
                                    background: 'rgba(204, 49, 232, 0.1)',
                                    border: '1px solid rgba(204, 49, 232, 0.3)',
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    color: '#ddd',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                    marginTop: '1rem'
                                }}>
                                    🗳️ Participants will submit their preferred times along with game preferences. You can finalize the time during the voting phase.
                                </div>
                            )}
                        </Section>
                    )}

                    {step === 4 && (
                        <Section>
                            <Label htmlFor="welcome">
                                <MessageSquare size={16} />
                                Welcome Message
                            </Label>
                            <Textarea
                                id="welcome"
                                rows={3}
                                value={welcomeMessage}
                                onChange={(e) => setWelcomeMessage(e.target.value)}
                                placeholder="Tell your group about the game night! What games will you play? Should they bring anything? Any house rules?"
                            />
                        </Section>
                    )}
                </StepContent>

                <ButtonRow>
                    {step > 1 ? (
                        <Button onClick={() => setStep(step - 1)}>
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    <Button
                        $primary
                        onClick={handleNext}
                        disabled={isNextDisabled()}
                    >
                        {step < totalSteps ? 'Next' : 'Finish'}
                    </Button>
                </ButtonRow>
            </ModalContainer>
        </Overlay>
    );
}

export default GameNightChat;