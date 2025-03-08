import React from "react";
import styled from "styled-components";
import Avatar1 from "../assets/Avatar1.jpg";
import Avatar2 from "../assets/Avatar2.jpg";
import Avatar3 from "../assets/Avatar3.jpg";
import Avatar4 from "../assets/Avatar4.jpg";

const avatars = [
    { id: 1, src: Avatar1 },
    { id: 2, src: Avatar2 },
    { id: 3, src: Avatar3 },
    { id: 4, src: Avatar4 },
];

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  max-width: 500px;
  margin: 80px auto;
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  text-align: center;
  transition: all 0.3s ease-in-out;
  margin-top: 0px;

  @media (max-width: 768px) {
    padding: 2rem;
    margin: 50px auto;
    margin-left: 10px;
    margin-right: 10px;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: bold;
  color: #4e0f63;
  margin-bottom: 1rem;
  transition: all 0.3s ease-in-out;

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

const AvatarGrid = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const AvatarButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
  }
`;

const AvatarImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid transparent;
  transition: border 0.2s ease-in-out, transform 0.2s ease-in-out;

  &:hover {
    border-color: #6a1b9a;
    transform: scale(1.1);
  }

  @media (max-width: 600px) {
    width: 60px;
    height: 60px;
  }
`;

export default function ChooseAvatar() {
    return (
        <AvatarContainer>
            <Title>Choose Your Avatar</Title>
            <AvatarGrid>
                {avatars.map((avatar) => (
                    <AvatarButton key={avatar.id} onClick={() => console.log(`Clicked Avatar ${avatar.id}`)}>
                        <AvatarImage src={avatar.src} alt={`Avatar ${avatar.id}`} />
                    </AvatarButton>
                ))}
            </AvatarGrid>
        </AvatarContainer>
    );
}