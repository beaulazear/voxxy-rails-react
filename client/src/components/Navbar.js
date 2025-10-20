import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Menu, ArrowLeft, X } from 'lucide-react';
import { UserContext } from '../context/user';
import colors from '../styles/Colors';
import { trackEvent } from '../utils/analytics';
// import GAYHEADER from '../assets/GAYHEADER.svg'; // Scalable Voxxy Header SVG
// import AnimatedPrideHeader from './AnimatedPrideHeader';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

// Animations
const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const StyledNav = styled.nav`
  width: 100%;
  border-bottom: 1px solid transparent;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: fixed;
  top: 0;
  z-index: 50;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  animation: ${slideDown} 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  background: ${({ $scrolled }) => ($scrolled ? 'linear-gradient(180deg, rgba(9, 3, 20, 0.85) 0%, rgba(9, 3, 20, 0) 100%)' : 'transparent')};
  box-shadow: ${({ $scrolled }) => ($scrolled ? '0 12px 30px rgba(9, 3, 20, 0.35)' : 'none')};
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

const LOGO_SRC = `${process.env.PUBLIC_URL}/HEADER.svg`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
  
  &:hover {
    transform: scale(1.05);
  }
`;

const LogoImage = styled.img`
  height: 36px;
  width: auto;
  filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0)) drop-shadow(0 0 12px rgba(123, 58, 236, 0.45));
  @media (max-width: 480px) {
    height: 30px;
  }
`;

const DesktopNav = styled.div`
  display: none;
  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const NavLinkItem = styled(Link)`
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.textSecondary};
  text-decoration: none;
  border-radius: 8px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(157, 96, 248, 0.1) 0%, rgba(157, 96, 248, 0.05) 100%);
    border-radius: 8px;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  &:hover {
    color: ${colors.primaryButton};
    transform: translateY(-1px);
    
    &::before {
      opacity: 1;
    }
  }
`;

const SolidButton = styled(Link)`
  padding: 8px 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 12px;
  background: linear-gradient(135deg, ${colors.primaryButton} 0%, #b865f7 100%);
  color: #ffffff;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(157, 96, 248, 0.3);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${colors.hoverHighlight} 0%, #c975f8 100%);
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    z-index: -1;
  }

  &:hover {
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(157, 96, 248, 0.4);

    &::after {
      opacity: 1;
    }
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  
  &:hover {
    background: rgba(139, 92, 246, 0.1);
    color: ${colors.secondaryButton};
    transform: scale(1.05);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${colors.focus};
  }
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 75%;
  max-width: 320px;
  height: 100vh;
  background: linear-gradient(135deg, rgba(32, 25, 37, 0.98) 0%, rgba(45, 35, 55, 0.98) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 60;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: ${slideInRight} 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
`;

const MobileMenuBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 55;
  animation: ${fadeIn} 0.3s ease-out;
`;

const MobileMenuCloseButton = styled.button`
  align-self: flex-end;
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${colors.focus};
  }
  
  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }
  color: ${colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  
  &:hover {
    background: rgba(157, 96, 248, 0.1);
    color: ${colors.primaryButton};
    transform: scale(1.05);
  }
`;

const MobileNavLinkItem = styled(Link)`
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: ${colors.textSecondary};
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  border: 1px solid transparent;
  
  &:hover {
    color: ${colors.primaryButton};
    background: rgba(157, 96, 248, 0.1);
    border-color: rgba(157, 96, 248, 0.2);
    transform: translateX(4px);
  }
`;


const MobileNavButton = styled.button`
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: ${colors.textSecondary};
  background: none;
  border: 1px solid transparent;
  border-radius: 12px;
  text-align: left;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  cursor: pointer;

  &:hover {
    color: ${colors.primaryButton};
    background: rgba(157, 96, 248, 0.1);
    border-color: rgba(157, 96, 248, 0.2);
    transform: translateX(4px);
  }
`;


export default function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const location = useLocation();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user && user.admin;

  const navLinks = [
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/legal', label: 'Legal' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileNav]);

  const handleNavClick = (label) => {
    trackEvent('Nav Link Clicked', { label });
  };

  const handleCtaClick = (label) => {
    trackEvent('CTA Clicked', { label, location: 'Navbar' });
  };

  const handleLogout = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const confirmation = window.confirm('Are you sure you want to log out?');
    if (confirmation) {
      trackEvent('CTA Clicked', { label: 'Log Out', location: 'Navbar' });
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
                {/* <AnimatedPrideHeader
                  regularSrc={HEADER}
                  prideSrc={GAYHEADER}
                  alt="Voxxy Logo"
                  animationType="cycle"
                /> */}
                <LogoImage src={LOGO_SRC} alt="Voxxy logo" />
              </LogoLink>
            </div>

            <DesktopNav>
              {navLinks.map((item) => (
                <NavLinkItem key={item.to} to={item.to} onClick={() => handleNavClick(item.label)}>
                  {item.label}
                </NavLinkItem>
              ))}
              {isAdmin && (
                <NavLinkItem to="/admin/dashboard" onClick={() => handleNavClick('Dashboard')}>
                  Dashboard
                </NavLinkItem>
              )}
              {user ? (
                <SolidButton as="button" onClick={handleLogout} style={{ marginLeft: '16px' }}>
                  Log Out
                </SolidButton>
              ) : (
                <>
                  <SolidButton to="/get-started" style={{ marginLeft: '8px' }} onClick={() => handleCtaClick('Get Started')}>
                    Get Started
                  </SolidButton>
                </>
              )}
            </DesktopNav>

            <MobileMenuButton onClick={() => setShowMobileNav(true)}>
              <Menu size={24} />
            </MobileMenuButton>
          </NavInner>
        </NavContainer>
      </StyledNav>

      {showMobileNav && (
        <>
          <MobileMenuBackdrop onClick={() => setShowMobileNav(false)} />
          <MobileMenuOverlay>
            <MobileMenuCloseButton onClick={() => setShowMobileNav(false)}>
              <X size={24} />
            </MobileMenuCloseButton>
            {navLinks.map((item) => (
              <MobileNavLinkItem
                key={item.to}
                to={item.to}
                onClick={() => {
                  setShowMobileNav(false);
                  handleNavClick(item.label);
                }}
              >
                {item.label}
              </MobileNavLinkItem>
            ))}
            {isAdmin && (
              <MobileNavLinkItem
                to="/admin/dashboard"
                onClick={() => {
                  setShowMobileNav(false);
                  handleNavClick('Dashboard');
                }}
              >
                Dashboard
              </MobileNavLinkItem>
            )}
            {user ? (
              <MobileNavButton onClick={handleLogout}>Log Out</MobileNavButton>
            ) : (
              <MobileNavLinkItem
                to="/get-started"
                onClick={() => {
                  setShowMobileNav(false);
                  handleCtaClick('Get Started');
                }}
              >
                Get Started
              </MobileNavLinkItem>
            )}
          </MobileMenuOverlay>
        </>
      )}
    </>
  );
}
