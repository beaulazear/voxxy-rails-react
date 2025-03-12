import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Tom from '../assets/Tom.png';

const flyAnimation = keyframes`
  0% {
    transform: translate(-10vw, 60vh) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(110vw, -10vh) scale(1.5);
    opacity: 0;
  }
`;

const Bird = styled.img`
  position: fixed;
  bottom: 30vh;
  left: -10vw;
  width: 250px;
  height: auto;
  opacity: 0;
  filter: drop-shadow(10px 10px 15px rgba(0, 0, 0, 0.4));
  animation: ${({ $isFlying }) => ($isFlying ? flyAnimation : 'none')} 2s ease-in-out forwards;
  z-index: 1000;
`;

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
  padding: 1rem; /* 🔹 Ensures space on small screens */
  overflow-y: auto; /* 🔹 Allows scrolling when modal is too tall */
`;

const ModalContainer = styled.div`
  background: white;
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
  animation: fadeIn 0.2s ease-in-out;
  max-height: 80vh; /* 🔹 Prevents the modal from being too tall */
  overflow-y: auto;
  padding-bottom: 2rem; /* 🔹 Prevents overlap with the footer */

  @media (max-width: 480px) {
    width: 90%;
    max-width: 95%;
    padding: 1.25rem;
    max-height: 80vh;
  }

  @media (max-width: 320px) { /* 🔹 Extra small devices */
    width: 95%;
    max-width: 100%;
    padding: 1rem;
    max-height: 75vh;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -55%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  color: #666;
  transition: color 0.2s ease;

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
  color: #333;
`;

const Input = styled.input`
  width: 90%;
  padding: 0.6rem;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9f9f9;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #6c5ce7;
    background: white;
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 90%;
  padding: 0.6rem;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9f9f9;
  resize: vertical;
  min-height: 80px;

  &:focus {
    border-color: #6c5ce7;
    background: white;
    outline: none;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.85rem;
  margin-top: 0.2rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: background 0.2s ease;

  ${(props) =>
    props.$primary
      ? `background: #6c5ce7; color: white;`
      : `background: #e0e0e0; color: black;`}

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
  });

  const [isFlying, setIsFlying] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(
            data.errors.reduce((acc, err) => {
              if (err.toLowerCase().includes("date day")) {
                acc.date_day = err;
              } else if (err.toLowerCase().includes("time")) {
                acc.date_time = err;
              } else {
                acc.general = err;
              }
              return acc;
            }, {})
          );
        } else {
          setError("Failed to update activity. Please try again.");
        }
        throw new Error("Validation errors");
      }

      setIsFlying(true);

      setTimeout(() => {
        onUpdate(data);
        setIsFlying(false);
        onClose();
      }, 2100);
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  }

  return (
    <>
      {isFlying && <Bird src={Tom} $isFlying={isFlying} alt="Flying bird" />}
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
            {fieldErrors.date_day && <ErrorText>{fieldErrors.date_day}</ErrorText>}

            <Label>Time</Label>
            <Input type="time" name="date_time" value={formData.date_time} onChange={handleChange} />
            {fieldErrors.date_time && <ErrorText>{fieldErrors.date_time}</ErrorText>}

            <Label>Welcome Message</Label>
            <TextArea name="welcome_message" value={formData.welcome_message} onChange={handleChange} />
            {fieldErrors.general && <ErrorText>{fieldErrors.general}</ErrorText>}

            {error && <ErrorText>{error}</ErrorText>}

            <ButtonGroup>
              <Button $primary type="submit">Update Activity Details</Button>
            </ButtonGroup>
          </Form>
        </ModalContainer>
      </ModalOverlay>
    </>
  );
}

export default UpdateActivityModal;