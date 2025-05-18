import React, { useContext } from "react";
import styled, { keyframes } from "styled-components";
import { UserContext } from "../context/user";
import groupmeals from '../assets/groupmeals.jpeg';
import LetsMeetCardThree from '../assets/LetsMeetCardThree.jpeg';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const InviteContainer = styled.div`
`;

const InviteGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 320px));
  gap: 1rem;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem 0;
  }
`;

const InviteCard = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  cursor: default;
  &:hover { transform: none; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }

  .button-group {
    position: relative;
    width: 100%;
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }
`;

export const ImageContainer = styled.div`
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background-image: ${props => `url("${props.$bgimage}")`};
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
  
  ${InviteCard}:hover & {
    transform: scale(1.1);
  }
`;


export const CardLabel = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 45%;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.75rem 1rem;

  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    text-align: left;
  }

  .meta {
    font-size: 0.8rem;
    margin-top: .5rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
  }
`;

export const TypeTag = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #7b298d;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
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
  background: ${({ $decline }) =>
    $decline
      ? "linear-gradient(135deg, #e74c3c, #c0392b)"
      : "linear-gradient(135deg, #8e44ad, #6a1b9a)"};
  color: #fff;
  box-shadow: 0 3px 6px rgba(0,0,0,0.2);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 5px 10px rgba(0,0,0,0.3);
  }
`;

const NoBoardsContainer = styled.div`
  border-radius: 1rem;
  max-width: 450px;
  padding-left:0.5rem;
  animation: ${fadeIn} 0.8s ease-out;
`;

const Message = styled.p`
  font-family: 'Lato', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 300;       /* light */
  color: rgba(255,255,255,0.8);
  margin-bottom: 1rem;
  line-height: 1.6;
  letter-spacing: -0.25px;
  text-align: left;
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

  return (
    <InviteContainer>
      {pendingInvites.length > 0 ? (
        <InviteGrid>
          {pendingInvites.map(invite => {
            let bgUrl = invite.activity.activity_type.toLowerCase() === 'meeting'
              ? LetsMeetCardThree
              : groupmeals;

            return (
              <InviteCard key={invite.id}>
                <ImageContainer $bgimage={bgUrl} className="image-bg" />
                <TypeTag>
                  {invite.activity.activity_type}
                </TypeTag>
                <CardLabel>
                  <h3>{invite.activity.activity_name}</h3>
                  <div className="meta">
                    <span>Host: {invite.activity.user.name}</span>
                    <span>
                      {invite.activity.date_day || "TBD"} ·{" "}
                      {invite.activity.date_time?.slice(11, 16) || "TBD"}
                    </span>
                  </div>
                  <div className="button-group">
                    <Button onClick={() => handleAccept(invite)}>Accept</Button>
                    <Button $decline onClick={() => handleDecline(invite)}>Decline</Button>
                  </div>
                </CardLabel>
              </InviteCard>
            )
          }
          )}
        </InviteGrid>
      ) : (
        <NoBoardsContainer>
          <Message>
            No invites! Don’t wait for your friends—be the one to start the next activity! 🎉
          </Message>
        </NoBoardsContainer>
      )}
    </InviteContainer>
  );
};

export default PendingInvites;
