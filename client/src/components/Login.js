import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 450px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fafafa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  font-family: 'Roboto', sans-serif;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
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
  background-color: #4b0082;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #6a1ab1;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 0.875rem;
  margin-top: 1rem;
  text-align: center;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
  font-family: 'Roboto', sans-serif;

  @media (min-width: 600px) {
    padding: 3rem;
  }
`;

const Heading = styled.h2`
  font-size: 2rem;
  font-family: 'Unbounded', san-serif;
  color: #4b0082;
  margin-bottom: 1.5rem;
  font-weight: 400;
`;

const Login = () => {
  const [email, setEmail] = useState(''); // Renamed from username
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for error message
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const sessionData = { email, password }; // Use email instead of username

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sessionData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || 'Failed to log in');
          });
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        navigate('/');
      })
      .catch((error) => {
        console.error('Error:', error);
        setError(error.message); // Display error under form
      });
  };

  return (
    <>
      <FormContainer>
        <Heading>Log in to access your account!</Heading>
      </FormContainer>
      <Container>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <SubmitButton type="submit">Log In</SubmitButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
      </Container>
    </>
  );
};

export default Login;