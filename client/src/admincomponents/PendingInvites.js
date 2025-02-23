import React, { useContext } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";

const InviteContainer = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: left;
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
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
  }

  .emoji {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  h3 {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.3rem;
  }

  p {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s ease;
  background: ${(props) => (props.$decline ? "#e74c3c" : "#2ecc71")}; /* ✅ Fix */
  color: white;

  &:hover {
    background: ${(props) => (props.$decline ? "#c0392b" : "#27ae60")}; /* ✅ Fix */
  }
`;

const PendingInvites = () => {
    const { user, setUser } = useContext(UserContext);

    // ✅ Filter pending invites where `accepted: false`
    const pendingInvites = user?.participant_activities?.filter(invite => !invite.accepted) || [];

    if (pendingInvites.length === 0) {
        return null; // Don't render if there are no pending invites
    }

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

            if (response.ok) {
                alert("Invite accepted!");
                // ✅ Optimistically update UI without waiting for backend
                setUser((prevUser) => {
                    return {
                        ...prevUser,
                        participant_activities: prevUser.participant_activities.filter(
                            (p) => p.activity.id !== invite.activity.id
                        ),
                        activities: [
                            ...prevUser.activities,
                            {
                                ...invite.activity,
                                participants: [
                                    ...(invite.activity.participants || []), // Keep existing participants
                                    { id: user.id, name: user.name, email: user.email } // ✅ Add current user
                                ],
                            },
                        ],
                    };
                });
            } else {
                alert("Failed to accept invite.");
            }
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
                // ✅ Remove from pending invites
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
                            <Button $decline onClick={() => handleDecline(invite)}>Decline</Button>                        </ButtonContainer>
                    </InviteCard>
                ))}
            </InviteGrid>
        </InviteContainer>
    );
};

export default PendingInvites;