// src/components/UserForm.js
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 400px;
  margin: auto;
  padding: 30px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
`;

const Input = styled.input`
  margin-bottom: 15px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;

  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
  }
`;

const Button = styled.button`
  padding: 12px;
  border: none;
  border-radius: 5px;
  background: #007bff;
  color: white;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background: #0056b3;
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
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-top: 10px;
  background-color: #f8f8f8;
  color: black;  // Change text color to black
`;

const Title = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333; // Darker color for better readability
  text-align: center;
`;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; // Fallback for local development

const UserForm = () => {
  const [name, setName] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch(`${API_URL}/users`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error('Failed to fetch users:', error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = { user: { name } };

    fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        setName(''); // Clear the input field
        fetchUsers(); // Refresh user list
      })
      .catch((error) => {
        console.error('Error adding user:', error);
      });
  };

  const handleDelete = (id) => {
    fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Use .text() to handle non-JSON responses
      })
      .then(() => {
        fetchUsers(); // Refresh user list after deletion
      })
      .catch((error) => {
        console.error('Error deleting user:', error);
      });
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Enter user name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button type="submit">Add User</Button>
      </Form>
      <Title>Users:</Title>
      <UserList>
        {users.map((user) => (
          <UserItem key={user.id}>
            {user.name}
            <Button onClick={() => handleDelete(user.id)}>Delete</Button>
          </UserItem>
        ))}
      </UserList>
    </Container>
  );
};

export default UserForm;