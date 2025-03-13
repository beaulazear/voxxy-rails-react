import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Input, Button, Avatar, message } from "antd";
import { UserContext } from "../context/user";
import { EditOutlined, SaveOutlined, LogoutOutlined } from "@ant-design/icons";
import Woman from "../assets/Woman.jpg";
import ChooseAvatar from "./ChooseAvatar";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const Container = styled.div`
  animation: ${fadeIn} 0.8s ease-in-out, ${gradientAnimation} 15s ease infinite;
  background: linear-gradient(-45deg, #6a1b9a, #8e44ad, #b67fdd, #e0b3f3);
  padding-bottom: 50px;
  padding-top: 10px;
`;

const ProfileContainer = styled.div`
  width: fit-content;
  margin: 50px auto;
  margin-top: 15px;
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  text-align: center;
  transition: all 0.3s ease-in-out;
  animation: ${fadeIn} 0.8s ease-in-out;

  @media (max-width: 768px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  animation: ${fadeIn} 0.8s ease-in-out;

  .profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
`;

const UserName = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #4e0f63;
  margin-bottom: 1rem;
  transition: all 0.3s ease-in-out;

  ${({ editing }) =>
    editing &&
    `
    opacity: 0.6;
  `}
`;

const EditContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const StyledInput = styled(Input)`
  max-width: 250px;
  font-size: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #ccc;
  transition: all 0.2s ease-in-out;
`;

const StyledButton = styled(Button)`
  font-size: 1rem;
  background-color: #4e0f63;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  margin: 2px;

  &:hover {
    background-color: #6a1b8a !important;
  }

  &.cancel {
    background-color: red;
  }

  &.cancel:hover {
    background-color: #660000;
  }
`;

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (confirmation) {
      fetch(`${API_URL}/logout`, {
        method: "DELETE",
        credentials: 'include',
      }).then(() => {
        setUser(null);
        navigate('/');
      });
    }
  };

  const handleSave = () => {
    if (!newName.trim()) {
      message.error("Name cannot be empty.");
      return;
    }

    setUser({ ...user, name: newName });
    setIsEditing(false);
    message.success("Profile updated successfully!");
  };

  return (
    <Container>
      <ProfileContainer>
        <AvatarContainer>
          <Avatar
            src={user?.avatar || Woman}
            className="profile-avatar"
            size={120}
          />
        </AvatarContainer>

        {!isEditing ? (
          <>
            <UserName>{user?.name || "User"}</UserName>
            <StyledButton icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
              Edit Name
            </StyledButton>
            <StyledButton className="cancel" icon={<LogoutOutlined />} onClick={() => handleLogout()}>
              Logout
            </StyledButton>
          </>
        ) : (
          <EditContainer>
            <StyledInput value={newName} onChange={(e) => setNewName(e.target.value)} />
            <StyledButton icon={<SaveOutlined />} onClick={handleSave}>
              Save
            </StyledButton>
          </EditContainer>
        )}
      </ProfileContainer>
      <ChooseAvatar />
    </Container>
  );
};

export default Profile;