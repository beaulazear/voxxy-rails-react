import React, { useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';

const FooterContainer = styled.div`
  background: #f9f9f9;
  padding: 1.5rem 0;
  color: #555;
  text-align: center;
  font-family: 'Roboto', sans-serif;
  font-size: 0.95rem;
  border-top: 1px solid #e0e0e0;

  p {
    font-weight: 500;
    color: #4b0082;
    margin-bottom: 0.5rem;
    font-size: 1rem;
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

const UserFooter = () => {
    const { user } = useContext(UserContext);

    return (
        <FooterContainer>
            <p>Welcome back, {user?.name}</p>
            <a href="mailto:support@voxxyAI.com">Contact Us</a>
        </FooterContainer>
    );
};

export default UserFooter;