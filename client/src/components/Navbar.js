import React, { useContext } from 'react';
import styled from 'styled-components';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { UserContext } from '../context/user';

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 50px;
  background-color: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  top: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const Logo = styled(NavLink)`
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(to right, #4f46e5, #4f46e5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const StyledButton = styled(Button)`
  font-size: 16px;
  background-color: white;
  color: black;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e8def8 !important;
  }

  &:focus {
    background-color: #e8def8;
  }
`;

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (confirmation) {
      fetch(`${API_URL}/logout`, {
        method: "DELETE",
        credentials: 'include',
      }).then(() => {
        setUser(null);
        navigate('/');
      });
    }
  };

  return (
    <NavbarContainer>
      <Logo to="/">VOXXY</Logo>
      <MenuContainer>
        {user && (
          <>
            <StyledButton onClick={handleLogout}>
              <NavLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Logout</NavLink>
            </StyledButton>
          </>
        )}
        {!user && (
          <>
            <StyledButton>
              <NavLink to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Sign Up</NavLink>
            </StyledButton>
            <StyledButton>
              <NavLink to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Log In</NavLink>
            </StyledButton>
          </>
        )}
      </MenuContainer>
    </NavbarContainer>
  );
};

export default Navbar;