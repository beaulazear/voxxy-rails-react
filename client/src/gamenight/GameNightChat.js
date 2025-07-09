import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Users, Calendar, Clock, MessageSquare, Edit3, Home } from 'lucide-react';

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

const GroupSizeContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const GroupSizeCard = styled.div`
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

const GroupIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`;

const GroupLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
`;

const GroupSubtitle = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
`;

const TimeCardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const TimeCard = styled.div`
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

const ToggleWrapper = styled.div`
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

const ToggleCircle = styled.div`
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

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
  gap: 0.75rem;
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

const DateTimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

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
                            <CheckboxLabel onClick={() => setAllowParticipantTimeSelection(!allowParticipantTimeSelection)}>
                                <ToggleWrapper checked={allowParticipantTimeSelection}>
                                    <ToggleCircle checked={allowParticipantTimeSelection} />
                                </ToggleWrapper>
                                Let participants vote on their preferred times
                            </CheckboxLabel>

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