import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/user.js";
import styled, { keyframes, css } from "styled-components";
import {
  LeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Users, CalendarDays, Clock, HelpCircle, X } from "lucide-react";
import { message } from "antd";
import Woman from "../assets/Woman.jpg";
import MultiSelectCommunity from "./MultiSelectCommunity.js";
import mixpanel from "mixpanel-browser";
import UpdateDetailsModal from "./UpdateDetailsModal.js";

const ActivityHeader = ({ activity, isOwner, onBack, onEdit, onDelete, onInvite, onCreateBoard }) => {
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const [manualInput, setManualInput] = useState("");
  const [manualEmails, setManualEmails] = useState([]);
  const [communitySelected, setCommunitySelected] = useState([]);

  const [isBouncing, setIsBouncing] = useState(true);

  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const bounceDuration = 3000;
    const inactivityDelay = 10000;
    let bounceTimeout, inactivityTimeout;

    const stopBounce = () => setIsBouncing(false);
    const startBounce = () => {
      setIsBouncing(true);
      clearTimeout(bounceTimeout);
      bounceTimeout = setTimeout(stopBounce, bounceDuration);
    };

    const resetInactivity = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(startBounce, inactivityDelay);
    };

    // initial kickoff
    startBounce();
    resetInactivity();

    // listen for any user activity
    ["mousemove", "keydown", "click", "touchstart"].forEach(evt =>
      document.addEventListener(evt, resetInactivity)
    );

    return () => {
      clearTimeout(bounceTimeout);
      clearTimeout(inactivityTimeout);
      ["mousemove", "keydown", "click", "touchstart"].forEach(evt =>
        document.removeEventListener(evt, resetInactivity)
      );
    };
  }, []);

  const toggleHelp = () => setHelpVisible(v => !v);
  const handleOpenUpdate = () => setShowUpdate(true);
  const handleCloseUpdate = () => setShowUpdate(false);
  const handleUpdate = updatedActivity => {
    setUser(prev => ({
      ...prev,
      activities: prev.activities.map(a =>
        a.id === updatedActivity.id ? updatedActivity : a
      )
    }));
  };

  const handleInviteClick = () => {
    setManualInput("");
    setManualEmails([]);
    setCommunitySelected([]);
    setSelectedParticipant(null);
    setShowInvitePopup(true);
  };
  const handleClosePopup = () => {
    setShowInvitePopup(false);
  };

  const handleAddEmail = () => {
    const email = manualInput.trim().toLowerCase();
    // simple email regex check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return message.error("Please enter a valid email.");
    }
    if (manualEmails.includes(email)) {
      return message.info("You've already added that email.");
    }
    setManualEmails((prev) => [...prev, email]);
    setManualInput("");
  };
  const handleInviteSubmit = () => {
    const emails = Array.from(
      new Set([
        ...manualEmails,
        ...communitySelected.map((u) => u.email.toLowerCase()),
      ])
    );

    if (emails.length === 0) {
      return message.error("Select or add at least one email.");
    }

    emails.forEach((email) => {
      onInvite(email);
      if (process.env.NODE_ENV === "production") {
        mixpanel.track("Participant Invited", { user: user.id, email });
      }
    });

    message.success("Invitation(s) sent!");
    setShowInvitePopup(false);
  };

  function getOrdinalSuffix(d) {
    if (d >= 11 && d <= 13) return "th";
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }
  function formatDate(ds) {
    if (!ds) return "TBD";
    const [y, m, d] = ds.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const mn = dt.toLocaleString("en-US", { month: "long" });
    return `${mn} ${d}${getOrdinalSuffix(d)}`;
  }
  function formatTime(ts) {
    if (!ts) return "TBD";
    const tp = ts.split("T")[1];
    const [h0, m0] = tp.split(":");
    let h = parseInt(h0, 10);
    const suf = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `${h}:${m0} ${suf}`;
  }

  const participantsArray = Array.isArray(activity.participants) ? activity.participants : [];
  const pendingInvitesArray = Array.isArray(activity.activity_participants)
    ? activity.activity_participants.filter(p => !p.accepted)
    : [];
  const hostParticipant = {
    name: `${activity.user?.name || "Unknown"} (Host)`,
    email: activity.user?.email || "N/A",
    confirmed: true,
    avatar: activity.user?.avatar || Woman,
    created_at: activity.user?.created_at,
  };
  const allParticipants = [
    hostParticipant,
    ...participantsArray
      .filter(p => p.email)
      .map(p => ({
        name: p.name || p.email,
        email: p.email,
        confirmed: true,
        avatar: p.avatar || Woman,
        created_at: p.created_at,
      })),
    ...pendingInvitesArray.map(p => ({
      name: p.invited_email,
      email: 'Invite Pending',
      confirmed: false,
      avatar: Woman,
      created_at: null,
    })),
  ];

  const shareUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${activity.id}/share`;

  return (
    <>
      <HeaderContainer>
        <TopBar>
          <LeftActionButtons>
            <BackButton onClick={onBack}>
              <LeftOutlined />
            </BackButton>
            <HelpIcon $bounce={isBouncing} onClick={toggleHelp} title="Need help?">
              <HelpCircle />
            </HelpIcon>
          </LeftActionButtons>

          <ActivityType>
            {activity.activity_type === 'Restaurant' ? 'Lets Eat! 🍜' : 'Lets Meet! 👥' }
          </ActivityType>

          <ActionButtons>
            {isOwner ? (
              <>
                <EditIcon onClick={handleOpenUpdate}>
                  <EditOutlined />
                </EditIcon>
                <DeleteIcon onClick={() => onDelete(activity.id)}>
                  <DeleteOutlined />
                </DeleteIcon>
              </>
            ) : (
              <LeaveButton onClick={async () => {
                if (!window.confirm("Are you sure you want to leave this activity? This will remove you and delete your responses.")) return;
                try {
                  const res = await fetch(
                    `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activity_participants/leave`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ activity_id: activity.id }),
                    }
                  );
                  if (res.ok) {
                    alert("You have successfully left the activity.");
                    setUser(prev => ({
                      ...prev,
                      participant_activities: prev.participant_activities.filter(
                        p => p.activity.id !== activity.id
                      ),
                    }));
                    onBack();
                  } else {
                    const data = await res.json();
                    alert(data.error || "Failed to leave activity.");
                  }
                } catch {
                  alert("Something went wrong leaving the activity.");
                }
              }}>
                <LogoutOutlined /> Leave
              </LeaveButton>
            )}
          </ActionButtons>
        </TopBar>

        <Title>{activity.activity_name}</Title>
        <MetaRow>
          <MetaItem>
            <label><CalendarDays size={18} /></label>
            <span>{formatDate(activity.date_day)}</span>
          </MetaItem>
          <MetaItem>
            <label><Clock size={18} /></label>
            <span>{activity.date_time ? formatTime(activity.date_time) : "TBD"}</span>
          </MetaItem>
          {activity.finalized && (
            <MetaItem>
              <label>
                <a
                  style={{ textDecoration: "none", marginTop: "0rem" }}
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share Final Details
                </a>
              </label>
            </MetaItem>
          )}
        </MetaRow>
        <HostMessageContainer>
          <HostName>
            Organizer: {activity.user?.name || "N/A"}
          </HostName>
          <MessageLine>
            {activity.welcome_message || "Welcome to this activity!"}
          </MessageLine>
        </HostMessageContainer>

        {!activity.finalized && isOwner && (
          <ChatButton onClick={onEdit}>Finalize Board</ChatButton>
        )}

        {helpVisible && (
          <HelpPopup onClick={e => e.stopPropagation()}>
            <PopupHeader>
              <PopupTitle>How to use this page</PopupTitle>
              <CloseButton onClick={toggleHelp}>
                <X size={16} />
              </CloseButton>
            </PopupHeader>
            <PopupList>
              {activity.activity_type === "Meeting" ? (
                <>
                  <li>
                    <strong>✨ Submit Your Availability</strong>
                    <p>Let us know when you’re free to hang out.</p>
                  </li>
                  <li>
                    <strong>✉️ Invite Friends</strong>
                    <p>Send email invites to get everyone on board and voting.</p>
                  </li>
                  <li>
                    <strong>🗓 Compare Availabilities</strong>
                    <p>See overlapping slots among all attendees.</p>
                  </li>
                  <li>
                    <strong>👍 Pin & Vote</strong>
                    <p>Pin your top time slots and vote on the group’s favorites.</p>
                  </li>
                  <li>
                    <strong>🎉 Finalize & Share</strong>
                    <p>The host confirms the winning time, then shares a link and calendar invite.</p>
                  </li>
                </>
              ) : activity.activity_type === "Restaurant" ? (
                <>
                  <li>
                    <strong>🍽️ Explore Recommendations</strong>
                    <p>Browse AI-powered restaurant suggestions based on group preferences.</p>
                  </li>
                  <li>
                    <strong>✉️ Invite Friends</strong>
                    <p>Send email invites so your crew can weigh in and vote.</p>
                  </li>
                  <li>
                    <strong>👍 Pin & Vote</strong>
                    <p>Pin your favorite spots and cast your vote.</p>
                  </li>
                  <li>
                    <strong>🎉 Finalize & Reserve</strong>
                    <p>The host selects the winning restaurant and locks in the reservation.</p>
                  </li>
                  <li>
                    <strong>📅 Add to Calendar</strong>
                    <p>One-click calendar add so no one misses dinner.</p>
                  </li>
                </>
              ) : (
                <li>
                  <strong>❓ No specific guide available</strong>
                  <p>Select “Meet” or “Eat” to see tailored steps.</p>
                </li>
              )}
            </PopupList>
          </HelpPopup>
        )}
      </HeaderContainer>

      <AttendeeContainer>
        <ParticipantsSection>
          <ParticipantsTitle>
            <Users size={20} /> Attendees - {allParticipants.length}
          </ParticipantsTitle>
          <ParticipantsRow>
            <ParticipantsScroll>
              {isOwner && (
                <InviteCircle onClick={handleInviteClick}>
                  <UserAddOutlined />
                </InviteCircle>
              )}
              {allParticipants
                .filter(p => p.confirmed)
                .map((p, i) => (
                  <ParticipantCircle
                    key={`p${i}`}
                    onClick={() => setSelectedParticipant(p)}
                    style={{ cursor: "pointer" }}
                  >
                    <ParticipantImage src={p.avatar} alt={p.name} />
                  </ParticipantCircle>
                ))}
              {isOwner &&
                allParticipants
                  .filter(p => !p.confirmed)
                  .map((p, i) => (
                    <ParticipantCircle
                      key={`i${i}`}
                      $pending
                      onClick={() => setSelectedParticipant(p)}
                      style={{ cursor: "pointer" }}
                    >
                      <ParticipantImage src={p.avatar} alt={p.name} />
                    </ParticipantCircle>
                  ))}
            </ParticipantsScroll>
          </ParticipantsRow>
        </ParticipantsSection>
      </AttendeeContainer>

      {showUpdate && (
        <UpdateDetailsModal
          activity={activity}
          onClose={handleCloseUpdate}
          onUpdate={handleUpdate}
        />
      )}

      {selectedParticipant && (
        <ParticipantPopupOverlay onClick={() => setSelectedParticipant(null)}>
          <ParticipantPopupContent onClick={e => e.stopPropagation()}>
            <h2>{selectedParticipant.name || 'Pending Confirmation'}</h2>
            <p style={{ margin: "0.5rem 0", color: "#ccc" }}>
              {selectedParticipant.email}
            </p>
            {selectedParticipant.created_at && (
              <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>
                Joined:{" "}
                {new Date(selectedParticipant.created_at).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            )}
            <ParticipantPopupActions>
              <ParticipantPopupButton onClick={() => setSelectedParticipant(null)}>
                Close
              </ParticipantPopupButton>
            </ParticipantPopupActions>
          </ParticipantPopupContent>
        </ParticipantPopupOverlay>
      )}

      {showInvitePopup && (
        <ParticipantPopupOverlay onClick={handleClosePopup}>
          <ParticipantPopupContent onClick={(e) => e.stopPropagation()}>
            <h2>Invite Participants</h2>

            {/* manual entry */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <DarkInput
                type="text"
                placeholder="Enter email…"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
              <AddButton onClick={handleAddEmail}>Add</AddButton>
            </div>

            {/* pills for manual emails */}
            <EmailsContainer>
              {manualEmails.map((email, i) => (
                <EmailPill key={i}>
                  {email}
                  <PillClose onClick={() =>
                    setManualEmails((prev) => prev.filter((_, idx) => idx !== i))
                  }>
                    &times;
                  </PillClose>
                </EmailPill>
              ))}
            </EmailsContainer>

            {/* community multi-select */}
            <MultiSelectCommunity
              onSelectionChange={setCommunitySelected}
              onCreateBoard={onCreateBoard}
            />

            <ParticipantPopupActions>
              <ParticipantPopupButton onClick={handleInviteSubmit}>
                Send Invite
              </ParticipantPopupButton>
              <ParticipantPopupButton className="cancel" onClick={handleClosePopup}>
                Cancel
              </ParticipantPopupButton>
            </ParticipantPopupActions>
          </ParticipantPopupContent>
        </ParticipantPopupOverlay>
      )}

    </>
  );
};

export default ActivityHeader;

const colors = {
  accent: '#cc31e8',
};

const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
  60% { transform: translateY(-3px); }
`;

const DarkInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  background: rgba(255, 255, 255, 0.08);
  color: #eee;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  font-family: "Inter", sans-serif;
  transition: border-color 0.2s, background 0.2s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.12);
    border-color: #9051e1;
    box-shadow: 0 0 0 3px rgba(144, 81, 225, 0.2);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.4);
    cursor: not-allowed;
  }
`;

const HeaderContainer = styled.div`
  position: relative;
  border-radius: 16px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;
  width: 100%;
  max-width: 450px;
  margin: auto;
`;

const LeftActionButtons = styled.div`
  justify-self: start;
  display: flex;
`;

const BackButton = styled.button`
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #fff;
  cursor: pointer;
`;

const HelpIcon = styled(BackButton)`
  font-size: 1.4rem;
  ${({ $bounce }) => $bounce && css`
    animation: ${bounceAnimation} 1s ease infinite;
  `}
`;

const ActivityType = styled.div`
  font-family: "Montserrat", sans-serif;
  font-size: clamp(1.2rem, 2.5vw, 1.75rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-top: .5rem;
`;

const ActionButtons = styled.div`
  justify-self: end;
  display: flex;
`;

const EditIcon = styled.button`
  border: none;
  background: none;
  color: #6a1b9a;
  font-size: 1.5rem;
  cursor: pointer;
`;

const DeleteIcon = styled(EditIcon)`
  color: #e74c3c;
`;

const Title = styled.h1`
  font-family: "Montserrat", sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: bold;
  color: #fff;
  margin: 1rem 1.5rem 1rem;
  text-align: center;
`;

const HostMessageContainer = styled.div`
  border-radius: 12px;
  padding: 0.75rem 1rem;
  max-width: 500px;
  margin: 0.75rem auto;
`;

const HostName = styled.h5`
  display: flex;
  justify-content: center;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #fff;
  margin: 0;
  margin-bottom: .5rem;
`;

const MessageLine = styled.p`
  font-family: "Montserrat", sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  font-weight: 300;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.4;
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;

  label {
    display: flex;
    align-items: center;
  }
  span {
    font-size: 1.25rem;
  }
`;

const ChatButton = styled.button`
  background: #9051e1;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem;
`;

const AttendeeContainer = styled.div`
  border-radius: 16px;
  margin: auto;
  max-width: 600px;
  padding: 1rem 1rem 0rem;
  text-align: center;
`;

const ParticipantsSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ParticipantsTitle = styled.h4`
  font-family: "Montserrat", sans-serif;
  font-size: 1.3rem;
  color: #fff;
  margin: 0;
`;

const ParticipantsRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
`;

const ParticipantsScroll = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 10px;
  margin: auto;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const ParticipantCircle = styled.div`
  flex: 0 0 50px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${({ $pending }) => ($pending ? "#aaa" : "#4a0d5c")};
  overflow: hidden;
`;

const ParticipantImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InviteCircle = styled(ParticipantCircle)`
  background: #9051e1;
  border: 2px dashed white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const LeaveButton = styled.button`
  background: #a02e2e;
  color: #fff;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
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
`;

const ParticipantPopupContent = styled.div`
  background: #201925;
  padding: 2rem;
  border-radius: 18px;
  text-align: center;
  max-width: 420px;
  color: #fff;
  max-height: 80vh;
  overflow-y: auto;
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
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }

  &.cancel {
    background: rgba(255, 255, 255, 0.3);
    color: #fff;
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
`;

const HelpPopup = styled.div`
  position: fixed;
  top: 80px;
  width: 90%;
  max-width: 400px;
  background: #2c1e33;
  padding: 1rem;
  border-radius: 8px;
  z-index: 10000;
    border-color: ${colors.accent};
    box-shadow: 0 0 10px ${colors.accent}, 0 0 50px ${colors.accent};
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #fff;
`;

const PopupTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
`;

const PopupList = styled.ol`
  margin: 0;
  padding-left: 1.2rem;
  color: #fff;
  li {
    margin-bottom: 0.5rem;
  }
  text-align: left;
`;

const AddButton = styled.button`
  background: #9051e1;
  color: #fff;
  border: none;
  padding: 0 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const EmailsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const EmailPill = styled.div`
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.1);
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
`;

const PillClose = styled.span`
  margin-left: 0.5rem;
  cursor: pointer;
  font-weight: bold;
`;