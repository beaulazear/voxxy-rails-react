import React, { useState } from 'react';
import styled from 'styled-components';
import { FaEnvelope } from 'react-icons/fa';

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

const InputContainer = styled.div`
  text-align: left;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #f4f4f4;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ddd;
`;

const Icon = styled(FaEnvelope)`
  margin-right: 0.5rem;
  color: #999;
`;

const Input = styled.input`
  flex: 1;
  border: none;
  background: none;
  font-size: 1rem;
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
  border-radius: 8px;
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

const Link = styled.a`
  color: #a488f4;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const EmailSentContainer = styled.div`
  text-align: center;
`;

const EmailIcon = styled.div`
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  background: #ede5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    fetch(`${API_URL}/password_reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password_reset: { email } }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to send reset email');
        return res.json();
      })
      .then(() => setEmailSent(true))
      .catch((err) => setError(err.message));
  };

  return (
    <Container>
      {!emailSent ? (
        <>
          <Title>Reset password</Title>
          <Subtitle>Enter your email to receive a password reset link</Subtitle>
          <form onSubmit={handleSubmit}>
            <InputContainer>
              <Label>Email</Label>
              <InputWrapper>
                <Icon />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputWrapper>
            </InputContainer>
            {error && <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
            <Button type="submit">Send reset link</Button>
          </form>
          <LinkText>
            Remember your password? <Link href="/login">Sign in</Link>
          </LinkText>
        </>
      ) : (
        <EmailSentContainer>
          <EmailIcon>
            <FaEnvelope color="#a488f4" size={24} />
          </EmailIcon>
          <Title>Check your email</Title>
          <Subtitle>We've sent you a verification link to your email address</Subtitle>
          <LinkText>
            Didn't receive the email? <Link href="#">Click to resend</Link>
          </LinkText>
          <LinkText>
            <Link href="/login">Back to login</Link>
          </LinkText>
        </EmailSentContainer>
      )}
    </Container>
  );
};

export default ForgotPassword;