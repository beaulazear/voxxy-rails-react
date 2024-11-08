import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  max-width: 380px;
  margin: 1.5rem auto 0;
  padding: 1.5rem;
  background: #fafafa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;

  @media (min-width: 600px) {
    max-width: 450px;
    padding: 2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  margin-top: 0.25rem;
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
  background-color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #555;
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
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
  text-align: center;
  font-weight: 500;
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

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const UserForm = () => {
  const [name, setName] = useState('');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch(`${API_URL}/users`)
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then(setUsers)
      .catch((error) => console.error("Failed to fetch users:", error));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { name } }),
    })
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then(() => {
        setName('');
        fetchUsers();
        navigate("/infopage");
      })
      .catch((error) => console.error("Error adding user:", error));
  };

  const handleDelete = (id) => {
    fetch(`${API_URL}/users/${id}`, { method: "DELETE" })
      .then((response) => response.ok ? fetchUsers() : Promise.reject(response))
      .catch((error) => console.error("Error deleting user:", error));
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <SubmitButton type="submit">Submit</SubmitButton>
      </Form>
      <Title>Current waitlist:</Title>
      <UserList>
        {users.map((user) => (
          <UserItem key={user.id}>
            {user.name}
            <DeleteButton onClick={() => handleDelete(user.id)}>Delete</DeleteButton>
          </UserItem>
        ))}
      </UserList>
    </Container>
  );
};

export default UserForm;