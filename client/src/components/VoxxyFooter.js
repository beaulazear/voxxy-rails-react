import React from 'react';
import styled from 'styled-components';

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
  flex-wrap: wrap;
  gap: 2rem;
  align-items: flex-start;
`;

const Brand = styled.div`
  flex: 1 1 100%;
  text-align: left;
  padding-left: 1rem;
  padding-right: 1rem;
`;

const BrandName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #6c63ff;
`;

const BrandText = styled.p`
  font-size: 0.9rem;
  color: #333333;
  margin: 0;
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
      </FooterInner>

      <Bottom>
        <Copyright>© 2025 Voxxy AI, Inc. All Rights Reserved.</Copyright>
      </Bottom>
    </FooterContainer>
  );
}