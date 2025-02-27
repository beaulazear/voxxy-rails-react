import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 400px;
  margin: 3rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-family: 'Inter', sans-serif;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #a488f4;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background-color: #8b6fe8;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const SuccessContainer = styled.div`
  text-align: center;
`;

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token. Please check your email again.');
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    fetch(`${API_URL}/password_reset`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to reset password');
        return res.json();
      })
      .then(() => {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      })
      .catch((err) => setError(err.message));
  };

  return (
    <Container>
      {!success ? (
        <>
          <Title>Reset your password</Title>
          <Subtitle>Enter your new password below</Subtitle>
          <form onSubmit={handleSubmit}>
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit">Reset Password</Button>
          </form>
        </>
      ) : (
        <SuccessContainer>
          <Title>Password reset successful</Title>
          <Subtitle>You’ll be redirected to login shortly...</Subtitle>
        </SuccessContainer>
      )}
    </Container>
  );
};

export default ResetPassword;