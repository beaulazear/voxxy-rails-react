import React, { useContext } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { Button } from 'antd';
import { QuestionCircleOutlined } from "@ant-design/icons";
import { UserContext } from '../context/user';
import Voxxy_header from '../assets/Voxxy_header.jpeg'

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
  color: black;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
    color: #e0e0e0;
  }
`;

const LogoLink = styled(NavLink)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoImage = styled.img`
  max-width: 150px; /* Adjust size */
  width: auto;
  height: 40px;
  
  @media (max-width: 768px) {
    max-width: 120px; /* Slightly smaller for mobile */
    height: 35px;
  }
`;

const Navbar = () => {
  const { user } = useContext(UserContext);

  return (
    <NavbarContainer>
      <LogoLink to="/">
        <LogoImage src={Voxxy_header} alt="Voxie Logo" />
      </LogoLink>
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