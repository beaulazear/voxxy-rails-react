// LetsMeetFormModal.js
import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 998;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 90%; max-width: 500px;
  background: #2C1E33;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ProgressBarContainer = styled.div`
  height: 6px;
  background: #221825;
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

const StepContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  color: #eee;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  color: #ddd;
  text-align: left;
  margin-top: 1.2rem; 
  &:first-child {
    margin-top: 0; // No extra space before the first label
  }
`;

const Input = styled.input`
  width: 96%;
  padding: 0.6rem;
  background: #221825;
  border: 1px solid #453050;
  border-radius: 6px;
  color: #eee;
  margin-bottom: 1.2rem;
  &::placeholder { color: #777; }
  &:focus {
    border-color: #cc31e8;
    outline: none;
    box-shadow: 0 0 0 3px rgba(204, 49, 232, 0.5); // Outer glow
  }
`;
const Textarea = styled.textarea`
  width: 98%;
  padding: 0.4rem;
  background: #221825;
  border: 1px solid #453050;
  border-radius: 6px;
  color: #eee;
  margin-bottom: 1.2rem;
  &::placeholder { color: #777; }
  &:focus {
    border-color: #cc31e8;
    outline: none;
    box-shadow: 0 0 0 3px rgba(204, 49, 232, 0.5); // Outer glow
  }
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;
const Tab = styled.button`
  flex: 1;
  padding: 0.5rem;
  background: ${({ $active }) => ($active ? "#cc31e8" : "#221825")};
  color: ${({ $active }) => ($active ? "white" : "#ccc")};
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  &:not(:last-child) { margin-right: 4px; }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
`;

const Button = styled.button`
  background: ${({ $primary }) => ($primary ? '#cc31e8' : 'transparent')};
  color: ${({ $primary }) => ($primary ? 'white' : '#ffffff')};
  border: ${({ $primary }) => ($primary ? 'none' : '.2px solid #ffffff')};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ModalHeader = styled.div`
  padding: 0 1.5rem 1rem;
  text-align: left;
`;
const Title = styled.h2`
  color: #fff;
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  text-align: left;
`;
const Subtitle = styled.p`
  color: #a7a1a8;
  margin: 0;
  font-size: 0.8rem;
  text-align: left;
`;

export default function LetsMeetFormModal({ onClose }) {
    const { user, setUser } = useContext(UserContext);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const [step, setStep] = useState(1);
    const [activityName, setActivityName] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [tab, setTab] = useState('single');
    const [singleDate, setSingleDate] = useState('');
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');
    const [participantsInput, setParticipantsInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const totalSteps = 3;
    const percent = (step / totalSteps) * 100;

    const headers = [
        { title: "Tell us about your meeting", subtitle: "Basic information to help coordinate with your group." },
        { title: "Choose your preferred dates", subtitle: "Select when you'd like to meet with your group." },
        { title: "Invite people", subtitle: "Invite others to find a time that works for everyone. (optional)" },
    ];
    const { title, subtitle } = headers[step - 1];

    const dateNotes = () => {
        if (tab === 'single') return singleDate;
        if (tab === 'range') return `${rangeStart} to ${rangeEnd}`;
        return 'open';
    };

    const participantEmails = participantsInput
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

    const handleNext = () => {
        if (step < 3) return setStep(step + 1);
        handleSubmit();
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        const basePayload = {
            activity_type: 'Meeting',
            activity_location: 'TBD',
            activity_name: activityName,
            welcome_message: welcomeMessage,
            date_notes: dateNotes(),
            participants: participantEmails,
            group_size: participantEmails.length + 1,
            emoji: '👥',
        };

        const payload = {
            ...basePayload,
            ...(tab === 'single' && { date_day: singleDate }),
        };

        try {
            const res = await fetch(`${API_URL}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ activity: payload }),
            });
            if (!res.ok) throw new Error('Failed to save');
            const data = await res.json();
            mixpanel.track('Lets Meet Form Completed', { user: user.id });
            setUser(prev => ({
                ...prev,
                activities: [...(prev.activities || []), { ...data, user: prev, responses: [] }]
            }));
            onClose(data.id);
        } catch (err) {
            console.error(err);
            alert('Oops, something went wrong.');
            setSubmitting(false);
        }
    };

    return (
        <>
            <Overlay onClick={() => onClose()} />
            <ModalContainer onClick={e => e.stopPropagation()}>
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
                            <Label htmlFor="name">Meeting Name</Label>
                            <Input
                                id="name"
                                value={activityName}
                                onChange={e => setActivityName(e.target.value)}
                                placeholder="e.g. Team Sync"
                            />
                            <Label htmlFor="purpose">Purpose / Description</Label>
                            <Textarea
                                id="purpose"
                                rows={3}
                                value={welcomeMessage}
                                onChange={e => setWelcomeMessage(e.target.value)}
                                placeholder="A quick blurb so everyone knows why we're meeting..."
                            />
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Tabs>
                                <Tab $active={tab === 'single'} onClick={() => setTab('single')}>Single Date</Tab>
                                <Tab $active={tab === 'range'} onClick={() => setTab('range')}>Date Range</Tab>
                                <Tab $active={tab === 'open'} onClick={() => setTab('open')}>Open Dates</Tab>
                            </Tabs>
                            {tab === 'single' && (
                                <>
                                    <Label>Select Date</Label>
                                    <Input
                                        type="date"
                                        value={singleDate}
                                        onChange={e => setSingleDate(e.target.value)}
                                    />
                                </>
                            )}
                            {tab === 'range' && (
                                <>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={rangeStart}
                                        onChange={e => setRangeStart(e.target.value)}
                                    />
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={rangeEnd}
                                        onChange={e => setRangeEnd(e.target.value)}
                                    />
                                </>
                            )}
                            {tab === 'open' && (
                                <p>Everyone can suggest their own times. You’ll finalize later.</p>
                            )}
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <Label>Invite via Email (optional)</Label>
                            <Textarea
                                rows={2}
                                value={participantsInput}
                                onChange={e => setParticipantsInput(e.target.value)}
                                placeholder="Separate multiple emails with commas"
                            />
                            <small>You can skip and invite later on your board.</small>
                        </>
                    )}
                </StepContent>

                <ButtonRow>
                    {step > 1 ? (
                        <Button onClick={() => setStep(step - 1)} disabled={submitting}>Back</Button>
                    ) : <div />}
                    <Button
                        $primary
                        onClick={handleNext}
                        disabled={
                            submitting ||
                            (step === 1 && (!activityName.trim() || !welcomeMessage.trim())) ||
                            (step === 2 && tab === 'single' && !singleDate) ||
                            (step === 2 && tab === 'range' && (!rangeStart || !rangeEnd))
                        }
                    >
                        {step < 3 ? 'Next' : (submitting ? 'Saving...' : 'Finish')}
                    </Button>
                </ButtonRow>
            </ModalContainer>
        </>
    );
}
