import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import colors from '../styles/Colors';

const FooterContainer = styled.footer`
  background-color: ${colors.background};
  padding: 2rem 1rem;
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
  min-width: 200px;
  padding-left: 1rem;
  padding-right: 2rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
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
  font-size: 0.9rem;
  line-height: 1.4;
  color: ${colors.textMuted};
  margin: 0;
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
              Making group planning as fun as the events themselves. Powered by AI to help friends plan better and spend more time together.
            </BrandDescription>
          </BrandColumn>

          <div>
            <ColumnHeading>Product</ColumnHeading>
            <LinkList>
              <li><FooterLink to="/faq">How it works</FooterLink></li>
              <li><FooterLink to="/pricing">Pricing</FooterLink></li>
            </LinkList>
          </div>

          <div>
            <ColumnHeading>Support</ColumnHeading>
            <LinkList>
              <li><FooterLink to="/faq">Help Center</FooterLink></li>
              <li><FooterLink to="/contact">Contact Us</FooterLink></li>
            </LinkList>
          </div>
          <div>
            <ColumnHeading>Company</ColumnHeading>
            <LinkList>
              <li><FooterLink to='/about-us'>About Us</FooterLink></li>
              <li><FooterLink to='/voxxy-presents'>Voxxy Presents</FooterLink></li>
            </LinkList>
          </div>
          <div>
            <ColumnHeading>Legal</ColumnHeading>
            <LinkList>
              <li><FooterLink to='/terms'>Terms</FooterLink></li>
              <li><FooterLink to='/privacy'>Privacy</FooterLink></li>
            </LinkList>
          </div>
        </TopRow>

        <BottomRow>
          <Copyright>
            © 2025 Voxxy AI, Inc. All Rights Reserved.
          </Copyright>
        </BottomRow>
      </FooterInner>
    </FooterContainer>
  );
}