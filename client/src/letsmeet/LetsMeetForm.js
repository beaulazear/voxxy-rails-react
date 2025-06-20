// LetsMeetFormModal.js
import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Calendar, MessageSquare, Edit3 } from 'lucide-react';

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

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
      : 'transparent'
  };
  color: ${({ $active }) => ($active ? 'white' : '#ccc')};
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
      : 'rgba(255, 255, 255, 0.08)'
  };
    transform: translateY(-1px);
    box-shadow: ${({ $active }) =>
    $active
      ? '0 4px 12px rgba(204, 49, 232, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)'
  };
  }
`;

const OpenDatesMessage = styled.div`
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  color: #ddd;
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: center;
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

const DateGrid = styled.div`
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
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 2;
  const percent = (step / totalSteps) * 100;

  const headers = [
    { title: "Tell us about your meeting", subtitle: "Basic information to help coordinate with your group." },
    { title: "Choose your preferred dates", subtitle: "Select when you'd like to meet with your group." },
  ];
  const { title, subtitle } = headers[step - 1];

  const dateNotes = () => {
    if (tab === 'single') return singleDate;
    if (tab === 'range') return `${rangeStart} to ${rangeEnd}`;
    return 'open';
  };

  const handleNext = () => {
    if (step < 2) return setStep(step + 1);
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
      participants: [],
      group_size: 1,
      emoji: '👥',
      collecting: true
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
    <Overlay onClick={() => onClose(null)}>
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
              <Section>
                <Label htmlFor="name">
                  <Edit3 size={16} />
                  Meeting Name
                </Label>
                <Input
                  id="name"
                  value={activityName}
                  onChange={e => setActivityName(e.target.value)}
                  placeholder="e.g. Team Sync"
                />
              </Section>

              <Section>
                <Label htmlFor="purpose">
                  <MessageSquare size={16} />
                  Purpose / Description
                </Label>
                <Textarea
                  id="purpose"
                  rows={3}
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  placeholder="A quick blurb so everyone knows why we're meeting..."
                />
              </Section>
            </>
          )}

          {step === 2 && (
            <Section>
              <Tabs>
                <Tab $active={tab === 'single'} onClick={() => setTab('single')}>
                  Single Date
                </Tab>
                <Tab $active={tab === 'range'} onClick={() => setTab('range')}>
                  Date Range
                </Tab>
                <Tab $active={tab === 'open'} onClick={() => setTab('open')}>
                  Open Dates
                </Tab>
              </Tabs>

              {tab === 'single' && (
                <FormGroup>
                  <Label>
                    <Calendar size={16} />
                    Select Date
                  </Label>
                  <Input
                    type="date"
                    value={singleDate}
                    onChange={e => setSingleDate(e.target.value)}
                  />
                </FormGroup>
              )}

              {tab === 'range' && (
                <DateGrid>
                  <FormGroup>
                    <Label>
                      <Calendar size={16} />
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      value={rangeStart}
                      onChange={e => setRangeStart(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>
                      <Calendar size={16} />
                      End Date
                    </Label>
                    <Input
                      type="date"
                      value={rangeEnd}
                      onChange={e => setRangeEnd(e.target.value)}
                    />
                  </FormGroup>
                </DateGrid>
              )}

              {tab === 'open' && (
                <OpenDatesMessage>
                  Everyone can suggest their own times. You'll finalize later.
                </OpenDatesMessage>
              )}
            </Section>
          )}
        </StepContent>

        <ButtonRow>
          {step > 1 ? (
            <Button onClick={() => setStep(step - 1)} disabled={submitting}>
              Back
            </Button>
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
            {step < 2 ? 'Next' : (submitting ? 'Saving...' : 'Finish')}
          </Button>
        </ButtonRow>
      </ModalContainer>
    </Overlay>
  );
}