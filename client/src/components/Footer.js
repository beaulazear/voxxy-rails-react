import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.div`
  background: #f9f9f9;
  padding: 1rem;
  color: #555;
  text-align: center;
  font-family: 'Roboto', sans-serif;
  font-size: 0.95rem;
  border-top: 1px solid #e0e0e0;

  p {
    font-weight: 600;
    color: #4b0082;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  a {
    color: #6a0dad;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s;

    &:hover {
      color: #8b00ff;
    }
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <p>Contact Us</p>
      <a href="mailto:team@voxxyAI.com">team@voxxyAI.com</a>
    </FooterContainer>
  );
};

export default Footer;