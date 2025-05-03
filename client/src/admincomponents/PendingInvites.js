import React, { useContext } from "react";
import styled, { keyframes } from "styled-components";
import { UserContext } from "../context/user";
import Friends from "../assets/Friends.svg"; // Your uploaded image

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const InviteContainer = styled.div`
  animation: ${fadeIn} 0.8s ease-out;
  max-width: 1200px;
  margin: 0 auto;
`;

const InviteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InviteCard = styled.div`
  background: #2C1E33;
  color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  min-width: 310px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5);
  }

  .content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .type-label {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    background: #7b298d;
    padding: 4px 10px;
    border-radius: 999px;
    display: inline-block;
    width: fit-content;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .location,
  .host-info {
    font-size: 0.85rem;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-block;
    margin-top: 0.5rem;
  }

  .button-group {
    padding: 0 1rem 1rem;
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s, box-shadow 0.2s;
  background: ${(props) =>
        props.$decline
            ? "linear-gradient(135deg, #e74c3c, #c0392b)"
            : "linear-gradient(135deg, #8e44ad, #6a1b9a)"};
  color: #fff;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
  }
`;

const NoBoardsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  max-width: 1100px;
  margin: auto 0;
  padding-top: 0rem;
  text-align: left;
  padding-bottom: 25px;
  animation: ${fadeIn} 0.8s ease-out;

  @media (max-width: 1024px) {
    gap: 1rem;
    max-width: 900px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
`;

const Image = styled.img`
  width: 50%;
  max-width: 450px;
  height: auto;
  border-radius: 12px;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 55%;
    max-width: 380px;
  }

  @media (max-width: 768px) {
    width: 85%;
    max-width: 320px;
  }

  @media (max-width: 480px) {
    width: 100%;
    max-width: 280px;
  }
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 1.25rem;
  line-height: 1.5;
  padding-right: 5rem;
  padding-left: 5rem;

  @media (max-width: 768px) {
    text-align: center;
    font-size: 1rem;
    padding-right: 3rem;
    padding-left: 3rem;
  }
`;

const PendingInvites = ({ handleActivityClick }) => {
    const { user, setUser } = useContext(UserContext);
    const pendingInvites = user?.participant_activities?.filter(
        (invite) => !invite.accepted
    ) || [];

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

            setUser((prevUser) => ({
                ...prevUser,
                participant_activities: prevUser.participant_activities.map((p) =>
                    p.activity.id === updatedActivity.id
                        ? { ...p, accepted: true, activity: updatedActivity }
                        : p
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

            handleActivityClick(updatedActivity)
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
                setUser((prevUser) => ({
                    ...prevUser,
                    participant_activities: prevUser.participant_activities.filter((p) => p.activity.id !== invite.activity.id),
                }));
                alert("Invite declined.");
            } else {
                alert("Failed to decline invite.");
            }
        } catch (error) {
            console.error("❌ Error declining invite:", error);
        }
    };

    function extractHoursAndMinutes(isoString) {
        if (!isoString) return "Time: TBD";
        return isoString.slice(11, 16);
    }

    return (
        <InviteContainer>
            {pendingInvites.length > 0 ? (
                <InviteGrid>
                    {pendingInvites.map((invite) => (
                        <InviteCard key={invite.id} onClick={() => { }}>
                            <div className="content">
                                <div className="type-label">
                                    {invite.activity.activity_type} {invite.activity.emoji}
                                </div>
                                <h3>{invite.activity.activity_name}</h3>
                                <div className="location">

                                    {invite.activity.date_day ? `📆 ${invite.activity.date_day}` : "📆 TBD"}{" "}
                                    {invite.activity.date_time
                                        ? `⏰ ${extractHoursAndMinutes(invite.activity.date_time)}`
                                        : "⏰ TBD"}
                                </div>
                                <div className="host-info">👤 Host: {invite.activity.user.name} 📍 {invite.activity.activity_location}</div>
                            </div>
                            <div className="button-group">
                                <Button onClick={() => handleAccept(invite)}>Accept</Button>
                                <Button $decline onClick={() => handleDecline(invite)}>Decline</Button>
                            </div>
                        </InviteCard>
                    ))}
                </InviteGrid>
            ) : (
                <NoBoardsContainer>
                    <Image src={Friends} alt="No Invites" />
                    <Message>
                        No invites! Don’t wait for your friends to invite you—be the one to start the next activity! 🎉
                    </Message>
                </NoBoardsContainer>
            )}
        </InviteContainer>
    );
};

export default PendingInvites;
