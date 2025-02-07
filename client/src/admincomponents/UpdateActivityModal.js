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
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  text-align: left;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  label {
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;

  ${(props) =>
        props.$primary
            ? `background: #6c5ce7; color: white;`
            : `background: #dcdcdc; color: black;`}

  &:hover {
    opacity: 0.9;
  }
`;

function UpdateActivityModal({ activity, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        activity_name: activity.activity_name,
        activity_location: activity.activity_location,
        group_size: activity.group_size,
        date_notes: activity.date_notes,
    });

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleSubmit(e) {
        e.preventDefault();

        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activity.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData),
        })
            .then((res) => res.json())
            .then((updatedActivity) => {
                onUpdate(updatedActivity); // Update parent state
                onClose(); // Close modal
            })
            .catch((error) => console.error('Error updating activity:', error));
    }

    return (
        <ModalOverlay>
            <ModalContainer>
                <h2>Update Activity</h2>
                <Form onSubmit={handleSubmit}>
                    <label>Activity Name</label>
                    <input type="text" name="activity_name" value={formData.activity_name} onChange={handleChange} required />

                    <label>Location</label>
                    <input type="text" name="activity_location" value={formData.activity_location} onChange={handleChange} required />

                    <label>Group Size</label>
                    <input type="number" name="group_size" value={formData.group_size} onChange={handleChange} required />

                    <label>Time of Day</label>
                    <input type="text" name="date_notes" value={formData.date_notes} onChange={handleChange} required />

                    <ButtonGroup>
                        <Button type="button" onClick={onClose}>Cancel</Button>
                        <Button $primary type="submit">Save</Button>
                    </ButtonGroup>
                </Form>
            </ModalContainer>
        </ModalOverlay>
    );
}

export default UpdateActivityModal;