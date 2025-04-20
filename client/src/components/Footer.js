import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background-color: white;
  padding: 2rem 1rem; /* Reduced overall padding for a more compact feel */
  margin-top: auto;
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
  color: #B931D6;
`;

const BrandDescription = styled.p`
  font-size: 0.9rem;
  line-height: 1.4;
  color: #0D0B1F;
  margin: 0;
`;

const ColumnHeading = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: #0D0B1F;
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
  color: #0D0B1F;
  font-size: 0.95rem;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #9D60F8;
  }
`;

const BottomRow = styled.div`
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  padding-top: 1rem;
  text-align: center;
`;

const Copyright = styled.p`
  font-size: 0.75rem;
  color: #0D0B1F;
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
              <li><FooterLink to="/about-us">Pricing</FooterLink></li>
            </LinkList>
          </div>

          <div>
            <ColumnHeading>Support</ColumnHeading>
            <LinkList>
              <li>
                <Link to="/faq" style={{ textDecoration: 'none', color: '#0D0B1F' }}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" style={{ textDecoration: 'none', color: '#0D0B1F' }}>
                  Contact Us
                </Link>
              </li>
            </LinkList>
          </div>
          <div>
            <ColumnHeading>Company</ColumnHeading>
            <LinkList>
              <li>
                <Link to='/about-us' style={{ textDecoration: 'none', color: '#0D0B1F' }}>About Us</Link>
              </li>
              <li>
                <Link to='/blogs' style={{ textDecoration: 'none', color: '#0D0B1F' }}>Blog</Link>
              </li>
            </LinkList>
          </div>
          <div>
            <ColumnHeading>Legal</ColumnHeading>
            <LinkList>
              <li>
                <Link to='/' style={{ textDecoration: 'none', color: '#0D0B1F' }}>Terms</Link>
              </li>
              <li>
                <Link to='/' style={{ textDecoration: 'none', color: '#0D0B1F' }}>Privacy</Link>
              </li>
            </LinkList>
          </div>
        </TopRow>

        <BottomRow>
          <Copyright>
            © 2025 Voxxy. All Rights Reserved.
          </Copyright>
        </BottomRow>
      </FooterInner>
    </FooterContainer>
  );
}