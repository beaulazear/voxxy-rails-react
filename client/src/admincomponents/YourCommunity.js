import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg"; // Fallback avatar

const CommunityContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const AvatarGrid = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 10px;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px;
  border-radius: 12px;
  min-width: 120px;
  flex-shrink: 0;
  scroll-snap-align: start;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
  }
`;

const Avatar = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
`;

const UserName = styled.p`
  font-size: 1rem;
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
  animation: fadeIn 0.3s ease-in-out;
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
  animation: slideUp 0.3s ease-in-out;

  @media (max-width: 600px) {
    margin: 1rem; /* This adds even spacing around the modal */
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  h2 {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-transform: capitalize;
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

  li {
    padding: 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  }

  li:last-child {
    border-bottom: none;
  }
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
  transition: all 0.3s ease-in-out;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
`;

const YourCommunity = () => {
    const { user } = useContext(UserContext);
    const [selectedUser, setSelectedUser] = useState(null);

    if (!user) return null;

    const recentUsers = [
        ...(user.activities || []).flatMap(activity =>
            activity.participants.map(p => ({
                user: p.user,
                activityName: activity.activity_name,
            }))
        ),

        ...(user.participant_activities || [])
            .filter((p) => p.accepted && p.activity && p.activity.user)
            .map((p) => ({
                user: p.activity.user,
                activityName: p.activity.activity_name,
            }))
    ]
        .filter(({ user: u }) => u && u.id !== user.id)
        .reduce((acc, { user, activityName }) => {
            const existing = acc.find((entry) => entry.user.id === user.id);
            if (existing) {
                existing.activities.push(activityName);
            } else {
                acc.push({
                    user,
                    activities: [activityName],
                });
            }
            return acc;
        }, []);

    if (recentUsers.length === 0) return null;

    return (
        <CommunityContainer>
            <AvatarGrid>
                {recentUsers.map(({ user, activities }) => (
                    <UserCard key={user.id} onClick={() => setSelectedUser({ user, activities })}>
                        <Avatar src={user.avatar || Woman} alt={user.name} />
                        <UserName>{user.name}</UserName>
                    </UserCard>
                ))}
            </AvatarGrid>

            {selectedUser && (
                <ModalOverlay onClick={() => setSelectedUser(null)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedUser.user.name}</h2>
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
};

export default YourCommunity;