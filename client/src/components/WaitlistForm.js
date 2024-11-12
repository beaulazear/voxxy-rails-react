import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Import fonts for styling
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
`;

const Heading = styled.h2`
  font-size: 2rem;
  font-family: 'Caveat', cursive;
  color: #333;
  margin-bottom: 1rem;

  @media (min-width: 600px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  font-family: 'Roboto', sans-serif;
  color: #555;
  max-width: 600px;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (min-width: 600px) {
    font-size: 1.5rem;
  }
`;

const FormContainer = styled.div`
  max-width: 400px;
  width: 100%;
  background: #fafafa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  padding: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 0.75rem;
  margin-top: 0.75rem;
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
        navigate('/infopage')
      })
      .catch((error) => {
        console.error('Error adding waitlist member:', error);
      });
  };

  return (
    <>
      <GlobalStyle />
      <PageContainer>
        <Heading>Ready to Supercharge Your Customer Insights?</Heading>
        <Subtitle>
          Join our waitlist for an exclusive opportunity to experience Voxxy’s AI-driven customer interviews firsthand.
        </Subtitle>
        <FormContainer>
          <Form onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <SubmitButton type="submit">Submit</SubmitButton>
          </Form>
        </FormContainer>
      </PageContainer>
    </>
  );
};

export default WaitlistForm;