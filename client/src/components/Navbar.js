import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Menu, ArrowLeft, X } from 'lucide-react';
import { UserContext } from '../context/user';
import colors from '../styles/Colors'; // ✅ using your palette

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

const StyledNav = styled.nav`
  width: 100%;
  border-bottom: 1px solid;
  backdrop-filter: blur(8px);
  position: fixed;
  top: 0;
  z-index: 50;
  transition: background 0.2s ease;
  background-color: ${({ $scrolled }) =>
    $scrolled ? `rgba(32, 25, 37, 0.95)` : `rgba(32, 25, 37, 0.8)`}; /* from colors.background */
`;

const NavContainer = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px;
`;

const NavInner = styled.div`
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoText = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(90deg, ${colors.gradient.start} 0%, ${colors.gradient.end} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const DesktopNav = styled.div`
  display: none;
  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    gap: 16px;
  }
`;

const NavLinkItem = styled(Link)`
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.textSecondary};
  text-decoration: none;
  border-radius: 4px;
  transition: color 0.2s ease;
  &:hover {
    color: ${colors.primaryButton};
  }
`;

const SolidButton = styled(Link)`
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 4px;
  background-color: ${colors.primaryButton};
  color: ${colors.textPrimary};
  transition: background-color 0.2s ease;
  &:hover {
    background-color: ${colors.hoverHighlight};
  }
`;

const OutlineButton = styled(Link)`
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid ${colors.primarySolid}; /* or hoverHighlight if preferred */
  border-radius: 4px;
  color: ${colors.primarySolid};
  transition: background-color 0.2s ease;
  &:hover {
    background-color: rgba(157, 96, 248, 0.1);
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  cursor: pointer;
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  height: 100%;
  background-color: rgba(32, 25, 37, 0.95); /* matches colors.background with alpha */
  backdrop-filter: blur(8px);
  z-index: 60;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MobileMenuCloseButton = styled.button`
  align-self: flex-end;
  background: none;
  border: none;
  color: ${colors.textSecondary};
  cursor: pointer;
`;

export default function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const location = useLocation();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const confirmation = window.confirm('Are you sure you want to log out?');
    if (confirmation) {
      fetch(`${API_URL}/logout`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(() => {
        setUser(null);
        navigate('/');
      });
    }
    setShowMobileNav(false);
  };

  const isInnerPage =
    location.pathname !== '/' &&
    location.pathname !== '/login' &&
    location.pathname !== '/signup';

  return (
    <>
      <StyledNav $scrolled={scrolled}>
        <NavContainer>
          <NavInner>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {isInnerPage && isMobile ? (
                <MobileMenuButton onClick={() => window.history.back()} aria-label="Go Back">
                  <ArrowLeft size={20} />
                </MobileMenuButton>
              ) : null}
              <LogoLink to="/">
                <LogoText>Voxxy</LogoText>
              </LogoLink>
            </div>

            {/* Desktop Navigation */}
            <DesktopNav>
              {user ? (
                <>
                  <NavLinkItem to="/dashboard">Dashboard</NavLinkItem>
                  <SolidButton onClick={handleLogout} style={{ marginLeft: '16px' }}>
                    Log Out
                  </SolidButton>
                </>
              ) : (
                <>
                  <NavLinkItem to="/try-voxxy">Try Voxxy</NavLinkItem>
                  <NavLinkItem to="/blogs">Blogs</NavLinkItem>
                  <OutlineButton to="/login" style={{ marginLeft: '16px' }}>
                    Log In
                  </OutlineButton>
                  <SolidButton to="/signup" style={{ marginLeft: '8px' }}>
                    Sign Up
                  </SolidButton>
                </>
              )}
            </DesktopNav>

            {/* Mobile menu button */}
            <MobileMenuButton onClick={() => setShowMobileNav(true)}>
              <Menu size={24} />
            </MobileMenuButton>
          </NavInner>
        </NavContainer>
      </StyledNav>

      {/* Mobile Menu Overlay */}
      {showMobileNav && (
        <MobileMenuOverlay>
          <MobileMenuCloseButton onClick={() => setShowMobileNav(false)}>
            <X size={24} />
          </MobileMenuCloseButton>
          {user ? (
            <>
              <NavLinkItem to="/dashboard" onClick={() => setShowMobileNav(false)}>
                Dashboard
              </NavLinkItem>
              <NavLinkItem to="/logout" onClick={handleLogout}>
                Log Out
              </NavLinkItem>
            </>
          ) : (
            <>
              <NavLinkItem to="/try-voxxy" onClick={() => setShowMobileNav(false)}>
                Try Voxxy
              </NavLinkItem>
              <NavLinkItem to="/blogs" onClick={() => setShowMobileNav(false)}>
                Blogs
              </NavLinkItem>
              <NavLinkItem to="/login" onClick={() => setShowMobileNav(false)}>
                Log In
              </NavLinkItem>
              <NavLinkItem to="/signup" onClick={() => setShowMobileNav(false)}>
                Sign Up
              </NavLinkItem>
            </>
          )}
        </MobileMenuOverlay>
      )}
    </>
  );
}