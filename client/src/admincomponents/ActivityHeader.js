import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/user.js";
import styled from "styled-components";
import { LeftOutlined, EditOutlined, DeleteOutlined, UserAddOutlined, LogoutOutlined } from "@ant-design/icons";
import Woman from "../assets/Woman.jpg";
import YourCommunity from './YourCommunity.js';
import mixpanel from 'mixpanel-browser';

const HeaderSection = ({ activity, isOwner, onBack, onEdit, onDelete, onInvite }) => {
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const { user, setUser } = useContext(UserContext);

  const handleParticipantClick = (participant) => {
    setShowInvitePopup(null);
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
    if (process.env.NODE_ENV === 'production') {
      mixpanel.track('Participant Invited', {
        user: user.id,
      });
    }
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
    if (!isoString) return "Time: TBD";
    return isoString.slice(11, 16);
  }

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
    <>
      <HeaderContainer>
        <IconButtonLeft onClick={onBack}>
          <LeftOutlined />
        </IconButtonLeft>
        {isOwner ? (
          <ButtonGroup>
            <EditButton onClick={onEdit}>
              <EditOutlined />
            </EditButton>
            <DeleteButton onClick={() => onDelete(activity.id)}>
              <DeleteOutlined />
            </DeleteButton>
          </ButtonGroup>
        ) : (
          <LeaveButton onClick={handleLeaveActivity}>
            <LogoutOutlined /> Leave
          </LeaveButton>
        )}

        <Title>
          <span className="name">{activity.activity_name}</span>
        </Title>

        <MetaRow>
          <MetaItem>
            <label>Activty Type:</label>
            <span>{activity.activity_type + ' 🍜' || "N/A"}</span>
          </MetaItem>
          <MetaItem>
            <label>Location:</label>
            <span>{activity.activity_location || "TBD"}</span>
          </MetaItem>
          <MetaItem>
            <label>Host:</label>
            <span>{isOwner ? "You" : activity.user?.name || "Unknown"}</span>
          </MetaItem>
          <MetaItem>
            <label>Date:</label>
            <span>{activity.date_day || "TBD"}</span>
          </MetaItem>
          <MetaItem>
            <label>Time:</label>
            <span>
              {activity.date_time
                ? extractHoursAndMinutes(activity.date_time)
                : "TBD"}
            </span>
          </MetaItem>
        </MetaRow>


        <EntryMessage onClick={isOwner ? onEdit : undefined}>
          {activity.welcome_message ||
            "Welcome to this activity! … customize this message to fit your needs!"}
        </EntryMessage>
      </HeaderContainer>
      <AttendeeContainer>
        <ParticipantsSection>
          <ParticipantsTitle>Attendees - {allParticipants.length}</ParticipantsTitle>
          <ParticipantsRow>
            <ParticipantsScroll>
              {isOwner && (
                <InviteCircle title="Invite a participant" onClick={handleInviteClick}>
                  <UserAddOutlined />
                </InviteCircle>
              )}
              {allParticipants.filter((p) => p.confirmed).map((participant, index) => (
                <ParticipantCircle
                  key={index}
                  title={participant.name}
                  onClick={() => handleParticipantClick(participant)}
                  $pending={false}
                >
                  <ParticipantImage src={participant.avatar} alt={participant.name} />
                </ParticipantCircle>
              ))}
              {isOwner &&
                allParticipants.filter((p) => !p.confirmed).map((participant, index) => (
                  <ParticipantCircle
                    key={`pending-${index}`}
                    title={`${participant.name} (Pending)`}
                    $pending={true}
                    onClick={() => handleParticipantClick(participant)}
                  >
                    <ParticipantImage src={participant.avatar} alt={participant.name} />
                  </ParticipantCircle>
                ))}
            </ParticipantsScroll>
          </ParticipantsRow>
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
      </AttendeeContainer>
    </>
  );
};

export default HeaderSection;

const HeaderContainer = styled.div`
  position: relative;
  padding: 2.5rem .5rem .5rem;
  border-radius: 16px;
  margin: auto;
  max-width: 800px;
`;

const IconButton = styled.button`
  position: absolute;
  top: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const IconButtonLeft = styled(IconButton)`
  left: 0rem;
`;

const ButtonGroup = styled.div`
  position: absolute;
  top: .5rem;
  right: 0rem;
  display: flex;
  gap: 0.75rem;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #6a1b9a;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;

  &:hover {
    color: #c0392b;
    transform: scale(1.1);
  }
`;


const LeaveButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #a02e2e;
  color: #fff;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const Title = styled.h1`
  margin: 0 auto 0.75rem;
  margin-top: 1rem;
  text-align: center;
  font-size: clamp(1.75rem, 3vw, 2.4rem);
  color: #fff;

  .emoji {
    display: inline-block;
    margin-right: 0.3rem;
  }
  .name {
    font-weight: 700;
  }
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  label {
    font-size: 0.8rem;
    color: #ccc;
    margin-right: 0.25rem;
    text-transform: uppercase;
  }
  span {
    font-size: 0.9rem;
    color: #fff;
  }
`;

const EntryMessage = styled.div`
  padding: 1rem;
  border-radius: 10px;
  font-weight: 500;
  color: #fff;
  line-height: 1.5;
  margin: 0 auto;
  max-width: 450px;
  cursor: ${({ onClick }) => (onClick ? "pointer" : "default")};
`;

export const AttendeeContainer = styled.div`
  background: #2A1E30;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
  text-align: left;
  margin: 1rem auto;
  max-width: 600px;
`;

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;

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
  color: #fff;

  &:hover {
    color: #fff;
    transform: scale(1.1);
  }
`;

export const ActivityDetails = styled.div`
  font-size: 0.9rem;
  color: #fff;
  text-align: center;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
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

export const ParticipantsSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const ParticipantsTitle = styled.h4`
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 0;
  font-weight: bold;
  text-align: left;
  margin-top: 0;
`;

export const ParticipantsRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  overflow: hidden;
  width: 100%;
`;

export const ParticipantsScroll = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 10px;
  scrollbar-width: thin;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const ParticipantCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 75px;
  background: ${({ $pending }) => ($pending ? "#aaa" : "#4a0d5c")};
  color: white;
  text-transform: uppercase;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 10px;

  .initials {
    white-space: nowrap;
  }
`;

export const ParticipantImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

const InviteCircle = styled(ParticipantCircle)`
  background: #9051e1;
  border: 2px dashed white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const LeaveActivityButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background: #2A1E30;

  &:hover {
  color: red;
  }
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
  background: #201925;
  padding: 2rem;
  border-radius: 18px;
  max-width: 420px;
  width: fit-content;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  color: white;
  animation: slideUp 0.3s ease-in-out;
  max-height: 90vh;
  overflow-y: auto;

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