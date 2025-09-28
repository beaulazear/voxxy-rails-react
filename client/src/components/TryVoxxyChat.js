import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import LoadingScreenUser from '../admincomponents/LoadingScreenUser';

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

const Select = styled.select`
  width: 100%;
  padding: 0.6rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eee;
  margin-bottom: 1rem;
  &:focus {
    border-color: #6c63ff;
    outline: none;
  }
  
  option {
    background: #2a2a2a;
    color: #eee;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.6rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eee;
  margin-bottom: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
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

const LoadingText = styled.span`
  color: #777;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  display: block;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  z-index: 1001;
  padding: 0.5rem;
  
  &:hover {
    color: #fff;
  }
`;

function TryVoxxyChat({ onClose, onChatComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [showLoading, setShowLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const percent = (step / totalSteps) * 100;

  // Form data
  const [formData, setFormData] = useState({
    location: '',
    usingCurrentLocation: false,
    coords: null,
    outingType: '',
    foodMood: '',
    restrictions: '',
    vibe: '',
    budget: ''
  });

  const headers = [
    {
      title: 'Where and when?',
      subtitle: 'Help us find dining options in your area'
    },
    {
      title: 'Food & drink mood?',
      subtitle: 'What are you craving today?'
    },
    {
      title: 'Any restrictions?',
      subtitle: 'Let us know about dietary needs or preferences'
    },
    {
      title: 'What\'s the vibe?',
      subtitle: 'Tell us about the atmosphere you\'re looking for'
    },
    {
      title: 'Budget range?',
      subtitle: 'What\'s your spending comfort zone?'
    }
  ];

  const { title, subtitle } = headers[step - 1];

  const getOrCreateSessionToken = () => {
    let token = localStorage.getItem('voxxy_token');
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem('voxxy_token', token);
    }
    return token;
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      return;
    }

    if (!formData.usingCurrentLocation) {
      setFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setFormData(prev => ({
            ...prev,
            coords: { lat: coords.latitude, lng: coords.longitude },
            usingCurrentLocation: true,
            location: 'Using current location'
          }));
          setFetchingLocation(false);
        },
        () => {
          setFetchingLocation(false);
          alert("Unable to fetch location");
        }
      );
    } else {
      setFormData(prev => ({
        ...prev,
        coords: null,
        usingCurrentLocation: false,
        location: ''
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'location' && { usingCurrentLocation: false })
    }));
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1:
        return (!formData.location.trim() && !formData.usingCurrentLocation) || !formData.outingType;
      case 2:
        return !formData.foodMood.trim();
      case 3:
        return false; // Optional field
      case 4:
        return !formData.vibe.trim();
      case 5:
        return !formData.budget;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setShowLoading(true);

    // Format responses similar to the original chat format
    const responses = [
      `What's the food & drink mood? Are we craving anything specific or open to surprises?\nAnswer: ${formData.foodMood}`,
      `Any deal-breakers? (e.g. no pizza, gluten-free, etc)\nAnswer: ${formData.restrictions || 'No specific restrictions'}`,
      `What's the vibe? Fancy, casual, outdoor seating, rooftop views, good music…?\nAnswer: ${formData.vibe}`,
      `Budget range: low, mid, high?\nAnswer: ${formData.budget}`
    ].join('\n\n');

    const token = getOrCreateSessionToken();

    if (process.env.NODE_ENV === 'production') {
      fetch('/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({
          event: 'Try Voxxy Chat Complete',
          properties: {}
        }),
        credentials: 'include'
      }).catch(err => console.error('Analytics tracking failed:', err));
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/try_voxxy_recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({
          responses,
          activity_location: formData.usingCurrentLocation && formData.coords ? formData.coords : formData.location,
          date_notes: formData.outingType
        })
      });
      const data = await res.json();
      onChatComplete(data.recommendations || []);
    } catch (err) {
      console.error(err);
      onChatComplete([]);
    }

    onClose();
  };

  if (showLoading) {
    return <LoadingScreenUser onComplete={() => { }} />;
  }

  return (
    <>
      <Overlay onClick={() => onClose()} />
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={() => onClose()}>
          <X size={20} />
        </CloseButton>

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
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder={
                  formData.usingCurrentLocation
                    ? 'Using current location'
                    : 'e.g. San Francisco, CA'
                }
                disabled={formData.usingCurrentLocation}
              />
              <UseLocationButton
                onClick={useCurrentLocation}
                disabled={fetchingLocation}
              >
                {formData.usingCurrentLocation
                  ? 'Clear location'
                  : fetchingLocation
                    ? 'Locating…'
                    : 'Use my current location'}
              </UseLocationButton>
              {fetchingLocation && (
                <LoadingText>Fetching location...</LoadingText>
              )}

              <Label htmlFor="outingType">Outing Type</Label>
              <Select
                id="outingType"
                value={formData.outingType}
                onChange={(e) => handleInputChange('outingType', e.target.value)}
              >
                <option value="" disabled>Select outing type</option>
                <option value="Brunch">Brunch</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Late-night drinks">Late-night drinks</option>
              </Select>
            </>
          )}

          {step === 2 && (
            <>
              <Label htmlFor="foodMood">What are you craving?</Label>
              <Textarea
                id="foodMood"
                placeholder="Tell us what you're craving! Specific cuisines, comfort food, something adventurous, or are you open to surprises?"
                value={formData.foodMood}
                onChange={(e) => handleInputChange('foodMood', e.target.value)}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Label htmlFor="restrictions">Dietary Restrictions (Optional)</Label>
              <Textarea
                id="restrictions"
                placeholder="Any dietary restrictions, allergies, or foods you want to avoid? (This field is optional)"
                value={formData.restrictions}
                onChange={(e) => handleInputChange('restrictions', e.target.value)}
              />
            </>
          )}

          {step === 4 && (
            <>
              <Label htmlFor="vibe">Describe the vibe</Label>
              <Textarea
                id="vibe"
                placeholder="Describe the atmosphere you're looking for: fancy, casual, outdoor seating, rooftop views, live music, cozy, energetic, etc."
                value={formData.vibe}
                onChange={(e) => handleInputChange('vibe', e.target.value)}
              />
            </>
          )}

          {step === 5 && (
            <>
              <Label htmlFor="budget">Budget Range</Label>
              <Select
                id="budget"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
              >
                <option value="" disabled>Select your budget range</option>
                <option value="low">Low ($-$$) - Budget-friendly options</option>
                <option value="mid">Mid ($$-$$$) - Moderate pricing</option>
                <option value="high">High ($$$-$$$$) - Premium dining</option>
              </Select>
            </>
          )}
        </StepContent>

        <ButtonRow>
          {step > 1 ? (
            <Button onClick={handleBack}>
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
            {step < totalSteps ? 'Next' : 'Get Recommendations'}
          </Button>
        </ButtonRow>
      </ModalContainer>
    </>
  );
}

export default TryVoxxyChat;