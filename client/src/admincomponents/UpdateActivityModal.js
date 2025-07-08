import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { HeartPulse, Calendar, Clock, MapPin, MessageSquare, X, CheckCircle2, Users } from 'lucide-react';

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

const ModalOverlay = styled.div`
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
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  border-radius: 1.5rem 1.5rem 0 0;
  z-index: 10;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem 2rem 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #cc31e8;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const DateTimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
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

const OptionItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  
  &:hover { 
    border-color: #cc31e8;
    background: rgba(204, 49, 232, 0.1);
  }
  
  input { 
    accent-color: #cc31e8; 
    cursor: pointer;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  
  input:checked + .option-content {
    color: #cc31e8;
  }
`;

const OptionContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  min-height: 0;
`;

const OptionTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  flex: 1;
`;

const OptionMeta = styled.div`
  font-size: 0.8rem;
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const VoteCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(220, 38, 127, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  color: #dc267f;
  font-weight: 600;
`;

const Button = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) { 
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(204, 49, 232, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorList = styled.div`
  background: rgba(220, 38, 127, 0.2);
  border: 1px solid rgba(220, 38, 127, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const ErrorItem = styled.div`
  color: #dc267f;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:not(:last-child) {
    margin-bottom: 0.5rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ccc;
  font-style: italic;
`;

function UpdateActivityModal({ activity, onClose, onUpdate, pinnedActivities, pinned }) {
  const [formData, setFormData] = useState({
    activity_location: activity.activity_location || '',
    date_day: activity.date_day || '',
    date_time: activity.date_time ? activity.date_time.slice(11, 16) : '',
    welcome_message: activity.welcome_message || '',
  });
  const [errors, setErrors] = useState([]);
  const [selectedPinnedId, setSelectedPinnedId] = useState(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState(null);

  const isMeeting = activity.activity_type === 'Meeting'
  const needsTimeSlot = isMeeting || (pinned?.length > 0)
  const timeSlotValid = !needsTimeSlot || selectedTimeSlotId != null

  const isRestaurant = activity.activity_type === 'Restaurant';
  const allFieldsFilled =
    formData.activity_location.trim() &&
    formData.date_day &&
    formData.date_time &&
    formData.welcome_message.trim();
  const restaurantValid = !isRestaurant || (allFieldsFilled && selectedPinnedId != null)

  const canSubmit = timeSlotValid && restaurantValid

  useEffect(() => {
    if (pinnedActivities?.length) {
      const top = pinnedActivities.reduce(
        (prev, curr) => (curr.vote_count || 0) > (prev.vote_count || 0) ? curr : prev,
        pinnedActivities[0]
      );
      setSelectedPinnedId(top.id);
    }
  }, [pinnedActivities]);

  function handleTimeSlotChange(e) {
    let id;
    if (e) {
      id = +e.target.value;
    } else {
      id = pinned[0].id
    }
    const slot = pinned.find(ts => ts.id === id);
    setSelectedTimeSlotId(id);
    setFormData({
      ...formData,
      date_day: slot.date,
      date_time: slot.time.slice(11, 16),
    });
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleOptionChange(e) {
    setSelectedPinnedId(+e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    if (!canSubmit) {
      const msgs = [];
      if (pinned?.length > 0 && selectedTimeSlotId == null)
        msgs.push('Please choose a time slot.');
      if (isRestaurant && !selectedPinnedId)
        msgs.push('Please choose a restaurant.');
      if (isRestaurant && !allFieldsFilled)
        msgs.push('Please fill out all the fields.');
      setErrors(msgs);
      return;
    }

    const payload = {
      ...formData,
      date_time: formData.date_day
        ? `${formData.date_day}T${formData.date_time}:00`
        : null,
      finalized: true,
    };

    if (activity.activity_type !== 'Meeting') {
      payload.selected_pinned_id = selectedPinnedId;
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ activity: payload }) }
      );
      const data = await res.json();
      if (!res.ok) setErrors(data.errors || [data.error] || ['Unknown error']);
      else { onUpdate(data); onClose(); }
    } catch (err) {
      setErrors([err.message]);
    }
  }

  function formatTo12h(isoTimestamp) {
    const timeHM = isoTimestamp.slice(11, 16);
    let [hour, minute] = timeHM.split(':').map(Number);

    const isPM = hour >= 12;
    const suffix = isPM ? 'pm' : 'am';

    hour = hour % 12 || 12;

    return `${hour}:${minute.toString().padStart(2, '0')}${suffix}`;
  }

  function getOrdinalSuffix(d) {
    if (d >= 11 && d <= 13) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  function formatDate(ds) {
    if (!ds) return 'TBD';
    const [y, m, d] = ds.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const mn = dt.toLocaleString('en-US', { month: 'long' });
    return `${mn} ${d}${getOrdinalSuffix(d)}`;
  }

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>Review & Finalize</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {errors.length > 0 && (
            <ErrorList>
              {errors.map((error, i) => (
                <ErrorItem key={i}>
                  <X size={16} />
                  {error}
                </ErrorItem>
              ))}
            </ErrorList>
          )}

          <Form onSubmit={handleSubmit}>
            {pinnedActivities?.length > 0 && (
              <Section>
                <SectionHeader>
                  <Users size={20} />
                  <SectionTitle>Restaurant Selection</SectionTitle>
                </SectionHeader>
                <OptionList>
                  {[...pinnedActivities]
                    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                    .map(p => (
                      <OptionItem key={p.id}>
                        <input
                          type="radio"
                          name="selectedPinned"
                          value={p.id}
                          checked={selectedPinnedId === p.id}
                          onChange={handleOptionChange}
                        />
                        <OptionContent className="option-content">
                          <OptionTitle>{p.title}</OptionTitle>
                          <OptionMeta>
                            <VoteCount>
                              <HeartPulse size={14} />
                              {p.vote_count || 0} votes
                            </VoteCount>
                          </OptionMeta>
                        </OptionContent>
                      </OptionItem>
                    ))}
                </OptionList>
              </Section>
            )}

            {pinned?.length > 0 && (
              <Section>
                <SectionHeader>
                  <Clock size={20} />
                  <SectionTitle>Time Slot Selection</SectionTitle>
                </SectionHeader>
                <OptionList>
                  {pinned.map(slot => (
                    <OptionItem key={slot.id}>
                      <input
                        type="radio"
                        name="timeSlot"
                        value={slot.id}
                        checked={selectedTimeSlotId === slot.id}
                        onChange={handleTimeSlotChange}
                      />
                      <OptionContent className="option-content">
                        <OptionTitle>
                          {formatDate(slot.date)} @ {formatTo12h(slot.time)}
                        </OptionTitle>
                        <OptionMeta>
                          <VoteCount>
                            <HeartPulse size={14} />
                            {slot.votes_count} votes
                          </VoteCount>
                        </OptionMeta>
                      </OptionContent>
                    </OptionItem>
                  ))}
                </OptionList>
              </Section>
            )}

            {activity.activity_type === 'Meeting' && pinned?.length === 0 && (
              <EmptyState>
                You cannot finalize this activity until someone has pinned a time slot.
              </EmptyState>
            )}

            {activity.activity_type === 'Restaurant' && pinnedActivities?.length === 0 && (
              <EmptyState>
                You cannot finalize this activity until someone has pinned a restaurant.
              </EmptyState>
            )}

            {activity.activity_type !== 'Meeting' && pinned.length < 1 && (
              <Section>
                <SectionHeader>
                  <Calendar size={20} />
                  <SectionTitle>Activity Details</SectionTitle>
                </SectionHeader>

                <DateTimeGrid>
                  <FormGroup>
                    <Label htmlFor="date_day">
                      <Calendar size={16} />
                      Date
                    </Label>
                    <Input
                      type="date"
                      name="date_day"
                      id="date_day"
                      value={formData.date_day}
                      onChange={handleChange}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="date_time">
                      <Clock size={16} />
                      Time
                    </Label>
                    <Input
                      type="time"
                      name="date_time"
                      id="date_time"
                      value={formData.date_time}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </DateTimeGrid>

                <FormGroup>
                  <Label htmlFor="activity_location">
                    <MapPin size={16} />
                    Location
                  </Label>
                  <Input
                    type="text"
                    name="activity_location"
                    id="activity_location"
                    value={formData.activity_location}
                    onChange={handleChange}
                    placeholder="Enter location..."
                  />
                </FormGroup>
              </Section>
            )}

            <Section>
              <SectionHeader>
                <MessageSquare size={20} />
                <SectionTitle>Welcome Message</SectionTitle>
              </SectionHeader>
              <FormGroup>
                <Textarea
                  name="welcome_message"
                  id="welcome_message"
                  placeholder="Write a welcome message for participants..."
                  value={formData.welcome_message}
                  onChange={handleChange}
                />
              </FormGroup>
            </Section>

            <Button type="submit" disabled={!canSubmit}>
              <CheckCircle2 size={20} />
              Finalize & Share
            </Button>
          </Form>
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default UpdateActivityModal;