import React, { useState } from 'react';
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
  position: fixed;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 80vh;
  overflow-y: auto;
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

  &:hover {
    color: #333;
  }
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
  width: 90%;
  padding: 0.6rem;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #201925;
  color: #fff;

  &:focus {
    border-color: #6c5ce7;
    outline: none;
  }

  &:-webkit-autofill {
    box-shadow: 0 0 0px 1000px #201925 inset !important;
    -webkit-text-fill-color: #fff !important;
  }

  &:-webkit-autofill:focus {
    box-shadow: 0 0 0px 1000px #201925 inset !important;
    -webkit-text-fill-color: #fff !important;
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1) brightness(2);
    cursor: pointer;        /* keep pointer cursor */
  }
  &::-moz-color-swatch-button {
    filter: invert(1) brightness(2);
    cursor: pointer;
  }

  &::placeholder {
    color: #aaa;
  }
`;

const ToggleContainer = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #201925;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
`;

const ToggleSwitch = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
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

  &:hover {
    opacity: 0.85;
  }
`;

function UpdateActivityModal({ activity, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    activity_name: activity.activity_name || "",
    activity_location: activity.activity_location || "",
    date_notes: activity.date_notes || "",
    date_day: activity.date_day || "",
    date_time: activity.date_time || "",
    welcome_message: activity.welcome_message || "",
    completed: activity.completed || false,
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleToggleCompleted() {
    setFormData({ ...formData, completed: !formData.completed });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to update activity");
      }

      onUpdate(data);
      onClose();
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  }

  return (
    <>
      <ModalOverlay>
        <ModalContainer>
          <ModalHeader>
            <h2>Update Activity</h2>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <Label>Activity Name</Label>
            <Input type="text" name="activity_name" value={formData.activity_name} onChange={handleChange} required />

            <Label>Location</Label>
            <Input type="text" name="activity_location" value={formData.activity_location} onChange={handleChange} required />

            <Label>Time of Day</Label>
            <Input type="text" name="date_notes" value={formData.date_notes} onChange={handleChange} required />

            <Label>Date</Label>
            <Input type="date" name="date_day" value={formData.date_day} onChange={handleChange} />

            <Label>Time</Label>
            <Input type="time" name="date_time" value={formData.date_time} onChange={handleChange} />

            <Label>Welcome Message</Label>
            <Input type="text" name="welcome_message" value={formData.welcome_message} onChange={handleChange} />

            <ToggleContainer>
              <span>Mark as Completed:</span>
              <ToggleSwitch
                type="checkbox"
                checked={formData.completed}
                onChange={handleToggleCompleted}
              />
            </ToggleContainer>

            <Button type="submit">Update Activity</Button>
          </Form>
        </ModalContainer>
      </ModalOverlay>
    </>
  );
}

export default UpdateActivityModal;