import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { 
  MapPin, 
  Search, 
  Coffee, 
  ChefHat, 
  Wine, 
  Moon, 
  Sun,
  ChevronRight,
  ChevronLeft,
  Check,
  Utensils,
  CheckCircle,
  Navigation
} from 'lucide-react';
import colors from '../styles/Colors';
import SearchLocationModal from './SearchLocationModal';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Styled Components
const Container = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #201925 0%, #2D1B47 100%);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ProgressContainer = styled.div`
  padding: 24px 32px 20px 32px;
  
  @media (max-width: 768px) {
    padding: 20px 24px 16px 24px;
  }
`;

const ProgressBar = styled.div`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${colors.primaryButton}, ${colors.secondaryButton});
  border-radius: 2px;
  transition: width 0.3s ease;
  width: ${props => props.$percent}%;
`;

const ProgressText = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  margin-top: 10px;
  text-align: center;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const Header = styled.div`
  padding: 0 32px 32px 32px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 0 24px 24px 24px;
  }
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 12px 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 0 32px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 0 24px;
  }
`;

const StepContent = styled.div`
  animation: ${slideIn} 0.3s ease;
`;

// Activity Selection Styles
const ActivityButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
  margin: 20px auto 0 auto;
  padding-top: 10px;
`;

const ActivityButton = styled.button`
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ActivityGradient = styled.div`
  padding: 32px;
  border-radius: 24px;
  background: ${props => props.$selected 
    ? `linear-gradient(135deg, ${colors.primaryButton}, ${colors.secondaryButton})`
    : 'rgba(185, 84, 236, 0.08)'};
  border: ${props => props.$selected 
    ? '2px solid rgba(185, 84, 236, 0.6)'
    : '1.5px solid rgba(185, 84, 236, 0.15)'};
  display: flex;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
  
  ${props => props.$selected && css`
    animation: ${pulse} 0.3s ease;
  `}
  
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const ActivityIconCircle = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 35px;
  background-color: ${props => props.$selected 
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(255, 255, 255, 0.08)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24px;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  
  svg {
    width: 36px;
    height: 36px;
    color: ${props => props.$selected ? '#fff' : props.$iconColor};
  }
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    margin-right: 20px;
    
    svg {
      width: 30px;
      height: 30px;
    }
  }
`;

const ActivityTitle = styled.h3`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.$selected ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  margin: 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  flex: 1;
  text-align: left;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Checkmark = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 16px;
    height: 16px;
    color: #fff;
  }
`;

// Location Styles
const LocationContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const LocationOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LocationOption = styled.button`
  width: 100%;
  padding: 24px;
  border-radius: 20px;
  background: ${props => props.$active 
    ? 'rgba(204, 49, 232, 0.12)'
    : 'rgba(255, 255, 255, 0.04)'};
  border: ${props => props.$active
    ? '2px solid rgba(204, 49, 232, 0.5)'
    : '1.5px solid rgba(255, 255, 255, 0.08)'};
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active 
      ? 'rgba(204, 49, 232, 0.12)'
      : 'rgba(255, 255, 255, 0.06)'};
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    gap: 16px;
  }
`;

const LocationIconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: ${props => props.$active
    ? 'rgba(204, 49, 232, 0.25)'
    : 'rgba(255, 255, 255, 0.06)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 22px;
    height: 22px;
    color: ${props => props.$active ? '#fff' : colors.textMuted};
  }
`;

const LocationContent = styled.div`
  flex: 1;
  text-align: left;
`;

const LocationTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const LocationDesc = styled.div`
  font-size: 13px;
  color: ${props => props.$active 
    ? 'rgba(255, 255, 255, 0.7)'
    : 'rgba(255, 255, 255, 0.5)'};
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

// Time Options Styles
const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TimeOption = styled.button`
  padding: 24px;
  border-radius: 16px;
  background: ${props => props.$selected
    ? 'rgba(204, 49, 232, 0.12)'
    : 'rgba(255, 255, 255, 0.04)'};
  border: ${props => props.$selected
    ? '2px solid rgba(204, 49, 232, 0.5)'
    : '1.5px solid rgba(255, 255, 255, 0.08)'};
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$selected
      ? 'rgba(204, 49, 232, 0.12)'
      : 'rgba(255, 255, 255, 0.06)'};
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$selected ? '#fff' : colors.textMuted};
  }
`;

const TimeContent = styled.div`
  flex: 1;
  text-align: left;
`;

const TimeLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const TimeDesc = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

// Footer Styles
const Footer = styled.div`
  padding: 24px 32px 32px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  
  @media (max-width: 768px) {
    padding: 20px 24px 24px 24px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  font-weight: 600;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NextButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: ${props => props.disabled 
    ? 'rgba(255, 255, 255, 0.1)'
    : `linear-gradient(135deg, ${colors.primaryButton}, ${colors.secondaryButton})`};
  border: none;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.4 : 1};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(204, 49, 232, 0.3);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const Spacer = styled.div`
  width: 88px;
`;

