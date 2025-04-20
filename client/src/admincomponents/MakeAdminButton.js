import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import colors from '../styles/Colors';
import { UserContext } from '../context/user'; // ✅ Update path as needed

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${({ disabled }) =>
    disabled ? '#555' : colors.accent || '#9D60F8'};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  margin: 2rem auto;
  display: block;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ disabled }) =>
      disabled ? '#555' : colors.primary || '#B03FD9'};
  }
`;

const Message = styled.p`
  text-align: center;
  margin-top: 1rem;
  color: white;
`;

export default function MakeAdminButton() {
  const { user, setUser } = useContext(UserContext); // Make sure this exists
  const [message, setMessage] = useState(null);

  const isAdmin = user?.admin;

  const handleClick = () => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/make_admin`, {
      method: 'PATCH',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          window.alert(data.message);
          setUser({ ...user, admin: true }); // ✅ Update user context
        }
        setMessage(data.message || data.error);
      })
      .catch(() => {
        setMessage("Something went wrong.");
      });
  };

  return (
    <>
      <Button onClick={handleClick} disabled={isAdmin}>
        {isAdmin ? "Already Admin" : "Make Current User Admin"}
      </Button>
      {message && <Message>{message}</Message>}
    </>
  );
}