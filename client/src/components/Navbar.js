import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { UserContext } from '../context/user';

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 50px;
  background-color: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const Logo = styled.div`
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(to right, #4f46e5, #4f46e5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
`;

const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MenuItem = styled(NavLink)`
  font-size: 16px;
  color: black;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #9b19f5;
  }

  &.active {
    font-weight: bold;
    color: #9b19f5;
  }
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

const MobileMenuButton = styled(MenuOutlined)`
  font-size: 24px;
  color: black;
  cursor: pointer;

  @media (min-width: 768px) {
    display: none;
  }
`;

const DrawerMenuItem = styled.div`
  font-size: 18px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
`;

const Navbar = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { user, setUser } = useContext(UserContext);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const navigate = useNavigate();

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const handleLogout = () => {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (confirmation) {
      fetch(`${API_URL}/logout`, {
        method: "DELETE",
        credentials: 'include',
      }).then(() => {
        setUser(null);
        closeDrawer();
        navigate('/');
      });
    }
  };

  return (
    <NavbarContainer>
      <Logo>VOXXY</Logo>
      <MenuContainer>
        <StyledButton>
          <MenuItem to="/" end>Home</MenuItem>
        </StyledButton>
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
      <MobileMenuButton onClick={showDrawer} />
      <Drawer
        title="Menu"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={250}
      >
        <DrawerMenuItem>
          <StyledButton onClick={closeDrawer}>
            <NavLink to="/" onClick={closeDrawer} style={{ color: 'black', textDecoration: 'none' }}>Home</NavLink>
          </StyledButton>
        </DrawerMenuItem>
        {user && (
          <>
            <DrawerMenuItem>
              <StyledButton onClick={handleLogout}>
                <NavLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Logout</NavLink>
              </StyledButton>
            </DrawerMenuItem>
          </>
        )}
        {!user && (
          <>
            <DrawerMenuItem>
              <StyledButton onClick={closeDrawer}>
                <NavLink to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Sign Up</NavLink>
              </StyledButton>
            </DrawerMenuItem>
            <DrawerMenuItem>
              <StyledButton onClick={closeDrawer}>
                <NavLink to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Log In</NavLink>
              </StyledButton>
            </DrawerMenuItem>
          </>
        )}
      </Drawer>
    </NavbarContainer>
  );
};

export default Navbar;