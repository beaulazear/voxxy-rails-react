// RestaurantChat.js
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
  color: #eee;
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
  &::placeholder { color: #777; }
  &:focus { border-color: #6c63ff; outline: none; }
`;

const UseLocationButton = styled.button`
  background: transparent;
  border: none;
  color: #cc31e8;
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.6rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eee;
  margin-bottom: 1rem;
  &::placeholder { color: #777; }
  &:focus { border-color: #6c63ff; outline: none; }
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
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function RestaurantChat({ onClose }) {
  const { user, setUser } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const percent = (step / totalSteps) * 100;

  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLocationUsed, setCurrentLocationUsed] = useState(false);

  const [outingType, setOutingType] = useState('');
  const [eventName, setEventName] = useState('');
  const [participantsInput, setParticipantsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headers = [
    { title: 'Where to meet?', subtitle: 'City or neighborhood (or use current).' },
    { title: 'What’s the occasion?', subtitle: 'Brunch, dinner, cocktails…' },
    { title: 'Name your event', subtitle: 'Give it a fun title.' },
    { title: 'Invite people', subtitle: 'Enter emails, comma‑separated.' },
  ];
  const { title, subtitle } = headers[step - 1];

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoords({ lat: coords.latitude, lng: coords.longitude });
        setCurrentLocationUsed(true);
        setLocation('')
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        alert('Failed to get location.');
        setIsLocating(false);
      }
    );
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const participantEmails = participantsInput
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    const payload = {
      activity_type: 'Restaurant',
      emoji: '🍜',
      activity_location: currentLocationUsed
        ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
        : location,
      date_notes: outingType,
      activity_name: eventName,
      participants: participantEmails,
      group_size: participantEmails.length + 1,
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

      mixpanel.track('Restaurant Chat Completed', { user: user.id });

      setUser(prev => ({
        ...prev,
        activities: [...(prev.activities || []), { ...data, user: prev, responses: [] }],
      }));

      onClose(data.id);
    } catch (err) {
      console.error(err);
      alert('Oops, something went wrong.');
      setSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !location.trim() && !currentLocationUsed;
    if (step === 2) return !outingType.trim();
    if (step === 3) return !eventName.trim();
    return false; // invite is optional
  };

  return (
    <>
      <Overlay onClick={() => onClose(null)} />
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ProgressBarContainer>
          <ProgressBar $percent={percent} />
        </ProgressBarContainer>

        <StepLabel>Step {step} of {totalSteps}</StepLabel>

        <ModalHeader>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </ModalHeader>

        <StepContent>
          {step === 1 && (
            <>
              <Label htmlFor="location">Meeting Location</Label>
              <Input
                id="location"
                value={location}
                onChange={e => {
                  setLocation(e.target.value);
                  setCurrentLocationUsed(false);
                }}
                placeholder={currentLocationUsed ? 'Using current location' : 'e.g. San Francisco, CA'}
              />
              <UseLocationButton
                onClick={useCurrentLocation}
                disabled={isLocating || currentLocationUsed}
              >
                {currentLocationUsed
                  ? 'Using current location'
                  : isLocating
                    ? 'Locating…'
                    : 'Use my current location'}
              </UseLocationButton>
            </>
          )}

          {step === 2 && (
            <>
              <Label htmlFor="outing">Occasion / Type</Label>
              <Input
                id="outing"
                value={outingType}
                onChange={e => setOutingType(e.target.value)}
                placeholder="e.g. Dinner, Happy Hour"
              />
            </>
          )}

          {step === 3 && (
            <>
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="e.g. Friday Feast"
              />
            </>
          )}

          {step === 4 && (
            <>
              <Label htmlFor="invite">Invite via Email</Label>
              <Textarea
                id="invite"
                rows={2}
                value={participantsInput}
                onChange={e => setParticipantsInput(e.target.value)}
                placeholder="Separate multiple emails with commas"
              />
              <small style={{ color: '#777' }}>
                You can skip and invite later.
              </small>
            </>
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
            disabled={submitting || isNextDisabled()}
          >
            {step < totalSteps
              ? 'Next'
              : (submitting ? 'Saving…' : 'Finish')}
          </Button>
        </ButtonRow>
      </ModalContainer>
    </>
  );
}