import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';
import colors from "../styles/Colors";
import { Heading1, MutedText } from '../styles/Typography'; // ✅ optional if you want to use Heading components
import { Sparkles } from 'lucide-react';
import mixpanel from 'mixpanel-browser';

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

const Heading = styled.h1`
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: #FFFFFF;
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

const TermsNote = styled.p`
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

  p {
    font-size: 0.875rem;
    color: #ccc;
    margin-top: 1rem;
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
          <Title><Sparkles size={28} style={{ color: '#cc31e8', height: 'fit-content' }} /> Be one of the first to experience Voxxy!</Title>
          <Subtitle>As a beta user, you’ll get early access to new features, special perks, and a direct line to share feedback. Help shape the future of group planning as we grow and improve together.</Subtitle>
        </SectionInner>
      </SectionContainer>
      <FormContainer>
        <Heading>Create an account</Heading>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <label htmlFor="name">What should we call you?</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <label htmlFor="email">What’s your email?</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!invitedEmail}
            />
          </InputGroup>
          <InputGroup>
            <label htmlFor="password">Create a password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <label htmlFor="passwordConfirmation">Confirm your password</label>
            <input
              id="passwordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
          </InputGroup>
          <SubmitButton type="submit">Create an account</SubmitButton>
        </Form>
        <TermsNote>
          By creating an account, you agree to the{' '}
          <a href="/terms">Terms of use</a> and <a href="/privacy">Privacy Policy</a>.
        </TermsNote>
        {errors.length > 0 && (
          <ul style={{ color: 'red', marginTop: '1rem', fontSize: '0.875rem' }}>
            {errors.map((error, index) => <li key={index}>{error}</li>)}
          </ul>
        )}
      </FormContainer>
      <Footer>
        <Divider>
          <span>Already have an account?</span>
        </Divider>
        <button onClick={() => navigate('/login')}>Log in</button>
      </Footer>
    </PageContainer>
  );
};

export default SignUp;