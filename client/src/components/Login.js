import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography';
import { Sparkles } from 'lucide-react';

const SectionContainer = styled.section`
  min-width: 350px;
  background-color: transparent;
  padding: 6rem 3rem 2rem;
  text-align: center;
  color: ${colors.textPrimary};
  margin-top: 20px;
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
  font-family: 'Montserrat', sans-serif;
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

const SignupPrompt = styled.div`
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

const ErrorMessage = styled.p`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #fca5a5;
  font-size: 0.875rem;
  text-align: center;
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

  &:hover:not(:disabled) {
    background: rgb(232, 49, 226);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(204, 49, 232, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.7;
  }
`;

const TextLink = styled.p`
  font-size: 0.875rem;
  color: #ccc;
  margin-top: 1.5rem;
  line-height: 1.5;

  a, span {
    color: #cc31e8;
    text-decoration: none;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ForgotPasswordLink = styled.p`
  font-size: 0.875rem;
  color: #ccc;
  margin-top: 1rem;
  text-align: center;

  span {
    color: #cc31e8;
    cursor: pointer;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      navigate('/boards');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const sessionData = { email, password };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(sessionData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log in');
      }

      const data = await response.json();

      setUser(data);

      // Track user login in backend
      fetch('/analytics/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ track_login: true }),
        credentials: 'include'
      }).catch(err => console.error('Analytics tracking failed:', err));

      const qs = location.search;

      const urlParams = new URLSearchParams(location.search);
      const redirectPath = urlParams.get('redirect');

      if (redirectPath === 'boards') {
        navigate('/boards');
      } else {
        navigate(`/${qs}`, { replace: true });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <SectionContainer>
        <SectionInner>
          <Title>
            <Sparkles size={28} style={{ color: '#cc31e8' }} />
            Welcome to Voxxy
          </Title>
          <Subtitle>
            You're getting full access to the Voxxy beta experience and joining us as we rapidly grow and evolve.
          </Subtitle>

          <Divider>
            <span>New to our community?</span>
          </Divider>

          <SignupPrompt>
            <button type="button" onClick={() => navigate('/signup')}>
              Create an account
            </button>
          </SignupPrompt>
        </SectionInner>
      </SectionContainer>

      <FormContainer>
        <Heading>Log in to your account</Heading>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </InputGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </SubmitButton>
        </Form>

        <ForgotPasswordLink>
          <span onClick={() => navigate('/forgot-password')}>
            Forgot your password?
          </span>
        </ForgotPasswordLink>

        <TextLink>
          By continuing, you agree to our{' '}
          <a href="/#terms">Terms of Service</a> and{' '}
          <a href="/#privacy">Privacy Policy</a>.
        </TextLink>
      </FormContainer>
    </PageContainer>
  );
};

export default Login;