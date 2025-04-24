import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography';

// ─── Shared layout & typography ────────────────────────────────────────────────
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5.5rem;
  background-color: #251C2C;
  min-height: 100vh;
`;

const SectionContainer = styled.section`
  min-width: 350px;
  background-color: ${colors.backgroundTwo};
  padding: 1rem 0.5rem;
  text-align: center;
  color: ${colors.textPrimary};
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.6rem, 5vw, 2.8rem);
  max-width: 1000px;
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
`;

const Subtitle = styled(MutedText)`
  font-size: 1rem;
  max-width: 600px;
  margin: 0.5rem auto 3rem auto;
  line-height: 1.6;
`;

// ─── Form styling ─────────────────────────────────────────────────────────────
const FormContainer = styled.div`
  max-width: 400px;
  min-width: 350px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  text-align: left;
  width: 93%;

  label {
    font-size: 0.875rem;
    color: #ccc;
    margin-bottom: 0.25rem;
    display: block;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #444;
    border-radius: 8px;
    background-color: #222;
    color: #fff;
    transition: border-color 0.2s ease;

    &:focus {
      border-color: #9D60F8;
      outline: none;
    }
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background: linear-gradient(135deg, #9D60F8, #B279FA);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  width: 100%;
  transition: background 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #8b4ee4, #a070e8);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
  }
`;

const ErrorList = styled.ul`
  color: #f88;
  margin-top: 1rem;
  font-size: 0.875rem;
  text-align: left;
  padding-left: 1rem;
`;

const SuccessContainer = styled.div`
  text-align: center;
  padding: 2rem 0;
`;

// ─── Component ───────────────────────────────────────────────────────────────
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
    setError('');

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
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch((err) => setError(err.message));
  };

  return (
    <PageContainer>
      <SectionContainer>
        <SectionInner>
          <Title>Reset your password</Title>
          <Subtitle>Enter your new password below</Subtitle>
        </SectionInner>
      </SectionContainer>

      <FormContainer>
        {!success ? (
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </InputGroup>

            <InputGroup>
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />
            </InputGroup>

            {error && (
              <ErrorList>
                <li>{error}</li>
              </ErrorList>
            )}

            <SubmitButton type="submit">Reset Password</SubmitButton>
          </Form>
        ) : (
          <SuccessContainer>
            <Title>Password reset successful</Title>
            <Subtitle>You’ll be redirected to login shortly...</Subtitle>
          </SuccessContainer>
        )}
      </FormContainer>
    </PageContainer>
  );
};

export default ResetPassword;
