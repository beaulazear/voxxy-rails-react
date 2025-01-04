import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
`;

const FormContainer = styled.div`
  max-width: 500px;
  margin: 3rem auto;
  padding: 2.5rem;
  background: radial-gradient(ellipse at center, #e9dfff 30%, #ffffff 70%);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(173, 151, 255, 0.2);
  text-align: center;
`;

const Heading = styled.h1`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: bold;
  margin-bottom: 1rem;
  background: black;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const SubHeading = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  color: #555;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.2s;

  &:focus {
    border-color: #6c63ff;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background: linear-gradient(135deg, #6c63ff, #e942f5);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.9;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 0.875rem;
  margin-top: 1rem;
`;

const ForgotPasswordLink = styled.button`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #6c63ff;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { setUser } = useContext(UserContext);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const sessionData = { email, password };

    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(sessionData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || 'Failed to log in');
          });
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        navigate('/');
      })
      .catch((error) => {
        console.error('Error:', error);
        setError(error.message);
      });
  };

  return (
    <PageContainer>
      <FormContainer>
        <Heading>Welcome Back!</Heading>
        <SubHeading>Log in to continue planning with Voxxy</SubHeading>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <SubmitButton type="submit">Log In</SubmitButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
        <ForgotPasswordLink onClick={() => navigate('/forgot-password')}>
          Forgot Password?
        </ForgotPasswordLink>
      </FormContainer>
    </PageContainer>
  );
};

export default Login;