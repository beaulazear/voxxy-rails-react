import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/user.js";
import styled from "styled-components";
import { LeftOutlined, EditOutlined, DeleteOutlined, UserAddOutlined, LogoutOutlined } from "@ant-design/icons";
import Woman from "../assets/Woman.jpg";
import ActivityCommentSection from './ActivityCommentSection.js';
import YourCommunity from './YourCommunity.js';

const HeaderSection = ({ activity, isOwner, onBack, onEdit, onDelete, onInvite }) => {
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const { setUser } = useContext(UserContext)

  const handleParticipantClick = (participant) => {
    setShowInvitePopup(null)
    setSelectedParticipant(participant);
  };

  const closeParticipantPopup = () => {
    setSelectedParticipant(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleInviteClick = () => {
    setSelectedParticipant(null);
    setShowInvitePopup(true);
  };

  const handleInviteSubmit = () => {
    if (!inviteEmail) return alert("Please enter a valid email.");
    onInvite(inviteEmail);
    setInviteEmail("");
    setShowInvitePopup(false);
  };

  const handleClosePopup = () => {
    setShowInvitePopup(false);
    setInviteEmail("");
  };

  const handleSelectCommunityUser = (user) => {
    setInviteEmail(user.email);
  };

  const participantsArray = Array.isArray(activity.participants) ? activity.participants : [];
  const pendingInvitesArray = Array.isArray(activity.activity_participants)
    ? activity.activity_participants.filter((p) => !p.accepted)
    : [];

  const hostParticipant = {
    name: `${activity.user?.name || "Unknown"} (Host)`,
    email: activity.user?.email || "N/A",
    confirmed: true,
    avatar: activity.user?.avatar || Woman
  };

  const allParticipants = [
    hostParticipant,
    ...participantsArray.filter((p) => p.email).map((p) => ({
      name: p.name || p.email,
      email: p.email,
      confirmed: true,
      avatar: p.avatar || Woman,
    })),
    ...pendingInvitesArray.map((p) => ({
      name: p.invited_email,
      email: p.invited_email,
      confirmed: false,
      avatar: Woman,
    })),
  ];

  function extractHoursAndMinutes(isoString) {
    if (!isoString) return "Time: TBD"; // Handle missing data

    return isoString.slice(11, 16); // Extracts "HH:MM" from "2000-01-01T12:15:00.000Z"
  }

  const handleSendThankYou = async () => {
    const confirmSend = window.confirm(
      "Are you sure you want to send a thank-you email to all participants? 📩 This will notify every participant in the activity."
    );

    if (!confirmSend) return;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${activity.id}/send_thank_you`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("Thank-you emails sent successfully! 🎉");
      } else {
        alert("Failed to send thank-you emails. Try again later.");
      }
    } catch (error) {
      console.error("Error sending thank-you emails:", error);
      alert("Something went wrong!");
    }
  };

  const handleLeaveActivity = async () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to leave this activity? This will remove you from the group and delete any responses you've made."
    );

    if (!confirmLeave) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activity_participants/leave`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ activity_id: activity.id }),
        }
      );

      if (response.ok) {
        alert("You have successfully left the activity.");
        setUser((prevUser) => ({
          ...prevUser,
          participant_activities: prevUser.participant_activities.filter(
            (p) => p.activity.id !== activity.id
          ),
        }));
        onBack();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to leave activity.");
      }
    } catch (error) {
      console.error("Error leaving activity:", error);
      alert("Something went wrong.");
    }
  };

  return (
    <HeaderContainer>
      <TopBar>
        <BackButton onClick={onBack}>
          <LeftOutlined />
        </BackButton>
        {isOwner ? (
          <ActionButtons>
            <EditIcon onClick={onEdit}>
              <EditOutlined />
            </EditIcon>
            <DeleteIcon onClick={() => onDelete(activity.id)}>
              <DeleteOutlined />
            </DeleteIcon>
          </ActionButtons>
        ) : (
          <LeaveActivityButton onClick={handleLeaveActivity}>
            <LogoutOutlined style={{ fontSize: "1.3rem" }} /> Leave
          </LeaveActivityButton>
        )}
      </TopBar>
      <Title>{activity.emoji} {activity.activity_name}</Title>
      <HostInfo>
        Hosted by: <strong>{isOwner ? "You" : activity?.user?.name || "Unknown"}</strong>
        <br></br>
        {activity.date_day ? <span> 📆 {activity.date_day}</span> : <span> 📆 Date: TBD</span>}
        {activity.date_time ? (
          <span> ⏰ {extractHoursAndMinutes(activity.date_time)}</span>
        ) : (
          <span> ⏰ Time: TBD</span>
        )}
        <br></br>
        {((!activity.date_time || !activity.date_day) && isOwner) && (
          <>
            <span>Edit the activity to change the date + time.</span>
            <br></br>
          </>
        )}
        {isOwner && (<InviteButton onClick={handleSendThankYou}>📩 Send Thank You Email</InviteButton>)}
        <br></br>
        {activity.date_notes && `Date Notes: ${activity.date_notes}`}
      </HostInfo>

      <EntryMessage>
        {activity.welcome_message ||
          "Welcome to this activity! This is a placeholder for a detailed description about what to expect, how it works, and any important details. Soon, you will be able to customize this message to fit your needs!"}
      </EntryMessage>

      <ParticipantsSection>
        <ParticipantsTitle>Voxxy Board Participants</ParticipantsTitle>
        {isOwner && (
          <InviteButton onClick={handleInviteClick}>
            <UserAddOutlined style={{ width: '85%' }} /> Invite
          </InviteButton>
        )}

        <ParticipantsRow>
          <ParticipantsScroll>
            {allParticipants.filter((p) => p.confirmed).map((participant, index) => {
              return (
                <ParticipantCircle
                  key={index}
                  title={participant.name}
                  onClick={() => handleParticipantClick(participant)}
                  $pending={!participant.confirmed}
                >
                  <ParticipantImage src={participant.avatar} alt={participant.name} />
                </ParticipantCircle>
              );
            })}
            {isOwner &&
              allParticipants.filter((p) => !p.confirmed).map((participant, index) => {
                return (
                  <ParticipantCircle
                    key={`pending-${index}`}
                    title={`${participant.name} (Pending)`}
                    $pending
                    onClick={() => handleParticipantClick(participant)} // 🟣 Make pending participants clickable
                  >
                    <ParticipantImage src={participant.avatar} alt={participant.name} />
                  </ParticipantCircle>
                );
              })}
          </ParticipantsScroll>
        </ParticipantsRow>
        <ActivityCommentSection activity={activity} />
      </ParticipantsSection>

      {selectedParticipant && (
        <ParticipantPopupOverlay onClick={closeParticipantPopup}>
          <ParticipantPopupContent onClick={(e) => e.stopPropagation()}>
            <h2>{selectedParticipant.name || selectedParticipant.email}</h2>
            <ParticipantPopupActions>
              <ParticipantPopupButton onClick={closeParticipantPopup}>Close</ParticipantPopupButton>
            </ParticipantPopupActions>
          </ParticipantPopupContent>
        </ParticipantPopupOverlay>
      )}

      {showInvitePopup && (
        <ParticipantPopupOverlay onClick={handleClosePopup}>
          <ParticipantPopupContent onClick={(e) => e.stopPropagation()}>
            <h2>Invite a Participant</h2>
            <input
              type="email"
              placeholder="Enter email..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <YourCommunity showInvitePopup={showInvitePopup} onSelectUser={handleSelectCommunityUser} />
            <ParticipantPopupActions>
              <ParticipantPopupButton onClick={handleInviteSubmit}>Send Invite</ParticipantPopupButton>
              <ParticipantPopupButton className="cancel" onClick={handleClosePopup}>Cancel</ParticipantPopupButton>
            </ParticipantPopupActions>
          </ParticipantPopupContent>
        </ParticipantPopupOverlay>
      )}
    </HeaderContainer>
  );
};

