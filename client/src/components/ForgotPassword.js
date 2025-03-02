import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

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

const LinkText = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-top: 1rem;
`;

const NewLink = styled(Link)`
  background: none;
  border: none;
  color: #a488f4;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const EmailSentContainer = styled.div`
  text-align: center;
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const sendResetEmail = () => {
    setError('');
    fetch(`${API_URL}/password_reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password_reset: { email } }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to send reset email');
        return res.json();
      })
      .then(() => {
        setEmailSent(true);
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 30000);
      })
      .catch((err) => setError(err.message));
  };

  return (
    <Container>
      {!emailSent ? (
        <>
          <Title>Reset password</Title>
          <Subtitle>Enter your email to receive a password reset link</Subtitle>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendResetEmail();
            }}
          >
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit">Send reset link</Button>
          </form>
          <LinkText>
            Remember your password? <NewLink to="/login">Sign in</NewLink>
          </LinkText>
        </>
      ) : (
        <EmailSentContainer>
          <Title>Check your email</Title>
          <Subtitle>We've sent you a verification link to your email address</Subtitle>
          <LinkText>
            Didn't receive the email?{' '}
            <Link onClick={sendResetEmail} disabled={resendDisabled}>
              {resendDisabled ? 'Wait to resend' : 'Click to resend'}
            </Link>
          </LinkText>
          <LinkText>
            <NewLink to="/login">Back to login</NewLink>
          </LinkText>
        </EmailSentContainer>
      )}
    </Container>
  );
};

export default ForgotPassword;