import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  min-height: 100vh; /* Ensures the page takes up the full height */
`;

const FormContainer = styled.div`
  max-width: 400px;
  padding: 2rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  text-align: center;
`;

const Heading = styled.h1`
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem; /* Adjusted spacing between inputs */
`;

const InputGroup = styled.div`
  text-align: left;
  width: 93%; /* Ensure the input group spans the full container width */

  label {
    font-size: 0.875rem;
    color: #333;
    margin-bottom: 0.25rem;
    display: block;
  }

  input {
    width: 100%; /* Ensure the input spans the full width of the container */
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
  margin-top: 1.5rem;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background: #d8b4ff;
  border: none;
  border-radius: 50px; /* Oval shape */
  cursor: pointer;
  width: 100%; /* Matches the width of the form container */

  &:hover {
    background: #cfa8f7;
  }

  &:disabled {
    background: #f2e7ff;
    cursor: not-allowed;
  }
`;

const TermsNote = styled.p`
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
  width: 100%; /* Full width of parent */
  max-width: 400px; /* Matches the width of the form and button */
  text-align: center; /* Ensures the text and lines are centered */

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
  width: 100%; /* Ensures the footer spans the full width of the viewport */
  padding: 0 1rem; /* Adds horizontal padding to the footer */

  button {
    border: 1px solid #000;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 50px; /* Oval shape */
    background: transparent;
    cursor: pointer;
    margin-top: 1rem;
    width: 100%; /* Makes the button take the full width of the footer */
    max-width: 400px; /* Limits the button width on larger screens */
    box-sizing: border-box; /* Ensures padding doesn’t cause overflow */

    &:hover {
      background: #f9f9f9;
    }
  }

  p {
    font-size: 0.875rem;
  }
`;

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState([]);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      setErrors(['Passwords do not match']);
      return;
    }

    const userData = {
      user: {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
    };

    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          navigate('/');
        } else {
          setErrors(data.errors || ['An error occurred. Please try again.']);
        }
      })
      .catch(() => {
        setErrors(['An unexpected error occurred. Please try again.']);
      });
  };

  return (
    <PageContainer>
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
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
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