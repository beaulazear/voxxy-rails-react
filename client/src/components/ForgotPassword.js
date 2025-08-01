import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

// ─── Animations ────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

// ─── Enhanced Layout ────────────────────────────────────────────────
const PageContainer = styled.div`
  background: ${colors.background};
  background-image: 
    radial-gradient(circle at 30% 20%, rgba(157, 96, 248, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(204, 49, 232, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 20% 70%, rgba(89, 37, 102, 0.03) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  min-height: 100vh;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 50% 50%, rgba(157, 96, 248, 0.03) 0%, transparent 70%),
      radial-gradient(circle at 80% 20%, rgba(204, 49, 232, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: 1;
  }
`;

// ─── Glassmorphism Form Container ─────────────────────────────────
const FormContainer = styled.div`
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(157, 96, 248, 0.15);
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 480px;
  text-align: center;
  box-shadow: 
    0 15px 40px rgba(0, 0, 0, 0.3),
    0 5px 20px rgba(157, 96, 248, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.8s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(157, 96, 248, 0.04) 0%, transparent 70%);
    border-radius: 1.5rem;
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(157, 96, 248, 0.25);
    box-shadow: 
      0 20px 50px rgba(0, 0, 0, 0.35),
      0 8px 25px rgba(157, 96, 248, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }
  
  @media (max-width: 600px) {
    padding: 2.5rem 1.5rem;
  }
`;

// ─── Icon Wrapper with Gradient ─────────────────────────────────
const IconWrapper = styled.div`
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #CC31E8 0%, #9D60F8 100%);
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 
    0 8px 20px rgba(204, 49, 232, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  position: relative;
  transition: all 0.3s ease;
  animation: ${float} 3s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, #CC31E8, #9D60F8, #CC31E8);
    border-radius: 1.2rem;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: scale(1.03);
    box-shadow: 
      0 10px 25px rgba(204, 49, 232, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &::before {
      opacity: 0.6;
    }
  }
`;

// ─── Gradient Title ─────────────────────────────────────────────────
const Title = styled(Heading1)`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: 700;
  margin-bottom: 1.2rem;
  background: linear-gradient(135deg, ${colors.textPrimary} 0%, rgba(157, 96, 248, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled(MutedText)`
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
  color: ${colors.textMuted};
`;

// ─── Enhanced Form Styling ─────────────────────────────────────────
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const InputGroup = styled.div`
  text-align: left;
  width: 100%;
  position: relative;

  label {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.9rem;
    color: ${colors.textPrimary};
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
    transition: color 0.3s ease;
  }

  input {
    font-family: 'Montserrat', sans-serif;
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 0.95rem;
    border: 2px solid rgba(157, 96, 248, 0.15);
    border-radius: 0.75rem;
    background-color: rgba(33, 24, 37, 0.5);
    color: #fff;
    transition: all 0.3s ease;
    box-sizing: border-box;

    &:focus {
      border-color: rgba(204, 49, 232, 0.5);
      outline: none;
      background-color: rgba(33, 24, 37, 0.8);
      box-shadow: 
        0 0 0 4px rgba(204, 49, 232, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  &:focus-within label {
    color: rgba(204, 49, 232, 0.9);
  }
`;

// ─── Enhanced Submit Button ─────────────────────────────────────────
const SubmitButton = styled.button`
  font-family: 'Montserrat', sans-serif;
  background: linear-gradient(135deg, #CC31E8 0%, #9D60F8 100%);
  border: none;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  box-shadow: 
    0 6px 18px rgba(204, 49, 232, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 
      0 8px 22px rgba(204, 49, 232, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      box-shadow: 
        0 6px 18px rgba(204, 49, 232, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
  }
`;

// ─── Enhanced Secondary Button ─────────────────────────────────────
const SecondaryButton = styled.button`
  font-family: 'Montserrat', sans-serif;
  background: none;
  border: 2px solid rgba(157, 96, 248, 0.3);
  color: rgba(157, 96, 248, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(204, 49, 232, 0.5);
    background: rgba(157, 96, 248, 0.05);
    color: rgba(204, 49, 232, 1);
    transform: translateY(-1px);
  }
`;

// ─── Error Message with Animation ─────────────────────────────────
const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  margin-top: 0.5rem;
  color: #fca5a5;
  font-size: 0.875rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  animation: ${fadeIn} 0.3s ease-out;
  backdrop-filter: blur(10px);
`;

// ─── Success Container ─────────────────────────────────────────────
const SuccessContainer = styled.div`
  text-align: center;
  animation: ${fadeIn} 0.8s ease-out;
  
  .success-icon {
    color: #10b981;
    animation: ${float} 2s ease-in-out infinite;
  }
`;

const SuccessMessage = styled.div`
  font-family: 'Montserrat', sans-serif;
  color: ${colors.textPrimary};
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
`;

// ─── Divider ─────────────────────────────────────────────────────────
const Divider = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2rem 0 1rem 0;
  text-align: center;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(157, 96, 248, 0.2);
  }

  span {
    margin: 0 1.5rem;
    font-size: 0.9rem;
    color: ${colors.textMuted};
    white-space: nowrap;
    font-weight: 400;
  }
`;

// ─── ForgotPassword Component ───────────────────────────────────────────────────

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const sendResetEmail = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/password_reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password_reset: { email } }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reset email. Please try again.');
      }
      
      setEmailSent(true);
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 30000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <FormContainer>
        {!emailSent ? (
          <>
            <IconWrapper>
              <Mail size={32} color="white" />
            </IconWrapper>
            <Title>Forgot Your Password?</Title>
            <Subtitle>
              No worries! Enter your email below and we'll send you a secure link to reset your password.
            </Subtitle>
            
            <Form onSubmit={e => { e.preventDefault(); sendResetEmail(); }}>
              <InputGroup>
                <label htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </InputGroup>

              {error && (
                <ErrorMessage>
                  <AlertCircle size={16} />
                  {error}
                </ErrorMessage>
              )}

              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </SubmitButton>
            </Form>

            <Divider>
              <span>Remembered your password?</span>
            </Divider>
            
            <SecondaryButton onClick={() => navigate('/login')}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
              Back to Sign In
            </SecondaryButton>
          </>
        ) : (
          <SuccessContainer>
            <IconWrapper className="success-icon">
              <CheckCircle size={32} color="white" />
            </IconWrapper>
            <Title>Check Your Email!</Title>
            <SuccessMessage>
              We've sent a password reset link to <strong>{email}</strong>. 
              Check your inbox and follow the instructions to reset your password.
            </SuccessMessage>

            <SubmitButton
              type="button"
              onClick={sendResetEmail}
              disabled={resendDisabled}
            >
              {resendDisabled ? 'Email Sent - Wait 30s...' : 'Resend Email'}
            </SubmitButton>

            <Divider>
              <span>Wrong email?</span>
            </Divider>
            
            <SecondaryButton onClick={() => setEmailSent(false)}>
              Try Different Email
            </SecondaryButton>
          </SuccessContainer>
        )}
      </FormContainer>
    </PageContainer>
  );
};

export default ForgotPassword;