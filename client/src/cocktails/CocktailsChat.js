// CocktailsChat.js
import React, { useState, useContext } from 'react';
import { UserContext } from '../context/user';
import { MapPin, Users, Calendar, Clock, MessageSquare, Edit3 } from 'lucide-react';

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
  Range,
  RangeLabel,
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
  UseLocationButton,
  DateTimeGrid,
  FormGroup
} from '../styles/FormStyles';

export default function CocktailsChat({ onClose }) {
  const { user, setUser } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const percent = (step / totalSteps) * 100;

  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLocationUsed, setCurrentLocationUsed] = useState(false);
  const [radius, setRadius] = useState(0.5);

  const [groupSize, setGroupSize] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [skipDateTime, setSkipDateTime] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');

  const [eventName, setEventName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const [allowParticipantTimeSelection] = useState(false);

  const headers = [
    {
      title: 'Where to meet for drinks?',
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
      subtitle: 'Give your night out a name and leave a detailed message for your group!',
    },
  ];
  const { title, subtitle } = headers[step - 1];

  const groupSizeOptions = [
    {
      value: '1-2',
      icon: '🥂',
      label: 'Intimate',
      subtitle: '1-2 people'
    },
    {
      value: '3-4',
      icon: '🍻',
      label: 'Small Group',
      subtitle: '3-4 people'
    },
    {
      value: '5-9',
      icon: '🎉',
      label: 'Party',
      subtitle: '5-9 people'
    },
    {
      value: '10+',
      icon: '🍾',
      label: 'Big Night Out',
      subtitle: '10+ people'
    }
  ];

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
      // If participants are selecting time, no validation needed
      if (allowParticipantTimeSelection) return false;

      // Otherwise, use existing validation
      if (skipDateTime) return !timeOfDay;
      if (!date || !time) return true;
      const selected = new Date(`${date}T${time}`);
      return !(selected > new Date());
    }
    if (step === 4) return !eventName.trim() || !welcomeMessage.trim();
    return false;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Modified computeDateNotes for cocktails - defaults to late night cocktails
  const computeDateNotes = () => {
    // If skipped date/time, default to late night cocktails (main change)
    if (skipDateTime) {
      return 'late night cocktails';
    }
    // Otherwise infer from numeric time, but bias towards cocktail times
    const [hourStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    if (hour >= 5 && hour < 12) {
      return 'brunch cocktails';
    }
    if (hour >= 12 && hour < 17) {
      return 'afternoon drinks';
    }
    if (hour >= 17 && hour < 21) {
      return 'happy hour';
    }
    // Covers 21-24 and 0-4 - prime cocktail time
    return 'late night cocktails';
  };

  const handleSubmit = async () => {
    const date_notes = allowParticipantTimeSelection ? 'TBD' : computeDateNotes();

    const payload = {
      activity_type: 'Cocktails',
      emoji: '🍸',
      activity_location: currentLocationUsed
        ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
        : location.trim(),
      radius,
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

      fetch('/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({
          event: 'Cocktails Chat Completed',
          properties: { user: user.id }
        }),
        credentials: 'include'
      }).catch(err => console.error('Analytics tracking failed:', err));

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
            <Section>
              <Label htmlFor="location">
                <MapPin size={16} />
                Meeting Location
              </Label>
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
                    : 'e.g. Downtown Manhattan, NY'
                }
              />
              <UseLocationButton
                onClick={useCurrentLocation}
                disabled={isLocating || currentLocationUsed}
              >
                <MapPin size={16} />
                {currentLocationUsed
                  ? 'Using current location'
                  : isLocating
                    ? 'Locating…'
                    : 'Use my current location'}
              </UseLocationButton>

              <RangeLabel>
                Search Radius: {radius} miles
              </RangeLabel>
              <Range
                id="radius"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </Section>
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
              {/* First, ask if participants should choose time */}
              {/* <CheckboxLabel onClick={() => setAllowParticipantTimeSelection(!allowParticipantTimeSelection)}>
                                <ToggleWrapper checked={allowParticipantTimeSelection}>
                                    <ToggleCircle checked={allowParticipantTimeSelection} />
                                </ToggleWrapper>
                                Let participants vote on their preferred times
                            </CheckboxLabel> */}

              {/* Only show organizer time selection if participants aren't choosing */}
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
                      selected={timeOfDay === 'brunch cocktails'}
                      onClick={() => setTimeOfDay('brunch cocktails')}
                    >
                      Brunch Cocktails 🥂
                    </TimeCard>
                    <TimeCard
                      selected={timeOfDay === 'afternoon drinks'}
                      onClick={() => setTimeOfDay('afternoon drinks')}
                    >
                      Afternoon Drinks ☀️
                    </TimeCard>
                    <TimeCard
                      selected={timeOfDay === 'happy hour'}
                      onClick={() => setTimeOfDay('happy hour')}
                    >
                      Happy Hour 🍻
                    </TimeCard>
                    <TimeCard
                      selected={timeOfDay === 'late night cocktails'}
                      onClick={() => setTimeOfDay('late night cocktails')}
                    >
                      Late Night Cocktails 🍸
                    </TimeCard>
                  </TimeCardContainer>
                </div>
              )}

              {/* Show organizer's time selection toggle only if not using participant selection */}
              {!allowParticipantTimeSelection && (
                <CheckboxLabel onClick={() => setSkipDateTime(!skipDateTime)} style={{ marginTop: '1rem' }}>
                  <ToggleWrapper checked={skipDateTime}>
                    <ToggleCircle checked={skipDateTime} />
                  </ToggleWrapper>
                  I'll select time &amp; date later
                </CheckboxLabel>
              )}

              {/* Show message when participants will choose time */}
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
                  🗳️ Participants will submit their preferred times along with bar preferences. You can finalize the time during the voting phase.
                </div>
              )}
            </Section>
          )}

          {step === 4 && (
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
                  placeholder="e.g. Friday Night Out"
                />
              </Section>

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
                  placeholder="Leave a detailed message for your group about tonight's plans…"
                />
              </Section>
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
    </Overlay>
  );
}