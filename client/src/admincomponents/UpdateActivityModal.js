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

const ErrorList = styled.ul`
  background: #ffe6e6;
  color: #900;
  border: 1px solid #f5c2c2;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  li { margin-left: 1rem; }
`;

function UpdateActivityModal({ activity, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    activity_name: activity.activity_name || "",
    activity_location: activity.activity_location || "",
    date_notes: activity.date_notes || "",
    date_day: activity.date_day || "",
    date_time: activity.date_time || "",
    welcome_message: activity.welcome_message || "",
  });
  const [errors, setErrors] = useState([]);


  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || [data.error] || ["Unknown error"]);
      } else {
        onUpdate(data);
        onClose();
      }
    } catch (err) {
      setErrors([err.message]);
    }
  }

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h2>Update Activity</h2>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        {errors.length > 0 && (
          <ErrorList>
            {errors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ErrorList>
        )}

        <Form onSubmit={handleSubmit}>
          <Label>Activity Name</Label>
          <Input
            type="text"
            name="activity_name"
            value={formData.activity_name}
            onChange={handleChange}
            required
          />

          <Label>Location</Label>
          <Input
            type="text"
            name="activity_location"
            value={formData.activity_location}
            onChange={handleChange}
            required
          />

          <Label>Time of Day</Label>
          <Input
            type="text"
            name="date_notes"
            value={formData.date_notes}
            onChange={handleChange}
            required
          />

          <Label>Date</Label>
          <Input
            type="date"
            name="date_day"
            value={formData.date_day}
            onChange={handleChange}
          />

          <Label>Time</Label>
          <Input
            type="time"
            name="date_time"
            value={formData.date_time}
            onChange={handleChange}
          />

          <Label>Welcome Message</Label>
          <Input
            type="text"
            name="welcome_message"
            value={formData.welcome_message}
            onChange={handleChange}
          />

          <Button type="submit">Update Activity</Button>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default UpdateActivityModal;