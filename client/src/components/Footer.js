import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background-color: white;
  color: #FFFFFF;
  padding: 3rem 1rem;
  margin-top: auto;
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 2rem;
`;

const BrandColumn = styled.div`
  grid-column: span 2; 
  min-width: 200px;
  padding-left: 2rem;
  text-align: left;
`;

const BrandName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: rgba(157,96,248,1);
`;

const BrandDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: #0D0B1F;
`;

const ColumnHeading = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #0D0B1F;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li + li {
    margin-top: 0.8rem;
  }
`;

const FooterLink = styled.a`
  display: inline-block;
  margin-bottom: 0.5rem;
  color: #0D0B1F;
  font-size: 0.95rem;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #9D60F8; /* Accent color on hover */
  }
`;

const BottomRow = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Copyright = styled.p`
  font-size: 0.85rem;
  color: #0D0B1F;
`;

export default function Footer() {
  return (
    <FooterContainer>
      <FooterInner>
        <TopRow>
          <BrandColumn>
            <BrandName>Voxxy</BrandName>
            <BrandDescription>
              Making group planning as fun as the events themselves. Powered by AI to
              help friends plan better and spend more time together.
            </BrandDescription>
          </BrandColumn>

          <div>
            <ColumnHeading>Product</ColumnHeading>
            <LinkList>
              <li><FooterLink href="#">Features</FooterLink></li>
              <li><FooterLink href="#">How it works</FooterLink></li>
              <li><FooterLink href="#">Pricing</FooterLink></li>
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
              <li><FooterLink href="mailto:team@voxxyAI.com">Contact Us</FooterLink></li>
            </LinkList>
          </div>

          <div>
            <ColumnHeading>Company</ColumnHeading>
            <LinkList>
              <li><FooterLink href="#">About</FooterLink></li>
              <li><FooterLink href="#">Blog</FooterLink></li>
              <li><FooterLink href="#">Careers</FooterLink></li>
            </LinkList>
          </div>

          <div>
            <ColumnHeading>Legal</ColumnHeading>
            <LinkList>
              <li><FooterLink href="#">Privacy</FooterLink></li>
              <li><FooterLink href="#">Terms</FooterLink></li>
            </LinkList>
          </div>
        </TopRow>

        {/* Bottom Row */}
        <BottomRow>
          <Copyright>
            © 2025 Voxxy. All Rights Reserved.
          </Copyright>
        </BottomRow>
      </FooterInner>
    </FooterContainer>
  );
}