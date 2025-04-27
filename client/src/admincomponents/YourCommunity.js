import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg";
import NoCommunityMembers from "./NoCommunityMembers";

export default function YourCommunity({ showInvitePopup, onSelectUser }) {
  const { user } = useContext(UserContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!user) return null;

  const allUsersMap = new Map();
  user.activities?.forEach(activity => {
    activity.participants?.forEach(participant => {
      if (participant.id !== user.id) {
        if (!allUsersMap.has(participant.id)) {
          allUsersMap.set(participant.id, { user: participant, activities: new Set() });
        }
        allUsersMap.get(participant.id).activities.add(activity.activity_name);
      }
    });
  });
  user.participant_activities?.forEach(partActivity => {
    const { activity } = partActivity;
    if (activity && activity.user?.id !== user.id) {
      const host = activity.user;
      if (!allUsersMap.has(host.id)) {
        allUsersMap.set(host.id, { user: host, activities: new Set() });
      }
      allUsersMap.get(host.id).activities.add(activity.activity_name);

      activity.participants?.forEach(participant => {
        if (participant.id !== user.id) {
          if (!allUsersMap.has(participant.id)) {
            allUsersMap.set(participant.id, { user: participant, activities: new Set() });
          }
          allUsersMap.get(participant.id).activities.add(activity.activity_name);
        }
      });
    }
  });

  const communityUsers = Array.from(allUsersMap.values()).map(({ user, activities }) => ({
    user,
    activities: Array.from(activities),
  }));

  if (communityUsers.length === 0) {
    return <NoCommunityMembers />;
  }

  const sortedUsers = communityUsers.sort((a, b) =>
    a.user.name.localeCompare(b.user.name)
  );

  const displayedUsers = showAll ? sortedUsers : sortedUsers.slice(0, 8);

  return (
    <CommunityContainer>
      <CommunityTitle>Your Voxxy Crew 🎭</CommunityTitle>
      <UserList>
        {displayedUsers.map(({ user, activities }) => (
          <UserCard
            key={user.id}
            onClick={() =>
              showInvitePopup
                ? onSelectUser(user)
                : setSelectedUser({ user, activities })
            }
          >
            <Avatar src={user.avatar || Woman} alt={user.name} />
            <UserName>{user.name.split(' ')[0]}</UserName>
          </UserCard>
        ))}
      </UserList>

      {sortedUsers.length > 4 && (
        <ViewAllButton onClick={() => setShowAll(prev => !prev)}>
          {showAll ? "Show Less" : "View All"}
        </ViewAllButton>
      )}

      {selectedUser && !showInvitePopup && (
        <ModalOverlay onClick={() => setSelectedUser(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h2>{selectedUser.user.name}</h2>
            <h3>{selectedUser.user.email}</h3>
            <h4>Mutual Activities</h4>
            <ActivityList>
              {selectedUser.activities.map((act, idx) => (
                <li key={idx}>{act}</li>
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
  align-self: stretch;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  background-color: #201925;
  box-sizing: border-box;
`;

const CommunityTitle = styled.h2`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 600;
  color: #fff;
  margin-bottom: 1.5rem;
`;

const UserList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  justify-items: center;
  gap: 1rem;
  width: 100%;
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.75rem;
  width: 100%;  
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  padding-bottom: 0;

  &:hover {
    transform: scale(1.03);
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
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  margin-top: 0.5rem;
  white-space: nowrap;
`;

const ViewAllButton = styled.button`
  margin-top: 1rem;
  align-self: center;
  background: none;
  border: none;
  color: #9d60f8;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    text-decoration: underline;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);
  padding: 2rem;
  border-radius: 18px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  color: white;
`;

const ActivityList = styled.ul`
  list-style: none;
  padding: 1rem;
  margin: 1rem 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  max-height: 250px;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  padding: 0.75rem 1.5rem;
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
