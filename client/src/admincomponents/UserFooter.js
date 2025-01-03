import React, { useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';

const FooterContainer = styled.footer`
  background: #f9f9f9;
  padding-bottom: 0.8rem; /* Smaller padding for a tighter design */
  color: #555;
  text-align: center;
  font-family: 'Roboto', sans-serif;
  font-size: 0.85rem;
  border-top: 1px solid #e0e0e0;

  /* Fixed positioning at the bottom */
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;

  /* Ensure spacing from the last content */
  margin-top: auto;

  p {
    font-weight: 500;
    color: #4b0082;
    margin-bottom: 0.3rem;
    font-size: 0.9rem;
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

/* Add space to the last content above the footer */
const Spacer = styled.div`
  height: 2rem; /* Creates space above the footer */
`;

const UserFooter = () => {
  const { user } = useContext(UserContext);

  return (
    <>
      <Spacer />
      <FooterContainer>
        <p>Welcome back, {user?.name}</p>
        <a href="mailto:support@voxxyAI.com">Contact Us</a>
      </FooterContainer>
    </>
  );
};

export default UserFooter;