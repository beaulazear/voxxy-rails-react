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

  &.log-in {
    background-color: #9b19f5;
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

const DrawerMenuItem = styled.div`
  font-size: 18px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
`;

const Navbar = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { user, setUser } = useContext(UserContext);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001"; // Add this line at the top

  const navigate = useNavigate()

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  function handleLogout() {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (confirmation) {
      fetch(`${API_URL}/logout`, {
        method: "DELETE",
        credentials: 'include',
      }).then(() => {
        setUser(null);
        closeDrawer()
        navigate('/');
      });
    } else {
      console.log("Log out aborted");
    }
  }

  return (
    <NavbarContainer>
      <Logo>V</Logo>
      <MenuContainer>
        <MenuItem to="/" end>Home</MenuItem>
        <MenuItem to="/waitlist">Waitlist</MenuItem>
        {!user && (
          <>
            <MenuItem to="/contact">Contact</MenuItem>
          </>
        )}
        {user && (
          <StyledButton className="sign-up" onClick={handleLogout}>
            <NavLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Logout</NavLink>
          </StyledButton>
        )}
        <StyledButton className="demo">
          <NavLink to="/demo" style={{ color: 'inherit', textDecoration: 'none' }}>Demo</NavLink>
        </StyledButton>
        {!user && (
          <>
            <StyledButton className="sign-up">
              <NavLink to="/waitlist" style={{ color: 'inherit', textDecoration: 'none' }}>Sign Up</NavLink>
            </StyledButton>
            <StyledButton className="sign-up">
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
        width={250} /* Controls drawer width */
      >
        <DrawerMenuItem>
          <NavLink to="/" onClick={closeDrawer} style={{ color: 'black', textDecoration: 'none' }}>Home</NavLink>
        </DrawerMenuItem>
        <DrawerMenuItem>
          <NavLink to="/waitlist" onClick={closeDrawer} style={{ color: 'black', textDecoration: 'none' }}>Waitlist</NavLink>
        </DrawerMenuItem>
        {!user && (
          <DrawerMenuItem>
            <NavLink to="/contact" onClick={closeDrawer} style={{ color: 'black', textDecoration: 'none' }}>Contact</NavLink>
          </DrawerMenuItem>
        )}
        <DrawerMenuItem>
          <StyledButton className="demo" onClick={closeDrawer}>
            <NavLink to="/demo" style={{ color: 'inherit', textDecoration: 'none' }}>Demo</NavLink>
          </StyledButton>
        </DrawerMenuItem>
        {user && (
          <DrawerMenuItem>
            <StyledButton className="sign-up" onClick={handleLogout}>
              <NavLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Logout</NavLink>
            </StyledButton>
          </DrawerMenuItem>
        )}
        {!user && (
          <>
            <DrawerMenuItem>
              <StyledButton className="sign-up" onClick={closeDrawer}>
                <NavLink to="/waitlist" style={{ color: 'inherit', textDecoration: 'none' }}>Sign Up</NavLink>
              </StyledButton>
            </DrawerMenuItem>
            <DrawerMenuItem>
              <StyledButton className="sign-up" onClick={closeDrawer}>
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