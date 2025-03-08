import React from "react";
import styled from "styled-components";
import { Avatar } from "antd";
import { PlusCircleOutlined, HomeOutlined } from "@ant-design/icons";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg";

const FooterContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #4e0f63, #6a1b8a);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  height: 25px;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const IconButton = styled.div`
  font-size: 1.8rem;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;

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