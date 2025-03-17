import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg"; // Fallback avatar
import NoCommunityMembers from "./NoCommunityMembers";

export default function YourCommunity({ showInvitePopup, onSelectUser }) {
  const { user } = useContext(UserContext);
  const [selectedUser, setSelectedUser] = useState(null);

  if (!user) return null;

  const allUsers = new Map();

  user.activities?.forEach(activity => {
    activity.participants?.forEach(participant => {
      if (participant.id !== user.id) {
        allUsers.set(participant.id, {
          user: participant,
          activities: new Set([activity.activity_name])
        });
      }
    });
  });

  user.participant_activities?.forEach(participant_activity => {
    const activity = participant_activity.activity;
    if (!activity) return;

    if (activity.user?.id !== user.id) {
      if (allUsers.has(activity.user.id)) {
        allUsers.get(activity.user.id).activities.add(activity.activity_name);
      } else {
        allUsers.set(activity.user.id, {
          user: activity.user,
          activities: new Set([activity.activity_name])
        });
      }
    }

    activity.participants?.forEach(participant => {
      if (participant.id !== user.id) {
        if (allUsers.has(participant.id)) {
          allUsers.get(participant.id).activities.add(activity.activity_name);
        } else {
          allUsers.set(participant.id, {
            user: participant,
            activities: new Set([activity.activity_name])
          });
        }
      }
    });
  });

  let recentUsers = Array.from(allUsers.values()).map(entry => ({
    user: entry.user,
    activities: Array.from(entry.activities)
  }));

  if (recentUsers.length === 0) {
    return <NoCommunityMembers />;
  }
  return (
    <CommunityContainer>
      <CommunityTitle>Your Voxxy Crew 🎭</CommunityTitle>
      <AvatarScrollContainer>
        <AvatarGrid>
          {recentUsers.map(({ user, activities }) => (
            <UserCard
              key={user.id}
              onClick={() =>
                showInvitePopup
                  ? onSelectUser(user) // ✅ If inviting, set email
                  : setSelectedUser({ user, activities }) // ✅ Otherwise, open modal
              }
            >
              <Avatar src={user.avatar || Woman} alt={user.name} />
              <UserName>{user.name}</UserName>
            </UserCard>
          ))}
        </AvatarGrid>
      </AvatarScrollContainer>

      {selectedUser && !showInvitePopup && (
        <ModalOverlay onClick={() => setSelectedUser(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>{selectedUser.user.name}</h2>
            <h3>{selectedUser.user.email}</h3>
            <h4>Mutual Activities</h4>
            <ActivityList>
              {selectedUser.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ActivityList>
            <CloseButton onClick={() => setSelectedUser(null)}>Close</CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </CommunityContainer>
  );
}

const CommunityContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: -2rem;
  margin-left: -2rem;
`;

const AvatarScrollContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100vw;
  white-space: nowrap;
  scrollbar-width: thin;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar {
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: #8e44ad;
    border-radius: 5px;
  }
`;

const AvatarGrid = styled.div`
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  gap: .7rem;
  width: max-content; /* ✅ Dynamically adjusts to the content width */
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px;
  border-radius: 12px;
  min-width: 90px;
  flex-shrink: 0;
  scroll-snap-align: center;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
  }
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
`;

const UserName = styled.p`
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  margin-top: 8px;
  white-space: nowrap;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);
  padding: 2rem;
  border-radius: 18px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  color: white;
  
  @media (max-width: 600px) {
    margin: 1rem;
  }
`;

const ActivityList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  margin-top: 1rem;
  padding: 0.7rem 1.4rem;
  background: white;
  color: #6a1b9a;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
`;

const CommunityTitle = styled.p`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 600;
  text-align: left;
  padding: 1.5rem 2.5rem 1rem;
  margin: 0;
  max-width: 1200px;

  @media (max-width: 768px) {
    padding: 0.5rem;
    text-align: center;
  }
`;