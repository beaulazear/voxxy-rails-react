// RestaurantChat.js
import React, { useState, useContext } from 'react';
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
  top: 50%;
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
  &::placeholder {
    color: #777;
  }
  &:focus {
    border-color: #6c63ff;
    outline: none;
  }
`;

const Range = styled.input.attrs({ type: 'range', min: 1, max: 50 })`
  width: 100%;
  margin: 0.5rem 0 1rem;
`;

const RadioCardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const RadioCard = styled.div`
  flex: 1 1 45%;
  padding: 1rem 0;
  text-align: center;
  border-radius: 8px;
  background: ${({ selected }) => (selected ? '#cc31e8' : '#2a2a2a')};
  color: ${({ selected }) => (selected ? '#fff' : '#ddd')};
  border: ${({ selected }) => (selected ? 'none' : '1px solid #444')};
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  &:hover {
    background: ${({ selected }) => (selected ? '#bb2fd0' : '#333')};
  }
`;

const TimeCardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TimeCard = styled.div`
  flex: 1 1 45%;
  padding: 1rem 0;
  text-align: center;
  border-radius: 8px;
  background: ${({ selected }) => (selected ? '#cc31e8' : '#2a2a2a')};
  color: ${({ selected }) => (selected ? '#fff' : '#ddd')};
  border: ${({ selected }) => (selected ? 'none' : '1px solid #444')};
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  &:hover {
    background: ${({ selected }) => (selected ? '#bb2fd0' : '#333')};
  }
`;

const ToggleWrapper = styled.div`
  display: inline-block;
  position: relative;
  width: 50px;
  height: 24px;
  background: ${({ checked }) => (checked ? '#cc31e8' : '#444')};
  border-radius: 12px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s ease;
`;

const ToggleCircle = styled.div`
  position: absolute;
  top: 2px;
  left: ${({ checked }) => (checked ? '26px' : '2px')};
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: left 0.2s ease;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #ddd;
  cursor: pointer;
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

