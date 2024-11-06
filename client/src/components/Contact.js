// src/components/ContactPage.js
import React from "react";
import styled from "styled-components";

const ContactContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 75vh; /* Ensures it takes up only the visible viewport */
  background-color: #f9f9f9;
  text-align: center;
  box-sizing: border-box;
`;

const Heading = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;

  @media (min-width: 768px) {
    font-size: 3.5rem;
  }
`;

const Subheading = styled.p`
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const EmailLink = styled.a`
  font-size: 1.5rem;
  color: #9b19f5;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;

  &:hover {
    color: #7a15c8;
  }

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

export default function ContactPage() {
    return (
        <ContactContainer>
            <Heading>Contact Us</Heading>
            <Subheading>We’d love to hear from you! Reach out to our team with any questions or inquiries.</Subheading>
            <EmailLink href="mailto:team@voxxyAI.com">team@voxxyAI.com</EmailLink>
        </ContactContainer>
    );
}