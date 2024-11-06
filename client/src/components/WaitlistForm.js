import React from "react";
import styled from "styled-components";

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  text-align: center;

  @media (min-width: 600px) {
    padding: 3rem;
  }
`;

const Heading = styled.h2`
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: #333;
  max-width: 90%;

  @media (min-width: 600px) {
    font-size: 1.75rem;
    max-width: 600px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  border-radius: 10px;
  background-color: #fafafa;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  @media (min-width: 600px) {
    max-width: 450px;
    padding: 2rem;
  }
`;

const Label = styled.label`
  font-size: 0.9rem;
  margin-top: 0.75rem;
  color: #555;
  text-align: left;
`;

const Input = styled.input`
  padding: 0.75rem;
  margin-top: 0.25rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: border-color 0.2s;

  &:focus {
    border-color: #666;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background-color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #555;
  }
`;

const ContactInfo = styled.div`
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #333;
  text-align: center;

  p {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  a {
    color: #333;
    text-decoration: none;
  }
`;

const WaitlistForm = () => {
  return (
    <FormContainer>
      <Heading>
        We’re currently offering early access to our Beta platform. Join our
        waitlist for an exclusive opportunity to experience Voxy’s AI-driven
        customer interviews firsthand.
      </Heading>
      <Form>
        <Label htmlFor="name">Name</Label>
        <Input type="text" id="name" name="name" placeholder="Enter your name" />

        <Label htmlFor="email">Best Email</Label>
        <Input type="email" id="email" name="email" placeholder="Enter your email" />

        <SubmitButton type="submit">Submit</SubmitButton>
      </Form>
      <ContactInfo>
        <p>Contact Us</p>
        <a href="mailto:team@voxxyAI.com">Email: team@voxxyAI.com</a>
      </ContactInfo>
    </FormContainer>
  );
};

export default WaitlistForm;
