import React, { useContext } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";

const InviteContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0;
`;

const SectionTitle = styled.p`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  margin: 0;
  text-align: left;
  font-weight: 600;
  color: #333;
`;

const InviteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  justify-content: start;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InviteCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  text-align: left;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  cursor: pointer;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
  }

  .emoji {
    font-size: 3rem;
    margin-bottom: 0.75rem;
  }

  h3 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.3rem;
  }

  p {
    font-size: 0.95rem;
    color: #555;
    margin-bottom: 0.4rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

const Button = styled.button`
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease-in-out;
  background: ${(props) => (props.$decline ? "#ff4d4d" : "#6a1b9a")};
  color: white;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background: ${(props) => (props.$decline ? "#d93636" : "#8e44ad")};
    transform: scale(1.05);
  }
`;

const PendingInvites = () => {
    const { user, setUser } = useContext(UserContext);

    const pendingInvites = user?.participant_activities?.filter(invite => !invite.accepted) || [];

    if (pendingInvites.length === 0) {
        return null;
    }

    console.log(user)

    const handleAccept = async (invite) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activity_participants/accept`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ email: user.email, activity_id: invite.activity.id }),
                }
            );

            if (!response.ok) {
                alert("Failed to accept invite.");
                return;
            }

            const updatedActivity = await response.json();

            console.log(updatedActivity)

            setUser((prevUser) => ({
                ...prevUser,
                participant_activities: prevUser.participant_activities.map((p) =>
                    p.activity.id === updatedActivity.id ? { ...p, accepted: true, activity: updatedActivity } : p
                ),
                activities: prevUser.activities.map((activity) =>
                    activity.id === updatedActivity.id
                        ? {
                            ...updatedActivity,
                            participants: [
                                ...(updatedActivity.participants || []),
                                { id: user.id, name: user.name, email: user.email },
                            ],
                            group_size: updatedActivity.group_size + 1,
                            comments: updatedActivity.comments,
                        }
                        : activity
                ),
            }));

            alert("Invite accepted!");
        } catch (error) {
            console.error("❌ Error accepting invite:", error);
        }
    };

    const handleDecline = async (invite) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activity_participants/${invite.id}`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            if (response.ok) {
                alert("Invite declined.");
                setUser((prevUser) => ({
                    ...prevUser,
                    participant_activities: prevUser.participant_activities.filter(
                        (p) => p.activity.id !== invite.activity.id
                    ),
                }));
            } else {
                alert("Failed to decline invite.");
            }
        } catch (error) {
            console.error("❌ Error declining invite:", error);
        }
    };

    return (
        <InviteContainer>
            <SectionTitle>Pending Invites</SectionTitle>
            <InviteGrid>
                {pendingInvites.map((invite) => (
                    <InviteCard key={invite.id}>
                        <div className="emoji">{invite.activity.emoji || "📅"}</div>
                        <h3>{invite.activity.activity_name}</h3>
                        <p>📍 {invite.activity.activity_location}</p>
                        <p>👤 Host: {invite.activity.user.name}</p>
                        <ButtonContainer>
                            <Button onClick={() => handleAccept(invite)}>Accept</Button>
                            <Button $decline onClick={() => handleDecline(invite)}>Decline</Button>
                        </ButtonContainer>
                    </InviteCard>
                ))}
            </InviteGrid>
        </InviteContainer>
    );
};

export default PendingInvites;