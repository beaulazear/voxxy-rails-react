import React, { useState } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

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
  font-size: 24px;
  font-weight: bold;
  color: purple;
`;

const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    display: none; /* Hide the menu on smaller screens */
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
  font-size: 14px;
  padding: 0 20px;
  border-radius: 5px;
  margin-left: 10px;
  width: 80px;

  &.sign-up {
    background-color: #d3c;
    color: white;
    border: none;
  }

  &.demo {
    background-color: #9b19f5;
    color: white;
    border: none;
  }
`;

const MobileMenuButton = styled(MenuOutlined)`
  font-size: 24px;
  color: black;
  cursor: pointer;

  @media (min-width: 768px) {
    display: none; /* Hide the mobile menu button on larger screens */
  }
`;

const DrawerMenuItem = styled(NavLink)`
  font-size: 18px;
  color: black;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
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

const Navbar = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <NavbarContainer>
      <Logo>V</Logo>
      <MenuContainer>
        <MenuItem to="/" end>Home</MenuItem>
        <MenuItem to="/waitlist">Waitlist</MenuItem>
        <MenuItem to="/contact">Contact</MenuItem>
        <StyledButton className="sign-up">
          <NavLink to="/waitlist" style={{ color: 'inherit', textDecoration: 'none' }}>Sign Up</NavLink>
        </StyledButton>
        <StyledButton className="demo">
          <NavLink to="/demo" style={{ color: 'inherit', textDecoration: 'none' }}>Demo</NavLink>
        </StyledButton>
      </MenuContainer>
      <MobileMenuButton onClick={showDrawer} />
      <Drawer
        title="Menu"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
      >
        <DrawerMenuItem to="/" end onClick={closeDrawer}>Home</DrawerMenuItem>
        <DrawerMenuItem to="/waitlist" onClick={closeDrawer}>Waitlist</DrawerMenuItem>
        <DrawerMenuItem to="/contact" onClick={closeDrawer}>Contact</DrawerMenuItem>
        <DrawerMenuItem as="div">
          <StyledButton className="sign-up" onClick={closeDrawer}>
            Sign Up
          </StyledButton>
        </DrawerMenuItem>
        <DrawerMenuItem as="div">
          <StyledButton className="demo" onClick={closeDrawer}>
            <NavLink to="/demo" style={{ color: 'inherit', textDecoration: 'none' }}>Demo</NavLink>
          </StyledButton>
        </DrawerMenuItem>
      </Drawer>
    </NavbarContainer>
  );
};

export default Navbar;