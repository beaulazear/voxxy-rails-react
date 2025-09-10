import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Edit3, MapPin, Calendar, Clock, MessageSquare, X, Save, Search } from 'lucide-react';
import SearchLocationModal from './SearchLocationModal';

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
  z-index: 1000;
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
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
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

const ErrorList = styled.ul`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #ff6b6b;
  font-size: 0.9rem;
  
  li {
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
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
    background: rgba(255, 255, 255, 0.02);
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.02);
  }
`;

const LocationButton = styled.button`
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 0.95rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  text-align: left;
  
  &:hover:not(:disabled) {
    border-color: #cc31e8;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.02);
  }
  
  svg {
    flex-shrink: 0;
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

export default function UpdateDetailsModal({ activity, onClose, onUpdate }) {
    const [name, setName] = useState(activity.activity_name);
    const [location, setLocation] = useState(activity.activity_location || '');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [dateDay, setDateDay] = useState(activity.date_day || '');
    const [dateTime, setDateTime] = useState(
        activity.date_time ? activity.date_time.slice(11, 16) : ''
    );
    const [welcomeMessage, setWelcomeMessage] = useState(
        activity.welcome_message || ''
    );
    const [errors, setErrors] = useState([]);

    // Helper function to determine what fields to show/enable based on activity type and status
    const getEditableFields = () => {
        const activityType = activity.activity_type;
        // Only allow location editing during collecting phase (not voting, finalized, or completed)
        const canEditLocation = !activity.voting && !activity.finalized && !activity.completed;

        switch (activityType) {
            case 'Restaurant':
            case 'Cocktails':
            case 'Bar':
                return {
                    name: true,
                    location: canEditLocation,
                    dateTime: false, // Don't show date/time for restaurant/bar (handled by finalization)
                    welcomeMessage: true
                };
            case 'Meeting':
                return {
                    name: true,
                    location: false, // Meetings don't edit location here
                    dateTime: false, // Time slots are handled in finalization
                    welcomeMessage: true
                };
            case 'Game Night':
                return {
                    name: true,
                    location: false, // Game Night location set by host
                    dateTime: true,
                    welcomeMessage: true
                };
            default:
                return {
                    name: true,
                    location: false,
                    dateTime: true,
                    welcomeMessage: true
                };
        }
    };

    const editableFields = getEditableFields();
    const canSave = () => Boolean(name.trim());

    const handleLocationSelect = (locationString, coordinates) => {
        setLocation(locationString);
        setShowLocationModal(false);
    };

    const handleSubmit = async () => {
        const payload = {
            activity_name: name,
            welcome_message: welcomeMessage,
        };

        // Only include fields that are editable
        if (editableFields.location) {
            payload.activity_location = location;
        }
        if (editableFields.dateTime) {
            payload.date_day = dateDay || null;
            payload.date_time = dateTime && dateDay ? `${dateDay}T${dateTime}:00` : null;
        }
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ activity: payload }),
                }
            );
            const data = await res.json();
            if (!res.ok) setErrors(data.errors || [data.error] || ['Unknown error']);
            else {
                onUpdate(data);
                onClose();
            }
        } catch (err) {
            setErrors([err.message]);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <CloseButton onClick={onClose}>
                    <X size={20} />
                </CloseButton>

                <ModalHeader>
                    <Title>Edit Activity Details</Title>
                </ModalHeader>

                <StepContent>
                    {errors.length > 0 && (
                        <ErrorList>
                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ErrorList>
                    )}

                    <Section>
                        <Label htmlFor="name">
                            <Edit3 size={16} />
                            Activity Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="Activity Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </Section>

                    {editableFields.location && (
                        <Section>
                            <Label htmlFor="location">
                                <MapPin size={16} />
                                Location
                                {!editableFields.location && ' (Locked during voting)'}
                            </Label>
                            <LocationButton
                                type="button"
                                onClick={() => setShowLocationModal(true)}
                                disabled={!editableFields.location}
                            >
                                <Search size={16} />
                                {location || 'Search for location...'}
                            </LocationButton>
                        </Section>
                    )}

                    {editableFields.dateTime && (
                        <Section>
                            <DateTimeGrid>
                                <FormGroup>
                                    <Label htmlFor="dateDay">
                                        <Calendar size={16} />
                                        Date
                                    </Label>
                                    <Input
                                        id="dateDay"
                                        type="date"
                                        value={dateDay}
                                        onChange={e => setDateDay(e.target.value)}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label htmlFor="dateTime">
                                        <Clock size={16} />
                                        Time
                                    </Label>
                                    <Input
                                        id="dateTime"
                                        type="time"
                                        value={dateTime}
                                        onChange={e => setDateTime(e.target.value)}
                                    />
                                </FormGroup>
                            </DateTimeGrid>
                        </Section>
                    )}

                    <Section>
                        <Label htmlFor="welcomeMessage">
                            <MessageSquare size={16} />
                            Welcome Message
                        </Label>
                        <Textarea
                            id="welcomeMessage"
                            placeholder="Welcome message..."
                            value={welcomeMessage}
                            onChange={e => setWelcomeMessage(e.target.value)}
                            rows={3}
                        />
                    </Section>
                </StepContent>

                <ButtonRow>
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        $primary
                        onClick={handleSubmit}
                        disabled={!canSave()}
                    >
                        <Save size={16} />
                        Save
                    </Button>
                </ButtonRow>
            </ModalContainer>
            
            {/* Location Search Modal */}
            <SearchLocationModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onLocationSelect={handleLocationSelect}
                currentLocation={location}
            />
        </Overlay>
    );
}