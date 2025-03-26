import React, { useContext } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { Button } from 'antd';
import { QuestionCircleOutlined } from "@ant-design/icons";
import { UserContext } from '../context/user';
// import Voxxy_header from '../assets/Voxxy_header.jpeg'; // Logo image commented out

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 50px;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 15px 20px;
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

const IconButton = styled(NavLink)`
  font-size: 1.8rem;
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
    color: #e0e0e0;
  }
`;

const HeaderLink = styled(NavLink)`
  text-decoration: none;
`;

const VoxxyHeader = styled.h1`
  color: #fff; /* default color */
  font-size: 2rem;
  font-weight: bold;
  margin: 0;

  /* When the 'landing' class is present, override color to black */
  &.landing {
    color: #000;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Navbar = () => {
  const { user } = useContext(UserContext);

  return (
    <NavbarContainer>
      {/* Replacing logo with Voxxy text header */}
      {user ? (
        <HeaderLink to="/">
          <VoxxyHeader>Voxxy</VoxxyHeader>
        </HeaderLink>
      ) : (
        <HeaderLink to="/">
          <VoxxyHeader className='landing'>Voxxy</VoxxyHeader>
        </HeaderLink>
      )}
      <MenuContainer>
        {user && (
          <>
            <IconButton to="/faq">
              <QuestionCircleOutlined />
            </IconButton>
          </>
        )}
        {!user && (
          <>
            <StyledButton>
              <NavLink to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>
                Sign Up
              </NavLink>
            </StyledButton>
            <StyledButton>
              <NavLink to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                Log In
              </NavLink>
            </StyledButton>
          </>
        )}
      </MenuContainer>
    </NavbarContainer>
  );
};

export default Navbar;