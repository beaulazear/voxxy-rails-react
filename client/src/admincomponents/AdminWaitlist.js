import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  margin-top: 0.8rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.2s;

  &:focus {
    border-color: #666;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.8rem;
  font-size: 1rem;
  color: #fff;
  background-color: #4b0082;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #6a1ab1;
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const UserCard = styled.div`
  padding: 1rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #333;
  transition: box-shadow 0.3s;
  overflow-x: auto;
  white-space: nowrap;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* Adds padding to the right to make scrolling smoother on mobile */
  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 1rem; /* Creates space between the text and delete button */
`;

const UserName = styled.div`
  font-weight: 700;
  color: #4b0082;
  font-size: 1.3rem;
`;

const UserEmail = styled.div`
  font-size: 1.1rem;
  color: #555;
`;

const DeleteButton = styled.button`
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  color: #fff;
  background-color: #ff4d4f;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #e43e3d;
  }
`;

const Title = styled.h3`
  font-size: 1.8rem;
  color: #4b0082;
  text-align: center;
  font-family: 'Unbounded', san  serif;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 400;
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
  font-size: 1.8rem;
  font-family: 'Unbounded', san serif;
  color: #4b0082;
  margin-bottom: 1.5rem;
  text-align: center;
  max-width: 650px;
  font-weight: 400;
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
            <UserCard key={waitlistMember.id}>
              <UserInfo>
                <UserName>{waitlistMember.name}</UserName>
                <UserEmail>{waitlistMember.email}</UserEmail>
              </UserInfo>
              <DeleteButton onClick={() => handleDelete(waitlistMember.id)}>Delete</DeleteButton>
            </UserCard>
          ))}
        </UserList>
      </Container>
    </>
  );
};

export default WaitlistForm;