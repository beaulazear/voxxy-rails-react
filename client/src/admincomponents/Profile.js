import React, { useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import styled from "styled-components";
import { Input, Button, Avatar, message } from "antd";
import { UserContext } from "../context/user";
import { EditOutlined, SaveOutlined, LogoutOutlined } from "@ant-design/icons";
import Woman from "../assets/Woman.jpg";

const ProfileContainer = styled.div`
  max-width: 500px;
  margin: 80px auto;
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  text-align: center;
  transition: all 0.3s ease-in-out;

  @media (max-width: 768px) {
    padding: 2rem;
    margin: 50px auto;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;

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
    );
};

export default Profile;