export default function RestaurantChat({ onClose }) {
  const { user, setUser } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const percent = (step / totalSteps) * 100;

  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLocationUsed, setCurrentLocationUsed] = useState(false);
  const [radius, setRadius] = useState(10);

  const [groupSize, setGroupSize] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [skipDateTime, setSkipDateTime] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');

  const [eventName, setEventName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const [participantsInput, setParticipantsInput] = useState('');

  const headers = [
    {
      title: 'Where to meet?',
      subtitle: 'City/neighborhood or use current, then choose radius.',
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
      title: 'Name & Message',
      subtitle: 'Give your event a title and leave a detailed message for your group explaining the activity!',
    },
    {
      title: 'Invite people',
      subtitle: 'Enter their emails (comma‑separated) or skip.',
    },
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
        setCoords({
          lat: coords.latitude,
          lng: coords.longitude,
        });
        setCurrentLocationUsed(true);
        setLocation('');
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        alert('Failed to get location.');
        setIsLocating(false);
      }
    );
  };

  const isNextDisabled = () => {
    if (step === 1) return !location.trim() && !currentLocationUsed;
    if (step === 2) return !groupSize;
    if (step === 3) {
      if (skipDateTime) return !timeOfDay;
      if (!date || !time) return true;
      const selected = new Date(`${date}T${time}`);
      return !(selected > new Date());
    }
    if (step === 4) return !eventName.trim();
    // Step 5 (invite) always optional → false
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
    // If skipped date/time, use timeOfDay directly
    if (skipDateTime) {
      return timeOfDay;
    }
    // Otherwise infer from numeric time
    const [hourStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    if (hour >= 5 && hour < 10) {
      return 'breakfast';
    }
    if (hour >= 10 && hour < 12) {
      return 'brunch';
    }
    if (hour >= 12 && hour < 16) {
      return 'lunch';
    }
    if (hour >= 16 && hour < 22) {
      return 'dinner';
    }
    // Covers 22–24 and 0–4
    return 'late night cocktails';
  };

  const handleSubmit = async () => {
    const participantEmails = participantsInput
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const date_notes = computeDateNotes();

    const payload = {
      activity_type: 'Restaurant',
      emoji: '🍜',
      activity_location: currentLocationUsed
        ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
        : location.trim(),
      radius,
      group_size: groupSize,
      date_day: skipDateTime ? null : date,
      date_time: skipDateTime ? null : time,
      activity_name: eventName.trim(),
      welcome_message: welcomeMessage.trim(),
      date_notes,
      participants: participantEmails,
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

      mixpanel.track('Restaurant Chat Completed', { user: user.id });

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
    <>
      <Overlay onClick={() => onClose(null)} />
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
              <Label htmlFor="location">Meeting Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentLocationUsed(false);
                }}
                placeholder={
                  currentLocationUsed
                    ? 'Using current location'
                    : 'e.g. San Francisco, CA'
                }
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

              <Label htmlFor="radius">
                Search Radius: {radius} miles
              </Label>
              <Range
                id="radius"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Label>Choose Group Size</Label>
              <RadioCardContainer>
                <RadioCard
                  selected={groupSize === '1-2'}
                  onClick={() => setGroupSize('1-2')}
                >
                  1–2
                </RadioCard>
                <RadioCard
                  selected={groupSize === '3-4'}
                  onClick={() => setGroupSize('3-4')}
                >
                  3–4
                </RadioCard>
                <RadioCard
                  selected={groupSize === '5-9'}
                  onClick={() => setGroupSize('5-9')}
                >
                  5–9
                </RadioCard>
                <RadioCard
                  selected={groupSize === '10+'}
                  onClick={() => setGroupSize('10+')}
                >
                  10+
                </RadioCard>
              </RadioCardContainer>
            </>
          )}

          {step === 3 && (
            <>
              {!skipDateTime && (
                <>
                  <Label htmlFor="date">Event Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={skipDateTime}
                  />

                  <Label htmlFor="time">Event Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={skipDateTime}
                  />
                </>
              )}

              {skipDateTime && (
                <>
                  <Label>Choose Time of Day</Label>
                  <TimeCardContainer>
                    <TimeCard
                      selected={timeOfDay === 'breakfast'}
                      onClick={() => setTimeOfDay('breakfast')}
                    >
                      Breakfast 🥞
                    </TimeCard>
                    <TimeCard
                      selected={timeOfDay === 'brunch'}
                      onClick={() => setTimeOfDay('brunch')}
                    >
                      Brunch 🥂
                    </TimeCard>
                    <TimeCard
                      selected={timeOfDay === 'lunch'}
                      onClick={() => setTimeOfDay('lunch')}
                    >
                      Lunch 🥗
                    </TimeCard>
                    <TimeCard
                      selected={timeOfDay === 'dinner'}
                      onClick={() => setTimeOfDay('dinner')}
                    >
                      Dinner 🥘
                    </TimeCard>
                    <TimeCard
                      selected={timeOfDay === 'late night cocktails'}
                      onClick={() => setTimeOfDay('late night cocktails')}
                    >
                      Late Night Cocktails 🍸
                    </TimeCard>
                  </TimeCardContainer>
                </>
              )}

              <CheckboxLabel onClick={() => setSkipDateTime(!skipDateTime)}>
                <ToggleWrapper checked={skipDateTime}>
                  <ToggleCircle checked={skipDateTime} />
                </ToggleWrapper>
                <span style={{ marginLeft: '0.5rem' }}>
                  I'll select time &amp; date later
                </span>
              </CheckboxLabel>
            </>
          )}

          {step === 4 && (
            <>
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Friday Feast"
              />

              <Label htmlFor="welcome">Welcome Message</Label>
              <Textarea
                id="welcome"
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Leave a detailed message for your group…"
              />
            </>
          )}

          {step === 5 && (
            <>
              <Label htmlFor="invite">
                Invite via Email (optional)
              </Label>
              <Textarea
                id="invite"
                rows={2}
                value={participantsInput}
                onChange={(e) => setParticipantsInput(e.target.value)}
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
    </>
  );
}

const UseLocationButton = styled.button`
  background: transparent;
  border: none;
  color: #cc31e8;
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 1rem;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;