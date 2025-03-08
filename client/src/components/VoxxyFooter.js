import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Avatar } from "antd";
import { PlusCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
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

const VoxxyFooter = ({ handleShowActivities }) => {
  const { user } = React.useContext(UserContext);
  const navigate = useNavigate();

  return (
    <FooterContainer>
      {/* Left - FAQ Button */}
      <IconButton onClick={() => navigate("/faq")}>
        <QuestionCircleOutlined />
      </IconButton>

      {/* Center - Add New Board */}
      <IconButton onClick={() => handleShowActivities()}>
        <PlusCircleOutlined />
      </IconButton>

      {/* Right - User Avatar */}
      <UserAvatar
        size={40}
        src={user?.avatar || Woman}
        onClick={() => navigate("/profile")}
      />
    </FooterContainer>
  );
};

export default VoxxyFooter;