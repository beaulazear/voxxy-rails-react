import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  max-width: 380px;
  margin: 1.5rem auto 0;
  padding: 1.5rem;
  background: #fafafa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;

  @media (min-width: 600px) {
    max-width: 450px;
    padding: 2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  margin-top: 0.25rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: border-color 0.2s;

  &:focus {
    border-color: #666;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background-color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #555;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  text-align: center;

  @media (min-width: 600px) {
    padding: 3rem;
  }
`;

const Heading = styled.h2`
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: #333;
  max-width: 90%;

  @media (min-width: 600px) {
    font-size: 1.75rem;
    max-width: 600px;
  }
`;

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const WaitlistForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const waitlistData = { waitlist: { name, email } };

        fetch(`${API_URL}/waitlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(waitlistData),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                setName(''); // Clear the input field
                setEmail(''); // Clear the input field
                navigate('/demo')
            })
            .catch((error) => {
                console.error('Error adding waitlist member:', error);
            });
    };

    return (
        <>
            <FormContainer>
                <Heading>
                    We’re currently offering early access to our Beta platform. Join our
                    waitlist for an exclusive opportunity to experience Voxy’s AI-driven
                    customer interviews firsthand.
                </Heading>
            </FormContainer>
            <Container>
                <Form onSubmit={handleSubmit}>
                    <Input
                        type="text"
                        placeholder="Enter name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Input
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <SubmitButton type="submit">Join Waitlist</SubmitButton>
                </Form>
            </Container>
        </>

    );
};

export default WaitlistForm;