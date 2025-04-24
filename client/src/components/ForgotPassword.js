import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography';

// ─── Styled components (copied from SignUp) ─────────────────────────────────

const SectionContainer = styled.section`
  min-width: 350px;
  background-color: ${colors.backgroundTwo};
  padding: 1rem .5rem;
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

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5.5rem;
  background-color: #251C2C;
  min-height: 100vh;
`;

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

const Divider = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.5rem auto;
  width: 100%;
  max-width: 400px;
  text-align: center;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #444;
  }

  span {
    margin: 0 1.5rem;
    font-size: 1.2rem;
    color: #ccc;
    white-space: nowrap;
  }
`;

const Footer = styled.div`
  text-align: center;
  width: 100%;
  padding: 2rem 1rem;

  button {
    border: 1px solid #9D60F8;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 50px;
    background: transparent;
    cursor: pointer;
    margin-top: 1.5rem;
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
    color: #9D60F8;
    transition: background 0.3s ease;

    &:hover {
      background: rgba(157, 96, 248, 0.1);
    }
  }

  ul.errors {
    color: #f88;
    margin-top: 1rem;
    font-size: 0.875rem;
    text-align: left;
    padding-left: 1rem;
  }
`;

// ─── ForgotPassword Component ───────────────────────────────────────────────────

const ForgotPassword = () => {
  const navigate = useNavigate();
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
      .then(res => {
        if (!res.ok) throw new Error('Failed to send reset email');
        return res.json();
      })
      .then(() => {
        setEmailSent(true);
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 30000);
      })
      .catch(err => setError(err.message));
  };

  return (
    <PageContainer>
      <SectionContainer>
        <SectionInner>
          <Title>Reset your password</Title>
          <Subtitle>
            Enter your email below and we’ll send you a link to reset your password.
          </Subtitle>
        </SectionInner>
      </SectionContainer>

      <FormContainer>
        {!emailSent ? (
          <Form onSubmit={e => { e.preventDefault(); sendResetEmail(); }}>
            <InputGroup>
              <label htmlFor="reset-email">Your email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </InputGroup>

            {error && (
              <ul className="errors">
                <li>{error}</li>
              </ul>
            )}

            <SubmitButton type="submit">
              Send reset link
            </SubmitButton>
          </Form>
        ) : (
          <Form onSubmit={e => e.preventDefault()}>
            <span style={{color: '#fff'}}>
              Check your inbox for a link to reset your password.
            </span>

            <SubmitButton
              type="button"
              onClick={sendResetEmail}
              disabled={resendDisabled}
            >
              {resendDisabled ? 'Reset link emailed...' : 'Resend email'}
            </SubmitButton>
          </Form>
        )}
      </FormContainer>

      <Footer>
        <Divider>
          <span>Remembered it?</span>
        </Divider>
        <button onClick={() => navigate('/login')}>
          Sign in
        </button>
      </Footer>
    </PageContainer>
  );
};

export default ForgotPassword;