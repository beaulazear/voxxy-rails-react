// src/components/Footer.js
import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.div`
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #333;
  text-align: center;
  padding: 1rem 0;

  p {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  a {
    color: #333;
    text-decoration: none;
  }
`;

const Footer = () => {
    return (
        <FooterContainer>
            <p>Contact Us</p>
            <a href="mailto:team@voxxyAI.com">Email: team@voxxyAI.com</a>
        </FooterContainer>
    );
};

export default Footer;