import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';
import mixpanel from 'mixpanel-browser';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem; /* Increased top padding from 2rem to 4rem */
  background-color: #0D0B1F;
  min-height: 100vh;
`;

const FormContainer = styled.div`
  max-width: 400px;
  padding: 2rem;
  background: #17132F;
  border: 1px solid #333;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  margin-bottom: 2rem; /* Add spacing between the form and the footer */
`;

const Heading = styled.h1`
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #FFFFFF;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  text-align: left;

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

const TextLink = styled.p`
  font-size: 0.875rem;
  color: #ccc;
  margin-top: 1rem;

  a {
    color: #9D60F8;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: .5rem auto;
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

// Updated Footer with additional top padding for extra space around its elements
const Footer = styled.div`
  text-align: center;
  width: 100%;
  padding: 2rem 1rem;  /* Increased padding from 0 1rem to 2rem 1rem */

  button {
    border: 1px solid #9D60F8;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 50px;
    background: transparent;
    cursor: pointer;
    margin-top: 1.5rem;  /* Added extra top margin */
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
    color: #9D60F8;
    transition: background 0.3s ease;

    &:hover {
      background: rgba(157, 96, 248, 0.1);
    }
  }

  p {
    font-size: 0.875rem;
    color: #ccc;
    margin-top: 1rem; /* Extra space above the terms */
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

      if (process.env.NODE_ENV === 'production') {
        mixpanel.identify(data.id);
        mixpanel.people.set({
          '$name': data.name,
          '$email': data.email,
          '$created': data.created_at,
          'confirmed_at': data.confirmed_at,
        });
        mixpanel.track('User Logged In', {
          user_id: data.id,
          email: data.email,
        });
      }

      const urlParams = new URLSearchParams(location.search);
      const redirectPath = urlParams.get('redirect');

      if (redirectPath === 'boards') {
        navigate('/boards');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <PageContainer>
      <FormContainer>
        <Heading>Log in to your account</Heading>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <label htmlFor="password">Your password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </InputGroup>
          <SubmitButton type="submit">Log in</SubmitButton>
        </Form>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        <TextLink>
          By continuing, you agree to the{' '}
          <a href="/terms">Terms of use</a> and{' '}
          <a href="/privacy">Privacy Policy</a>.
        </TextLink>
        <TextLink>
          <span
            onClick={() => navigate('/forgot-password')}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Forgot Password?
          </span>
        </TextLink>
      </FormContainer>
      <Footer>
        <Divider>
          <span>New to our community?</span>
        </Divider>
        <button onClick={() => navigate('/signup')}>Create an account</button>
        <p>
          <a href="/terms" style={{ color: '#9D60F8' }}>
            Terms of Service
          </a>{' '}
          |{' '}
          <a href="/privacy" style={{ color: '#9D60F8' }}>
            Privacy Policy
          </a>
        </p>
      </Footer>
    </PageContainer>
  );
};

export default Login;