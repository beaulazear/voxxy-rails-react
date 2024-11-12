import React, { useEffect, useState, useContext } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { UserContext } from '../context/user';

// Import fonts globally
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');
`;

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

const UserList = styled.ul`
  list-style: none;
  padding: 0;
`;

const UserItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-top: 0.5rem;
  background-color: #f8f8f8;
  color: #333;
`;

const Title = styled.h3`
  font-size: 1.6rem;
  color: #4b0082;
  text-align: center;
  font-family: 'Caveat', cursive;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
`;

const DeleteButton = styled.button`
  padding: 0.5rem;
  font-size: 0.9rem;
  color: #fff;
  background-color: #ff4d4f;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #e43e3d;
  }
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
  font-family: 'Caveat', cursive;
  color: #4b0082;
  margin-bottom: 1.5rem;
  text-align: center;

  @media (min-width: 600px) {
    font-size: 2.5rem;
  }
`;

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const WaitlistForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [waitlist, setWaitlist] = useState([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = () => {
    fetch(`${API_URL}/waitlists`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setWaitlist(data);
      })
      .catch((error) => {
        console.error('Failed to fetch waitlist:', error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const waitlistData = { waitlist: { name, email } };

    fetch(`${API_URL}/waitlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(waitlistData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        setName('');
        setEmail('');
        fetchWaitlist();
      })
      .catch((error) => {
        console.error('Error adding waitlist member:', error);
      });
  };

  const handleDelete = (id) => {
    fetch(`${API_URL}/waitlists/${id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(() => {
        fetchWaitlist();
      })
      .catch((error) => {
        console.error('Error deleting waitlist member:', error);
      });
  };

  return (
    <>
      <GlobalStyle />
      <FormContainer>
        <Heading>
          Hi {user.name}, here is the current waitlist. Add new data manually and/or view the current waitlist data below!
        </Heading>
      </FormContainer>
      <Container>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <SubmitButton type="submit">Join Waitlist</SubmitButton>
        </Form>
        <Title>Current Waitlist:</Title>
        <UserList>
          {waitlist.map((waitlistMember) => (
            <UserItem key={waitlistMember.id}>
              {waitlistMember.name} ({waitlistMember.email})
              <DeleteButton onClick={() => handleDelete(waitlistMember.id)}>Delete</DeleteButton>
            </UserItem>
          ))}
        </UserList>
      </Container>
    </>
  );
};

export default WaitlistForm;