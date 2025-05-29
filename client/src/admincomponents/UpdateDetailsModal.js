import React, { useState } from 'react';
import styled from 'styled-components';

const colors = {
    sectionBackground: '#251C2C',
    cardBackground: '#2a1e30',
    inputBackground: '#221825',
    border: '#442f4f',
    textPrimary: '#FFFFFF',
    textMuted: '#BEBEBE',
    accent: '#9D60F8',
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalWrapper = styled.section`
  padding: 40px 20px;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
`;

const Title = styled.h2`
  font-size: clamp(1.25rem, 4vw, 2rem);
  font-weight: 600;
  margin: 0 0 1.5rem;
  color: #fff;
  text-align: center;
`;

const Field = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  color: ${colors.textPrimary};
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  text-align: left; // Ensure left alignment
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.inputBackground};
  border: 1px solid ${colors.border};
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const StyledInput = styled.input`
  background: transparent;
  color-scheme: dark;
  border: none;
  flex: 1;
  color: ${colors.textPrimary};
  font-size: 1rem;
  outline: none;
  &::placeholder { color: ${colors.textMuted}; }
`;

const StyledTextarea = styled.textarea`
  background-color: ${colors.inputBackground};
  border: 1px solid ${colors.border};
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: ${colors.textPrimary};
  font-size: 1rem;
  width: 100%;b
  min-height: 80px;
  resize: vertical;
  outline: none;
  &::placeholder { color: ${colors.textMuted}; }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.25rem;
  background-color: ${({ $variant }) =>
        $variant === 'primary' ? colors.accent : 'transparent'};
  color: ${colors.textPrimary};
  border: ${({ $variant }) =>
        $variant === 'primary' ? 'none' : `1px solid ${colors.textPrimary}`};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  transition: background-color 0.2s ease, opacity 0.2s;
  &:hover {
    background-color: ${({ variant }) =>
        variant === 'primary' ? '#7f3bdc' : 'rgba(255,255,255,0.2)'};
  }
`;

export default function UpdateDetailsModal({ activity, onClose, onUpdate }) {
    const [name, setName] = useState(activity.activity_name);
    const [location, setLocation] = useState(activity.activity_location || '');
    const [dateDay, setDateDay] = useState(activity.date_day || '');
    const [dateTime, setDateTime] = useState(
        activity.date_time ? activity.date_time.slice(11, 16) : ''
    );
    const [welcomeMessage, setWelcomeMessage] = useState(
        activity.welcome_message || ''
    );
    const [errors, setErrors] = useState([]);

    const canSave = () => Boolean(name.trim());

    const handleSubmit = async () => {
        const payload = {
            activity_name: name,
            activity_location: location,
            date_day: dateDay || null,
            date_time: dateTime && dateDay ? `${dateDay}T${dateTime}:00` : null,
            welcome_message: welcomeMessage,
        };
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
            <ModalWrapper onClick={e => e.stopPropagation()}>
                <Card>
                    <Title>Edit Activity Details</Title>
                    {errors.length > 0 && (
                        <ul style={{ color: '#FF6B6B' }}>
                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                    )}
                    <Field>
                        <Label htmlFor="name">Name</Label>
                        <InputWrapper>
                            <StyledInput
                                id="name"
                                placeholder="Activity Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </InputWrapper>
                    </Field>
                    {activity.activity_type !== 'Meeting' && (
                        <>
                            <Field>
                                <Label htmlFor="location">Location</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="location"
                                        placeholder="Location"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                    />
                                </InputWrapper>
                            </Field>
                            <Field>
                                <Label htmlFor="dateDay">Date</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="dateDay"
                                        type="date"
                                        value={dateDay}
                                        onChange={e => setDateDay(e.target.value)}
                                    />
                                </InputWrapper>
                            </Field>
                            <Field>
                                <Label htmlFor="dateTime">Time</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="dateTime"
                                        type="time"
                                        value={dateTime}
                                        onChange={e => setDateTime(e.target.value)}
                                    />
                                </InputWrapper>
                            </Field>
                        </>
                    )}
                    <Field>
                        <Label htmlFor="welcomeMessage">Welcome Message</Label>
                        <StyledTextarea
                            id="welcomeMessage"
                            placeholder="Welcome message..."
                            value={welcomeMessage}
                            onChange={e => setWelcomeMessage(e.target.value)}
                        />
                    </Field>
                    <Actions>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            $variant="primary"
                            onClick={handleSubmit}
                            disabled={!canSave()}
                        >
                            Save
                        </Button>
                    </Actions>
                </Card>
            </ModalWrapper>
        </Overlay>
    );
}