// Loading Overlay
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: ${colors.primaryButton};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: #fff;
  font-size: 16px;
  margin-top: 24px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  text-align: center;
  max-width: 300px;
`;

const ErrorContainer = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin: 20px 32px;
  
  @media (max-width: 768px) {
    margin: 16px 24px;
  }
`;

const ErrorText = styled.p`
  color: #FCA5A5;
  font-size: 14px;
  margin: 0 0 12px 0;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const RetryButton = styled.button`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #FCA5A5;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  
  svg {
    width: 40px;
    height: 40px;
    color: #4ADE80;
  }
`;


// Main Component
export default function UnifiedActivityChat({ onClose, onSubmit }) {
  
  const [step, setStep] = useState(1);
  const [totalSteps] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating your plan...');
  const [submissionError, setSubmissionError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Step 1: Activity Type
  const [selectedActivity, setSelectedActivity] = useState('');
  
  // Step 2: Location
  const [location, setLocation] = useState('');
  const [currentLocationUsed, setCurrentLocationUsed] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [coords, setCoords] = useState(null);
  
  // Step 3: Time
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('');
  
  // Activity options
  const activities = [
    {
      type: 'Restaurant',
      name: 'Restaurant',
      icon: Utensils,
      iconColor: '#FF6B6B',
      description: 'Find the perfect restaurant'
    },
    {
      type: 'Bar',
      name: 'Bar',
      icon: Wine,
      iconColor: '#4ECDC4',
      description: 'Discover great bars & lounges'
    },
  ];
  
  // Time options for restaurants
  const foodTimeOptions = [
    { label: 'Brunch', value: 'brunch', icon: Coffee, desc: 'Late morning feast' },
    { label: 'Lunch', value: 'lunch', icon: Sun, desc: 'Midday meal' },
    { label: 'Dinner', value: 'dinner', icon: ChefHat, desc: 'Evening dining' },
    { label: 'Late Night', value: 'late-night', icon: Moon, desc: 'Midnight munchies' }
  ];
  
  // Time options for bars
  const drinksTimeOptions = [
    { label: 'Day Drinks', value: 'day-drinks', icon: Coffee, desc: 'Afternoon cocktails' },
    { label: 'Happy Hour', value: 'happy-hour', icon: Sun, desc: 'After work vibes' },
    { label: 'Evening', value: 'evening', icon: Wine, desc: 'Cocktail hour' },
    { label: 'Night Out', value: 'night-out', icon: Moon, desc: 'Late night drinks' }
  ];
  
  // Calculate progress
  const percent = (step / totalSteps) * 100;
  
  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setCurrentLocationUsed(true);
      setCustomLocation(''); // Clear custom location
      setLocation(''); // Clear location initially
      setCoords(null); // Clear coords initially to show loading state
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setLocation(`${lat}, ${lng}`);
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please search for a location instead.');
          setCurrentLocationUsed(false);
          setLocation('');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please search for a location instead.');
    }
  };
  
  // Use custom location
  const useCustomLocation = () => {
    setCurrentLocationUsed(false);
    setCoords(null); // Clear GPS coordinates when switching to custom location
    setShowLocationModal(true); // Open the location search modal
  };
  
  // Handle location selection from search modal
  const handleLocationSelect = (selectedLocation, selectedCoords) => {
    setLocation(selectedLocation);
    setCustomLocation(selectedLocation);
    setCoords(selectedCoords);
    setCurrentLocationUsed(false);
    setShowLocationSearch(false);
  };
  
  // Get step content
  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "What's the vibe?",
          subtitle: 'Pick your scene for tonight'
        };
      case 2:
        return {
          title: 'Where are we looking?',
          subtitle: 'Set your location'
        };
      case 3:
        if (selectedActivity === 'Restaurant') {
          return {
            title: 'When are we dining?',
            subtitle: 'Pick the perfect time'
          };
        } else {
          return {
            title: 'When are we going out?',
            subtitle: 'Choose your time'
          };
        }
      default:
        return { title: '', subtitle: '' };
    }
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <ActivityButtonsContainer>
            {activities.map((activity) => {
              const IconComponent = activity.icon;
              const isSelected = selectedActivity === activity.type;
              
              return (
                <ActivityButton
                  key={activity.type}
                  onClick={() => setSelectedActivity(activity.type)}
                >
                  <ActivityGradient $selected={isSelected}>
                    <ActivityIconCircle $selected={isSelected} $iconColor={activity.iconColor}>
                      <IconComponent />
                    </ActivityIconCircle>
                    <ActivityTitle $selected={isSelected}>
                      {activity.name}
                    </ActivityTitle>
                    {isSelected && (
                      <Checkmark>
                        <Check />
                      </Checkmark>
                    )}
                  </ActivityGradient>
                </ActivityButton>
              );
            })}
          </ActivityButtonsContainer>
        );
        
      case 2:
        return (
          <LocationContainer>
            <LocationOptions>
              <LocationOption
                $active={currentLocationUsed}
                onClick={getCurrentLocation}
              >
                <LocationIconContainer $active={currentLocationUsed}>
                  <MapPin />
                </LocationIconContainer>
                <LocationContent>
                  <LocationTitle>Current Location</LocationTitle>
                  <LocationDesc $active={currentLocationUsed}>
                    {currentLocationUsed ? (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Getting location...') : 'Use your GPS location'}
                  </LocationDesc>
                </LocationContent>
              </LocationOption>
              
              <LocationOption
                $active={!currentLocationUsed && customLocation}
                onClick={useCustomLocation}
              >
                <LocationIconContainer $active={!currentLocationUsed && customLocation}>
                  <Search />
                </LocationIconContainer>
                <LocationContent>
                  <LocationTitle>Search Location</LocationTitle>
                  <LocationDesc $active={!currentLocationUsed && customLocation}>
                    {customLocation || 'Enter a specific address'}
                  </LocationDesc>
                </LocationContent>
              </LocationOption>
            </LocationOptions>
          </LocationContainer>
        );
        
      case 3:
        const timeOptions = selectedActivity === 'Restaurant' ? foodTimeOptions : drinksTimeOptions;
        return (
          <TimeGrid>
            {timeOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedTimeOfDay === option.value;
              
              return (
                <TimeOption
                  key={option.value}
                  $selected={isSelected}
                  onClick={() => setSelectedTimeOfDay(option.value)}
                >
                  <IconComponent />
                  <TimeContent>
                    <TimeLabel>{option.label}</TimeLabel>
                    <TimeDesc>{option.desc}</TimeDesc>
                  </TimeContent>
                </TimeOption>
              );
            })}
          </TimeGrid>
        );
        
      default:
        return null;
    }
  };
  
  // Validation
  const isNextDisabled = () => {
    if (isSubmitting) return true;
    
    switch (step) {
      case 1:
        return !selectedActivity;
      case 2:
        return !location;
      case 3:
        return !selectedTimeOfDay;
      default:
        return false;
    }
  };
  
  // Navigation
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
  
  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setLoadingMessage('Creating your perfect plan...');
    
    // Add timeout message after 5 seconds
    const timeoutMessage = setTimeout(() => {
      if (isSubmitting) {
        setLoadingMessage('Still working on it... This may take up to 30 seconds for the best recommendations...');
      }
    }, 5000);
    
    // Prepare data
    const activityData = {
      type: selectedActivity,
      location: location,
      timeOfDay: selectedTimeOfDay,
      responses: {
        activity_type: selectedActivity,
        location: location,
        time: selectedTimeOfDay
      }
    };
    
    try {
      // Call parent submit handler
      const result = await onSubmit(activityData);
      
      clearTimeout(timeoutMessage);
      
      if (result && result.success) {
        // Show success animation
        setShowSuccess(true);
        setLoadingMessage('Plan created successfully!');
        
        // Wait a moment then close
        setTimeout(() => {
          onClose(result.activityId);
        }, 1500);
      } else {
        throw new Error(result?.error || 'Failed to create activity');
      }
    } catch (error) {
      clearTimeout(timeoutMessage);
      console.error('Error submitting:', error);
      setSubmissionError(error.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  const { title, subtitle } = getStepContent();
  
  return (
    <Container>
      <ProgressContainer>
        <ProgressBar>
          <ProgressFill $percent={percent} />
        </ProgressBar>
        <ProgressText>
          {isSubmitting ? 'Processing...' : `Step ${step} of ${totalSteps}`}
        </ProgressText>
      </ProgressContainer>
      
      <Header>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </Header>
      
      <Content>
        <StepContent key={step}>
          {renderStepContent()}
        </StepContent>
      </Content>
      
      <Footer>
        <ButtonContainer>
          {step > 1 ? (
            <BackButton onClick={handleBack} disabled={isSubmitting}>
              <ChevronLeft />
              Back
            </BackButton>
          ) : (
            <Spacer />
          )}
          
          <NextButton
            onClick={handleNext}
            disabled={isNextDisabled()}
          >
            {step < totalSteps ? (
              <>
                Next
                <ChevronRight />
              </>
            ) : (
              'Start Planning'
            )}
          </NextButton>
        </ButtonContainer>
      </Footer>
      
      {/* Error Message */}
      {submissionError && !isSubmitting && (
        <ErrorContainer>
          <ErrorText>{submissionError}</ErrorText>
          <RetryButton onClick={handleSubmit}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      )}
      
      {/* Loading/Success Overlay */}
      {(isSubmitting || showSuccess) && (
        <LoadingOverlay>
          {showSuccess ? (
            <>
              <SuccessIcon>
                <CheckCircle />
              </SuccessIcon>
              <LoadingText>Plan created successfully!</LoadingText>
            </>
          ) : (
            <>
              <LoadingSpinner />
              <LoadingText>{loadingMessage}</LoadingText>
            </>
          )}
        </LoadingOverlay>
      )}
      
      {/* Location Search Modal */}
      <SearchLocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={location}
      />
    </Container>
  );
}