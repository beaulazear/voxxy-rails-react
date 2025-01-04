import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';
import styled from 'styled-components';

// 🌟 Page Container
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
`;

// 🌟 Form Container
const FormContainer = styled.div`
  max-width: 500px;
  padding: 2.5rem;
  background: radial-gradient(ellipse at center, #e9dfff 30%, #ffffff 70%);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(173, 151, 255, 0.2);
  text-align: center;
`;

// 🌟 Heading
const Heading = styled.h1`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: bold;
  margin-bottom: 1rem;
  background: black;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

// 🌟 Subheading
const SubHeading = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  color: #555;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

// 🌟 Form
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// 🌟 Input
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

// 🌟 Submit Button
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

// 🌟 Error List
const ErrorList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  color: #d32f2f;
  font-size: 0.9rem;
`;

// 🌟 Error Item
const ErrorItem = styled.li`
  margin-bottom: 0.5rem;
`;

const SignUp = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState([]);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // 🌟 Form Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      setErrors(['Passwords do not match']);
      return;
    }

    const userData = {
      user: {
        name,
        username,
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
    };

    fetch(`${API_URL}/users`, {
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
        <Heading>Create Your Account</Heading>
        <SubHeading>Join Voxxy and start planning effortlessly!</SubHeading>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
          <SubmitButton type="submit">Sign Up</SubmitButton>
        </Form>
        {errors.length > 0 && (
          <ErrorList>
            {errors.map((error, index) => (
              <ErrorItem key={index}>{error}</ErrorItem>
            ))}
          </ErrorList>
        )}
      </FormContainer>
    </PageContainer>
  );
};

export default SignUp;