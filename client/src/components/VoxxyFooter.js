import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background-color: #ffffff;
  padding: 1.5rem 1rem;
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 2rem;
`;

const Brand = styled.div`
  flex: 1 1 200px;
`;

const BrandName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #6c63ff;
  text-align: left;
`;

const BrandText = styled.p`
  font-size: 0.9rem;
  color: #333333;
  margin: 0;
  text-align: left;
`;

const Column = styled.div`
  flex: 1 1 120px;
`;

const ColumnHeading = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #333333;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FooterLink = styled(Link)`
  font-size: 0.9rem;
  color: #333333;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #6c63ff;
  }
`;

const Bottom = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 1.5rem;
`;

const Copyright = styled.p`
  font-size: 0.75rem;
  color: #666666;
  margin: 0;
`;

export default function Footer() {
  return (
    <FooterContainer>
      <FooterInner>
        <Brand>
          <BrandName>Voxxy</BrandName>
          <BrandText>
            Making group planning as fun as the events themselves. Powered by AI to help friends plan better and spend more time together.
          </BrandText>
        </Brand>

        <Column>
          <ColumnHeading>Support</ColumnHeading>
          <LinkList>
            <li><FooterLink to="/faq">Help Center</FooterLink></li>
            <li><FooterLink to="/contact">Contact Us</FooterLink></li>
          </LinkList>
        </Column>

        <Column>
          <ColumnHeading>Legal</ColumnHeading>
          <LinkList>
            <li><FooterLink to="/terms">Terms of Service</FooterLink></li>
            <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
          </LinkList>
        </Column>
      </FooterInner>

      <Bottom>
        <Copyright>© 2025 Voxxy. All Rights Reserved.</Copyright>
      </Bottom>
    </FooterContainer>
  );
}