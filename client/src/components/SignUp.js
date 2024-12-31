import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from '../context/user';

const Container = styled.div`
  max-width: 450px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fafafa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  font-family: 'Roboto', sans-serif;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  margin-top: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: border-color 0.2s;

  &:focus {
    border-color: #666;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background-color: #4b0082;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #6a1ab1;
  }
`;

const ErrorList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  color: #d32f2f;
  font-size: 0.9rem;
  font-family: 'Roboto', sans-serif;
`;

const ErrorItem = styled.li`
  margin-bottom: 0.5rem;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
  font-family: 'Roboto', sans-serif;

  @media (min-width: 600px) {
    padding: 3rem;
  }
`;

const Heading = styled.h2`
  font-size: 2rem;
  font-family: 'Unbounded', sans-serif;
  color: #4b0082;
  margin-bottom: 1.5rem;
  font-weight: 400;
`;

const SubHeading = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #555;
  line-height: 1.5;
`;

const SignUp = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = { user: { name, username, email, password } };

    fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          navigate('/');
        } else {
          // Display errors as an array
          setErrors(data.errors || ['An error occurred. Please try again.']);
        }
      })
      .catch(() => {
        setErrors(['An unexpected error occurred. Please try again.']);
      });
  };

  return (
    <>
      <FormContainer>
        <Heading>Sign Up for Your Account</Heading>
        <SubHeading>
          Create your account to access personalized features and manage your profile.
        </SubHeading>
      </FormContainer>
      <Container>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
          <SubmitButton type="submit">Sign Up</SubmitButton>
        </Form>
        {errors.length > 0 && (
          <ErrorList>
            {errors.map((error, index) => (
              <ErrorItem key={index}>{error}</ErrorItem>
            ))}
          </ErrorList>
        )}
      </Container>
    </>
  );
};

export default SignUp;