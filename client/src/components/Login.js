import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';
import mixpanel from 'mixpanel-browser';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
`;

const FormContainer = styled.div`
  max-width: 400px;
  padding: 2rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Heading = styled.h1`
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
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
    color: #333;
    margin-bottom: 0.25rem;
    display: block;
  }

  input {
    width: 93%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;

    &:focus {
      border-color: #6c63ff;
      outline: none;
    }
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background: #d8b4ff;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #cfa8f7;
  }

  &:disabled {
    background: #f2e7ff;
    cursor: not-allowed;
  }
`;

const TextLink = styled.p`
  font-size: 0.875rem;
  color: #555;
  margin-top: 1rem;

  a {
    color: #6c63ff;
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
  margin: 2rem auto;
  width: 100%;
  max-width: 400px;
  text-align: center;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ddd;
  }

  span {
    margin: 0 1.5rem;
    font-size: 1.2rem;
    color: #555;
    white-space: nowrap;
  }
`;

const Footer = styled.div`
  text-align: center;
  width: 100%;
  padding: 0 1rem;

  button {
    border: 1px solid #000;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 50px;
    background: transparent;
    cursor: pointer;
    margin-top: 1rem;
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;

    &:hover {
      background: #f9f9f9;
    }
  }

  p {
    font-size: 0.875rem;
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
      navigate('/boards')
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const sessionData = { email, password };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log in');
      }

      const data = await response.json();

      setUser(data);

      if (process.env.NODE_ENV === "production") {
        mixpanel.identify(data.id);
        mixpanel.people.set({
          "$name": data.name,
          "$email": data.email,
          "$created": data.created_at,
          "confirmed_at": data.confirmed_at
        });
        mixpanel.track("User Logged In", {
          "user_id": data.id,
          "email": data.email
        });
      }

      const urlParams = new URLSearchParams(location.search);
      const redirectPath = urlParams.get('redirect');

      if (redirectPath === "boards") {
        navigate("/boards");
      } else {
        navigate("/");
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
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <TextLink>
          By continuing, you agree to the{' '}
          <a href="/terms">Terms of use</a> and <a href="/privacy">Privacy Policy</a>.
        </TextLink>
        <TextLink>
          <span
            onClick={() => navigate("/forgot-password")}
            style={{ cursor: "pointer", textDecoration: "underline", color: "blue" }}
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
          <a href="/terms">Terms of Service</a> | <a href="/privacy">Privacy Policy</a>
        </p>
      </Footer>
    </PageContainer>
  );
};

export default Login;