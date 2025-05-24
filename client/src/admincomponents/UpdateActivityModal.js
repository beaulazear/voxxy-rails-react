import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContainer = styled.div`
  background: #2C1E33;
  padding: 1.5rem;
  border-radius: 10px;
  width: 95%;
  max-width: 450px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  text-align: left;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  color: #fff;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  color: #666;
  &:hover { color: #fff; }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  color-scheme: dark;
  border-radius: 6px;
  background: #201925;
  color: #fff;
  &:focus { border-color: #6c5ce7; outline: none; }
  &:-webkit-autofill { box-shadow: 0 0 0px 1000px #201925 inset !important; -webkit-text-fill-color: #fff !important; }
  &:-webkit-autofill:focus { box-shadow: 0 0 0px 1000px #201925 inset !important; -webkit-text-fill-color: #fff !important; }
  &::-webkit-calendar-picker-indicator, &::-moz-color-swatch-button { filter: invert(1) brightness(2); cursor: pointer; }
  &::placeholder { color: #aaa; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.6rem;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #201925;
  color: #fff;
  resize: vertical;
  min-height: 80px;
  &:focus { border-color: #6c5ce7; outline: none; }
  &::placeholder { color: #aaa; }
`;

const Button = styled.button`
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  background: #6c5ce7;
  color: white;
  &:hover { opacity: 0.85; }
  &:disabled {
  opacity: 0.5;
  cursor: not-allowed;
+ }
`;

const ErrorList = styled.ul`
  background: #ffe6e6;
  color: #900;
  border: 1px solid #f5c2c2;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  li { margin-left: 1rem; }
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
const OptionItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #201925;
  padding: 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  border: 2px solid transparent;
  &:hover { border-color: #6c5ce7; }
  input { accent-color: #6c5ce7; cursor: pointer; }
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

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h2>Review & Finalize</h2>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>
        {errors.length > 0 && <ErrorList>{errors.map((e, i) => <li key={i}>{e}</li>)}</ErrorList>}
        <Form onSubmit={handleSubmit}>
          {pinnedActivities?.length > 0 && (
            <>
              <Label>Select Final Restaurant Choice</Label>
              <OptionList>
                {pinnedActivities.map(p => (
                  <OptionItem key={p.id}>
                    <input type="radio" name="selectedPinned" value={p.id} checked={selectedPinnedId === p.id} onChange={handleOptionChange} />
                    <span>{p.title} ({p.vote_count || 0} votes)</span>
                  </OptionItem>
                ))}
              </OptionList>
            </>
          )}
          {pinned?.length > 0 && (
            <>
              <Label>Select a Time Slot</Label>
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
                    <span>
                      {slot.date} @ {formatTo12h(slot.time)}
                    </span>
                  </OptionItem>
                ))}
              </OptionList>
            </>
          )}
          {activity.activity_type === 'Meeting' &&
            pinned?.length === 0 && (
              <p style={{ color: '#fff' }}>You can not finalize this activity until someone has pinned a time slot.</p>
            )}
          {activity.activity_type === 'Restaurant' &&
            pinnedActivities?.length === 0 && (
              <p style={{ color: '#fff' }}>You can not finalize this activity until someone has pinned a restaurant.</p>
            )}
          {activity.activity_type !== 'Meeting' && (
            <>
              <Label htmlFor="date_day">Date</Label>
              <Input type="date" name="date_day" id="date_day" value={formData.date_day} onChange={handleChange} />
              <Label htmlFor="date_time">Time</Label>
              <Input type="time" name="date_time" id="date_time" value={formData.date_time} onChange={handleChange} />
            </>
          )}
          <Label htmlFor="welcome_message">Activity Message</Label>
          <Textarea name="welcome_message" id="welcome_message" placeholder="Welcome message..." value={formData.welcome_message} onChange={handleChange} />
          <Button
            type="submit"
            disabled={!canSubmit}
          >
            Finalize Activity
          </Button>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
}
export default UpdateActivityModal;
