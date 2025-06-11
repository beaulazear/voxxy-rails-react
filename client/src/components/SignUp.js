import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography';
import { Sparkles } from 'lucide-react';
import mixpanel from 'mixpanel-browser';

const SectionContainer = styled.section`
  min-width: 350px;
  background-color: transparent;
  padding: 6rem 3rem 2rem;
  margin-top: 20px;
  text-align: center;
  color: ${colors.textPrimary};
  @media (max-width: 600px) {
    padding: 4rem 2rem 1rem;
  }
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Subtitle = styled(MutedText)`
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto 1.5rem auto;
  line-height: 1.6;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2rem auto 1.5rem auto;
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
    font-size: 0.9rem;
    color: #888;
    white-space: nowrap;
    font-weight: 400;
  }
`;

const LoginPrompt = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  button {
    background: transparent;
    border: 1px solid #cc31e8;
    color: #cc31e8;
    padding: 0.6rem 2rem;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(204, 49, 232, 0.1);
      transform: translateY(-1px);
    }
  }
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #201925;
  padding: 0 1rem;
`;

const FormContainer = styled.div`
  max-width: 900px;
  min-width: 300px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2rem;
  
  @media (max-width: 600px) {
    max-width: 100%;
    padding: 0 1rem;
  }
`;

const Heading = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #FFFFFF;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
  
  @media (max-width: 600px) {
    max-width: 100%;
  }
`;

const InputGroup = styled.div`
  text-align: left;
  width: 100%;

  label {
    font-size: 1rem;
    color: #FFFFFF;
    font-weight: 500;
    margin-bottom: 0.25rem;
    display: block;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.9rem;
    border: 2px solid #442f4f;
    border-radius: 10px;
    background-color: #211825;
    color: #fff;
    transition: all 0.3s ease;
    box-sizing: border-box;

    &:focus {
      border-color: #cc31e8;
      outline: none;
      box-shadow: 0 0 0 3px rgba(204, 49, 232, 0.1);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: #cc31e8;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    background: rgb(232, 49, 226);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(204, 49, 232, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const TermsNote = styled.p`
  font-size: 0.875rem;
  color: #ccc;
  margin-top: 1.5rem;
  line-height: 1.5;

  a {
    color: #cc31e8;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorList = styled.ul`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  list-style: none;
  
  li {
    color: #fca5a5;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &::before {
      content: '•';
      margin-right: 0.5rem;
      color: #ef4444;
    }
  }
`;

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const invitedEmail = searchParams.get("invited_email") || "";

  const [name, setName] = useState('');
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState([]);

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Signup Page Loaded');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      setErrors(['Passwords do not match']);
      return;
    }

    const userData = {
      user: { name, email, password, password_confirmation: passwordConfirmation },
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        if (process.env.NODE_ENV === 'production') {
          mixpanel.track('Signup form completed, account created', {
            userId: data.id,
          });
        }

        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
        });

        navigate('/boards');
      } else {
        setErrors(data.errors || ['An error occurred. Please try again.']);
      }
    } catch {
      setErrors(['An unexpected error occurred. Please try again.']);
    }
  };

  return (
    <PageContainer>
      <SectionContainer>
        <SectionInner>
          <Title>
            <Sparkles size={28} style={{ color: '#cc31e8' }} />
            Be one of the first to experience Voxxy!
          </Title>
          <Subtitle>
            As a beta user, you'll get early access to new features, special perks, and a direct line to share feedback.
          </Subtitle>

          <Divider>
            <span>Already have an account?</span>
          </Divider>

          <LoginPrompt>
            <button type="button" onClick={() => navigate('/login')}>
              Sign in instead
            </button>
          </LoginPrompt>
        </SectionInner>
      </SectionContainer>

      <FormContainer>
        <Heading>Create your account</Heading>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              readOnly={!!invitedEmail}
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              required
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="passwordConfirmation">Confirm Password</label>
            <input
              id="passwordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </InputGroup>

          <SubmitButton type="submit">Create Account</SubmitButton>
        </Form>

        <TermsNote>
          By creating an account, you agree to our{' '}
          <a href="/#terms">Terms of Service</a> and <a href="/#privacy">Privacy Policy</a>.
        </TermsNote>

        {errors.length > 0 && (
          <ErrorList>
            {errors.map((error, index) => <li key={index}>{error}</li>)}
          </ErrorList>
        )}
      </FormContainer>
    </PageContainer>
  );
};

export default SignUp;