export default HeaderSection;

const LeaveActivityButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: linear-gradient(135deg, #c0392b, #a83227);
  }
`;

export const HeaderContainer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
  margin: 1rem auto;
  max-width: 600px;
`;

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

export const BackButton = styled.button`
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: #6a1b9a;
    transform: scale(1.1);
  }
`;

export const Title = styled.h1`
  font-size: clamp(1.5rem, 2.5vw, 2.2rem);
  font-weight: bold;
  text-align: center;
  color: #4e0f63;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    margin: 0;
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

export const EditIcon = styled.button`
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  color: #6a1b9a;

  &:hover {
    transform: scale(1.1);
  }
`;

export const DeleteIcon = styled(EditIcon)`
  color: #e74c3c;

  &:hover {
    color: #c0392b;
  }
`;

export const DetailsContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const DetailItem = styled.div`
  font-size: 1rem;
  padding: 0.5rem;
  background: #f7f7f7;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ParticipantsSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1.5rem;
  width: 100%;
`;

export const ParticipantsTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  color: #4e0f63;
  margin-bottom: 0rem;
  text-align: center;
`;

export const ParticipantImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

export const ParticipantsRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  overflow: hidden; /* Prevent layout shifting */
  width: 100%;
`;

export const ParticipantsScroll = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  white-space: nowrap; /* Prevent wrapping */
  padding-bottom: 10px;
  scrollbar-width: thin;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar on WebKit browsers */
  }
`;

export const ParticipantCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 75px;
  background: ${({ $pending }) => ($pending ? "#aaa" : "#4a0d5c")};
  color: white;
  text-transform: uppercase;
  flex-shrink: 0; /* Keeps items in one row */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 10px;

  /* Ensure initials show properly */
  .initials {
    white-space: nowrap;
  }
`;

export const ParticipantText = styled.span`
  font-size: 0.9rem;
  font-weight: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  transition: opacity 0.3s ease-in-out, max-width 0.3s ease-in-out;
`;

export const InviteButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin: .8rem auto;

  &:hover {
    background: linear-gradient(135deg, #4e0f63, #6a1b8a);
  }
`;

export const HostInfo = styled.p`
  text-align: center;
  font-size: 1rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 1rem;

  span {
    display: inline-block;
    margin-left: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    color: #333;
  }
`;

export const EntryMessage = styled.p`
  background: #f7f7f7;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1rem;
  color: #444;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.5;
  max-width: 450px;
  margin: 0 auto;
`;

const ParticipantPopupOverlay = styled.div`
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

const ParticipantPopupContent = styled.div`
  background: linear-gradient(135deg, #6a1b9a, #8e44ad);
  padding: 2rem;
  border-radius: 18px;
  max-width: 420px;
  width: fit-content;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  color: white;
  animation: slideUp 0.3s ease-in-out;

  @media (max-width: 600px) {
    margin: 1rem;
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

  input {
    padding: 0.75rem;
    font-size: 1rem;
    border: none;
    border-radius: 12px;
    width: 95%;
    text-align: center;
    margin-bottom: 1rem;
  }
`;

const ParticipantPopupActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const ParticipantPopupButton = styled.button`
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

  &.cancel {
    background: rgba(255, 255, 255, 0.3);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
`;