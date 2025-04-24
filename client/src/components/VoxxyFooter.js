import React from "react";
import styled from "styled-components";
import { Avatar } from "antd";
import { PlusCircleOutlined, HomeOutlined } from "@ant-design/icons";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg";

const colors = {
  background: '13, 11, 31', // using numeric values to format in rgba
  foreground: '#FFFFFF',
  primary: 'rgba(157,96,248,1)',
  border: 'rgba(255,255,255,0.2)',
};

const FooterContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden; /* Ensures the pseudo-element stays within bounds */
  transition: background 0.2s ease;
  background-color: ${({ $scrolled }) =>
    $scrolled ? `rgba(${colors.background})` : `rgba(${colors.background})`};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1; /* Place it behind the content */
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const IconButton = styled.div`
  font-size: 2rem; /* Slightly larger to ensure no cutoff */
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem; /* Ensures even spacing */
  height: 2.5rem;
  line-height: 0; /* Fixes icon being clipped */

  &:hover {
    transform: scale(1.1);
    color: #e0e0e0;
  }
`;

const UserAvatar = styled(Avatar)`
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  border: 2px solid white;

  &:hover {
    transform: scale(1.1);
  }
`;

const VoxxyFooter = ({ handleShowActivities, handleShowProfile, handleBack }) => {
  const { user } = React.useContext(UserContext);

  return (
    <FooterContainer>
      <IconButton onClick={() => handleBack()}>
        <HomeOutlined />
      </IconButton>

      <IconButton onClick={() => handleShowActivities()}>
        <PlusCircleOutlined />
      </IconButton>

      <UserAvatar
        size={40}
        src={user?.avatar || Woman}
        onClick={() => handleShowProfile()}
      />
    </FooterContainer>
  );
};

export default VoxxyFooter;