import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';
import mixpanel from 'mixpanel-browser';
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography'; // ✅ optional if you want to use Heading components
import { Sparkles } from 'lucide-react';


const SectionContainer = styled.section`
  min-width: 350px;
  background-color: transparent;
  padding: 9rem 3rem 3rem;
  text-align: center;
  color: ${colors.textPrimary};
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;

`;

const Title = styled(Heading1)`
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  margin-bottom: 1rem;
  color: ${colors.textPrimary};
  
`;

const Subtitle = styled(MutedText)`
  font-size: 1.1rem;
  max-width: 750px;
  margin: 0.5rem auto 0rem auto;
  line-height: 1.6;
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
  max-width: 400px;
  width: 100%;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2rem;
  background: transparent;
  box-shadow: none;
  padding: 0;
`;

const Heading = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #fff;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  text-align: left;
  width: 100%;
  margin-bottom: 0.1rem;

  label {
    font-size: 1rem;
    color: #fff;
    margin-bottom: 0.3rem;
    display: block;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: .5rem;
    font-size: 1rem;
    border: 1.5px solid  #592566;
    border-radius: 8px;
    background-color: #211825;
    color: #fff;
    transition: border-color 0.2s;

    &:focus {
      border-color: #cc31e8;
      outline: none;
    }
  }
`;


const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background: #cc31e8;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  width: 100%;
  transition: background 0.3s ease;

  &:hover {
    background:rgb(232, 49, 226);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
  }
`;

const TextLink = styled.p`
  font-size: 0.95rem;
  color: #ccc;
  margin-top: 1.25rem;

  a, span {
    color: #cc31e8;
    text-decoration: none;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
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
    border: 1.5px solid #cc31e8;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 50px;
    background: transparent;
    cursor: pointer;
    margin-top: 1.5rem;
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
    color: #cc31e8;
    font-weight: 600;
    transition: background 0.3s, color 0.3s;

    &:hover {
      background: rgba(157, 96, 248, 0.1);
      color: #fff;
    }
  }

  p {
    font-size: 0.875rem;
    color: #ccc;
    margin-top: 1rem;
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
      <SectionContainer>
        <SectionInner>
          <Title><Sparkles size={28} style={{color: '#cc31e8', height: 'fit-content'}}/> Welcome to Voxxy Beta</Title>
          <Subtitle>You’re getting full access to the Voxxy experience and joining us as we rapidly grow and evolve. As an early user, your feedback will directly shape our product direction and help build the future of group planning.</Subtitle>
        </SectionInner>
      </SectionContainer>
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
          <a href="/#terms">Terms of use</a> and{' '}
          <a href="/#privacy">Privacy Policy</a>.
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
          <a href="/terms" style={{ color: '#cc31e8' }}>
            Terms of Service
          </a>{' '}
          |{' '}
          <a href="/privacy" style={{ color: '#cc31e8' }}>
            Privacy Policy
          </a>
        </p>
      </Footer>
    </PageContainer>
  );
};

export default Login;