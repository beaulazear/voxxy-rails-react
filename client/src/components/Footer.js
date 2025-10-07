import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import colors from '../styles/Colors';

const FooterContainer = styled.footer`
  background-color: ${colors.background};
  padding: clamp(3rem, 6vw, 4rem) 1.5rem;
  margin-top: auto;
  border-top: 1px solid ${colors.borderDark};
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem; /* Increased gap between sections */
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem; /* Increased gap between grid items */
  align-items: start;
`;

const BrandColumn = styled.div`
  grid-column: span 2;
  min-width: 220px;
  padding-left: 1rem;
  padding-right: 2rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
`;

const BrandName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(to right, ${colors.gradient.start}, ${colors.gradient.end});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const BrandDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: ${colors.textMuted};
  margin: 0;
  max-width: 420px;
`;

const ColumnHeading = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: ${colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  row-gap: 0.75rem;
  column-gap: 1rem;
`;

const FooterLink = styled(Link)`
  display: inline-block;
  color: ${colors.textMuted};
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;

  &:hover {
    color: ${colors.secondaryButton};
    border-bottom-color: ${colors.secondaryButton};
  }
  
  &:focus {
    outline: none;
    border-radius: 4px;
    box-shadow: 0 0 0 2px ${colors.focus}40;
  }
`;

const BottomRow = styled.div`
  border-top: 1px solid ${colors.borderDark};
  padding-top: 1rem;
  text-align: center;
`;

const Copyright = styled.p`
  font-size: 0.75rem;
  color: ${colors.textMuted};
  margin: 0;
`;

export default function Footer() {
  return (
    <FooterContainer>
      <FooterInner>
        <TopRow>
          <BrandColumn>
            <BrandName>Voxxy</BrandName>
            <BrandDescription>
              Voxxy is a social planning platform that helps people turn ideas into connection and groups into community.
            </BrandDescription>
          </BrandColumn>

          <div>
            <ColumnHeading>Product</ColumnHeading>
            <LinkList>
              <li><FooterLink to="/how-it-works">How It Works</FooterLink></li>
              <li><FooterLink to="/get-started">Get Started</FooterLink></li>
            </LinkList>
          </div>

          <div>
            <ColumnHeading>Company</ColumnHeading>
            <LinkList>
              <li><FooterLink to="/about">About</FooterLink></li>
              <li><FooterLink to="/contact">Contact</FooterLink></li>
            </LinkList>
          </div>
          <div>
            <ColumnHeading>Legal</ColumnHeading>
            <LinkList>
              <li><FooterLink to='/legal'>Legal Center</FooterLink></li>
              <li><FooterLink to='/terms'>Terms of Service</FooterLink></li>
              <li><FooterLink to='/privacy'>Privacy Policy</FooterLink></li>
            </LinkList>
          </div>
        </TopRow>

        <BottomRow>
          <Copyright>
            © 2025 Voxxy, Inc. All rights reserved.
          </Copyright>
        </BottomRow>
      </FooterInner>
    </FooterContainer>
  );
}
