import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import Avatar1 from "../assets/Avatar1.jpg";
import Avatar2 from "../assets/Avatar2.jpg";
import Avatar3 from "../assets/Avatar3.jpg";
import Avatar4 from "../assets/Avatar4.jpg";
import Avatar5 from "../assets/Avatar5.jpg";
import Avatar6 from "../assets/Avatar6.jpg";
import Avatar7 from "../assets/Avatar7.jpg";
import Avatar8 from "../assets/Avatar8.jpg";
import Avatar9 from "../assets/Avatar9.jpg";
import Avatar10 from "../assets/Avatar10.jpg";
import Avatar11 from "../assets/Avatar11.jpg";
import Weird1 from "../assets/Weird1.jpg";
import Weird2 from "../assets/Weird2.jpg";
import Weird3 from "../assets/Weird3.jpg";
import Weird4 from "../assets/Weird4.jpg";
import Weird5 from "../assets/Weird5.jpg";

const avatars = [
  { id: 1, src: Avatar1, path: "/assets/Avatar1.jpg" },
  { id: 2, src: Avatar2, path: "/assets/Avatar2.jpg" },
  { id: 3, src: Avatar3, path: "/assets/Avatar3.jpg" },
  { id: 4, src: Avatar4, path: "/assets/Avatar4.jpg" },
  { id: 5, src: Avatar5, path: "/assets/Avatar5.jpg" },
  { id: 6, src: Avatar6, path: "/assets/Avatar6.jpg" },
  { id: 7, src: Avatar7, path: "/assets/Avatar7.jpg" },
  { id: 8, src: Avatar8, path: "/assets/Avatar8.jpg" },
  { id: 9, src: Avatar9, path: "/assets/Avatar9.jpg" },
  { id: 10, src: Avatar10, path: "/assets/Avatar10.jpg" },
  { id: 11, src: Avatar11, path: "/assets/Avatar11.jpg" },
  { id: 12, src: Weird1, path: "/assets/Weird1.jpg" },
  { id: 13, src: Weird2, path: "/assets/Weird2.jpg" },
  { id: 14, src: Weird3, path: "/assets/Weird3.jpg" },
  { id: 15, src: Weird4, path: "/assets/Weird4.jpg" },
  { id: 16, src: Weird5, path: "/assets/Weird5.jpg" },
];

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  max-width: 500px;
  background-color: #2A1E30;
  text-align: center;
  transition: all 0.3s ease-in-out;
  margin-top: 0px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 1rem;
  transition: all 0.3s ease-in-out;

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

const AvatarGrid = styled.div`
  display: flex;
  gap: 1.2rem;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: .8px;
  }
`;

const AvatarButton = styled.button`
  border: none;
  background: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: transform 0.2s ease-in-out;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover {
    transform: ${({ disabled }) => (disabled ? "none" : "scale(1.1)")};
  }
`;

const AvatarImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${({ selected }) => (selected ? "#6a1b9a" : "transparent")};
  transition: border 0.2s ease-in-out, transform 0.2s ease-in-out;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }

  &:hover {
    border-color: ${({ selected }) => (selected ? "#6a1b9a" : "#ddd")};
    transform: ${({ selected }) => (selected ? "scale(1.1)" : "scale(1.05)")};
  }
`;

const LoadingText = styled.p`
  font-size: 1rem;
  color: #4e0f63;
  font-weight: bold;
  animation: fade 1.5s infinite alternate;

  @keyframes fade {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }
`;

export default function ChooseAvatar({ onSelect }) {
  const { user, setUser } = useContext(UserContext);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarSelect = async (avatarPath) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ avatar: avatarPath }),
      });

      if (response.ok) {
        setUser((prevUser) => ({ ...prevUser, avatar: avatarPath }));
        setSelectedAvatar(avatarPath);
        onSelect()
      } else {
        console.error("Failed to update avatar:", await response.json());
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AvatarContainer>
      <Title>Choose Your Avatar</Title>

      {isLoading && <LoadingText>Updating avatar...</LoadingText>}

      <AvatarGrid>
        {avatars.map((avatar) => (
          <AvatarButton
            key={avatar.id}
            onClick={() => handleAvatarSelect(avatar.path)}
            disabled={isLoading}
          >
            <AvatarImage
              src={avatar.src}
              alt={`Avatar ${avatar.id}`}
              selected={selectedAvatar === avatar.path}
            />
          </AvatarButton>
        ))}
      </AvatarGrid>
      <a target="_blank" rel="noreferrer" href="https://www.vecteezy.com/free-vector/avatar">Avatar Vectors by Vecteezy</a>
    </AvatarContainer>
  );
}