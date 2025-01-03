import React, { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.div`
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

const SuccessMessage = styled.div`
  color: green;
  font-size: 0.875rem;
  margin-top: 1rem;
  text-align: center;
`;

const Heading = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin: 10px 0;
  margin-top: 40px;
  background: linear-gradient(to right, #6c63ff, #e942f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
`;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        fetch(`${API_URL}/password_reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password_reset: {
                    email: email,
                },
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to send reset email');
                return res.json();
            })
            .then((data) => setMessage(data.message))
            .catch((err) => setError(err.message));
    };

    return (
        <>
            <Heading>Forgot Your Password?</Heading>
            <FormContainer>
                <Form onSubmit={handleSubmit}>
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <SubmitButton type="submit">Send Reset Email</SubmitButton>
                </Form>
                {message && <SuccessMessage>{message}</SuccessMessage>}
                {error && <ErrorMessage>{error}</ErrorMessage>}
            </FormContainer>
        </>
    );
};

export default ForgotPassword;