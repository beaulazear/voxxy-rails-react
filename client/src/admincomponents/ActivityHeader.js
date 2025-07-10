import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/user.js";
import styled, { keyframes, css } from "styled-components";
import {
  LeftOutlined,
  EditOutlined,
  DeleteOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Users, Plus, CalendarDays, Clock, HelpCircle, X, Eye, CheckCircle, XCircle, Crown } from "lucide-react";
import { message, Popconfirm } from "antd";
import Woman from "../assets/Woman.jpg";
import MultiSelectCommunity from "./MultiSelectCommunity.js";
import mixpanel from "mixpanel-browser";
import UpdateDetailsModal from "./UpdateDetailsModal.js";
import FinalPlansModal from './FinalPlansModal.js';
import SmallTriangle from "../assets/SmallTriangle.png";

const ActivityHeader = ({ activity, votes = [], isOwner, onLeave, onBack, onDelete, onInvite, onCreateBoard, onRemoveParticipant }) => {
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [helpStep, setHelpStep] = useState(0);
  const [manualInput, setManualInput] = useState("");
  const [manualEmails, setManualEmails] = useState([]);
  const [communitySelected, setCommunitySelected] = useState([]);
  const [isBouncing, setIsBouncing] = useState(true);
  const [showFinalPlansModal, setShowFinalPlansModal] = useState(false);

  const { user, setUser } = useContext(UserContext);
  const { responses = [] } = activity;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const isCurrentUserOrganizer = user?.id === activity.user?.id;

  const getDisplayImage = (userObj) => {
    if (userObj?.profile_pic_url) {
      const profilePicUrl = userObj.profile_pic_url.startsWith('http')
        ? userObj.profile_pic_url
        : `${API_URL}${userObj.profile_pic_url}`;
      return profilePicUrl;
    }

    return userObj?.avatar || Woman;
  };

  useEffect(() => {
    if (activity.finalized && isOwner) {
      setShowFinalPlansModal(true);
    }
  }, [activity.finalized, isOwner]);

  const participantsArray = Array.isArray(activity.participants) ? activity.participants : [];
  const pendingInvitesArray = Array.isArray(activity.activity_participants)
    ? activity.activity_participants.filter(p => !p.accepted)
    : [];

  useEffect(() => {
    if (!isOwner) return;
    const hasParticipants = participantsArray.length > 0 || pendingInvitesArray.length > 0;
    if (!hasParticipants) {
      const timer = setTimeout(() => {
        setShowInvitePopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOwner, participantsArray.length, pendingInvitesArray.length]);

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

    startBounce();
    resetInactivity();

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

  const handleViewAllClick = () => setShowAllParticipants(true);
  const handleCloseAll = () => setShowAllParticipants(false);
  const handleRemove = (participant, comment) => {
    onRemoveParticipant(participant, comment);
  };

  const handleCloseModal = () => {
    setShowFinalPlansModal(false);
  };

  const handleShare = () => {
    console.log('Share button clicked from modal');
  };

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
    setShowInvitePopup(true);
  };
  const handleClosePopup = () => {
    setShowInvitePopup(false);
  };

  const handleAddEmail = () => {
    const email = manualInput.trim().toLowerCase();
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

  const hostParticipant = {
    name: isCurrentUserOrganizer ? "You" : `${activity.user?.name || "Unknown"}`,
    email: activity.user?.email || "N/A",
    confirmed: true,
    avatar: SmallTriangle, // Using your SmallTriangle icon for host
    profile_pic_url: activity.user?.profile_pic_url, // Add this for host
    created_at: activity.user?.created_at,
    apId: activity.user?.id,
    isHost: true
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
        profile_pic_url: p.profile_pic_url, // Add this for participants
        created_at: p.created_at,
        apId: p.id,
        isHost: false
      })),
    ...pendingInvitesArray.map(p => ({
      name: p.invited_email,
      email: p.invited_email,
      confirmed: false,
      avatar: Woman,
      profile_pic_url: null,
      created_at: null,
      apId: p.id,
      isHost: false,
      isGuest: true, // NEW: Mark as guest participant
      invitedEmail: p.invited_email // NEW: Keep track of invited email for guest responses
    })),

  ];

  const hasVoted = p => {
    if (!p.confirmed || !p.apId) return false;

    if (activity.activity_type === 'Meeting') {
      return votes.some(slot => slot.voter_ids && slot.voter_ids.includes(p.apId));
    }

    if (activity.activity_type === 'Restaurant') {
      return votes.some(restaurant =>
        restaurant.voters && restaurant.voters.some(voter => voter.id === p.apId)
      );
    }

    return false;
  };
  const hasResponded = p => {
    // For confirmed users (registered accounts)
    if (p.confirmed && p.apId) {
      const userResponse = responses.some(r => r.user_id === p.apId);
      if (userResponse) return true;
    }

    // For guest participants (pending invites) - check by email
    if (p.isGuest && p.invitedEmail) {
      return responses.some(r => r.email === p.invitedEmail);
    }

    // For confirmed users who might have submitted as guests before registering
    if (p.confirmed && p.email) {
      return responses.some(r => r.email === p.email);
    }

    return false;
  };
  const totalToRespond = allParticipants.length;
  const responsesCount = allParticipants.filter(p => hasResponded(p)).length;
  const votesCount = allParticipants.filter(p => hasVoted(p)).length;

  const shareUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${activity.id}/share`;

  const meetingSteps = [
    {
      title: "1️⃣ Everyone Submits Availability",
      desc: "Both host and participants fill out when they're free so you can compare slots."
    },
    {
      title: "2️⃣ Participants Vote",
      desc: "All participants review overlapping slots and vote on their favorites."
    },
    {
      title: "3️⃣ Host Finalizes",
      desc: "Only the host can pick the winning time, share the final board, and send a calendar invite."
    }
  ];

  const restaurantSteps = [
    {
      title: "1️⃣ Invite & Submit Your Preferences",
      desc: "Participants & organizer take the quiz and share their feedback to help tailor the group's recommendations. Organizer moves activity to voting phase.."
    },
    {
      title: "2️⃣ Vote on your favorites!",
      desc: "Everyone (host + participants) casts their vote on their favorite restaurant recommendations."
    },
    {
      title: "3️⃣ Organizer Confirms & Reserves",
      desc: "Organizer locks in the winning restaurant and books the reservation."
    },
    {
      title: "4️⃣ Add to Calendar",
      desc: "Host shares a share page with a one-click calendar link so no one misses dinner."
    }
  ];

  const steps = activity.activity_type === "Restaurant" ? restaurantSteps : meetingSteps;

  function handleHelpClose() {
    setHelpStep(0);
    toggleHelp();
  }

  return (
    <>
      <HeaderContainer>
        <TopActions>
          <LeftActions>
            <ActionButton onClick={onBack} $primary>
              <LeftOutlined />
            </ActionButton>
            <HelpButton onClick={toggleHelp} $bounce={isBouncing}>
              <HelpCircle size={20} />
              <HelpTooltip className="help-tooltip">Need help?</HelpTooltip>
            </HelpButton>
          </LeftActions>

          <ActivityTypeChip>
            <ActivityTypeText>
              {activity.activity_type === 'Restaurant'
                ? 'Lets Eat! 🍜'
                : activity.activity_type === 'Cocktails'
                  ? 'Night Out 🍸'
                  : '👥 Lets Meet!'}
            </ActivityTypeText>
          </ActivityTypeChip>

          <RightActions>
            {isOwner ? (
              <>
                <ActionButton onClick={handleOpenUpdate} $edit>
                  <EditOutlined />
                </ActionButton>
                <ActionButton onClick={() => onDelete(activity.id)} $delete>
                  <DeleteOutlined />
                </ActionButton>
              </>
            ) : (
              <LeaveButton onClick={async () => {
                onLeave()
              }}>
                <LogoutOutlined />
                <LeaveButtonText>Leave</LeaveButtonText>
              </LeaveButton>
            )}
          </RightActions>
        </TopActions>

        <MainContent>
          <TitleSection>
            <ActivityTitle>{activity.activity_name}</ActivityTitle>
            <DateTimeRow>
              <DateTimeItem>
                <CalendarDays size={20} />
                <span>{formatDate(activity.date_day)}</span>
              </DateTimeItem>
              <DateTimeItem>
                <Clock size={20} />
                <span>{activity.date_time ? formatTime(activity.date_time) : "TBD"}</span>
              </DateTimeItem>
            </DateTimeRow>
          </TitleSection>

          <HostSection>
            <HostAvatar style={{ backgroundColor: '#fff' }}>
              <HostImage src={getDisplayImage(activity.user)} alt={activity.user?.name} />
              <HostBadge>
                <Crown size={14} />
              </HostBadge>
            </HostAvatar>
            <HostInfo style={{ textAlign: 'left' }}>
              <HostName>
                <span>
                  Organized by {isCurrentUserOrganizer ? "You" : (activity.user?.name || "Unknown")}
                </span>
              </HostName>
              <WelcomeMessage>
                {activity.welcome_message || "Welcome to this activity! Let's make it amazing together 🎉"}
              </WelcomeMessage>
            </HostInfo>
          </HostSection>

          <ParticipantsSection>
            <ParticipantsHeader>
              <ParticipantsTitle>
                <Users size={22} />
                <ParticipantsTitleText>{allParticipants.length} {allParticipants.length === 1 ? 'Attendee' : 'Attendees'}</ParticipantsTitleText>
              </ParticipantsTitle>
              {(responsesCount > 0 || votesCount > 0) && (
                <ResponseBadge>
                  <CheckCircle size={14} />
                  {responsesCount}/{totalToRespond} responses
                  {votesCount > 0 && ` ${votesCount}/${totalToRespond} votes`}
                </ResponseBadge>
              )}
            </ParticipantsHeader>

            <ParticipantsScrollContainer>
              <ParticipantsGrid>
                {isOwner && (
                  <InviteButton onClick={handleInviteClick}>
                    <Plus size={28} />
                    <InviteButtonText>Invite</InviteButtonText>
                  </InviteButton>
                )}

                <ViewAllButton onClick={handleViewAllClick}>
                  <Eye size={28} />
                  <ViewAllButtonText>View</ViewAllButtonText>
                </ViewAllButton>

                {allParticipants
                  .filter(p => p.confirmed)
                  .slice(0, 8)
                  .map((p, i) => (
                    <ParticipantAvatar key={`confirmed-${i}`} $isHost={p.isHost}>
                      <AvatarImage src={p.isHost ? SmallTriangle : getDisplayImage(p)} alt={p.name} />
                      {p.isHost && (
                        <HostIndicator>
                          <Crown size={12} />
                        </HostIndicator>
                      )}
                      {hasResponded(p) && (
                        <ResponseIndicator>
                          <CheckCircle size={14} />
                        </ResponseIndicator>
                      )}
                    </ParticipantAvatar>
                  ))}

                {isOwner &&
                  allParticipants
                    .filter(p => !p.confirmed)
                    .slice(0, 3)
                    .map((p, i) => (
                      <ParticipantAvatar key={`pending-${i}`} $pending={!hasResponded(p)} $guestResponded={hasResponded(p)}>                        <AvatarImage src={getDisplayImage(p)} alt={p.name} />
                        <PendingIndicator>
                          <Clock size={12} />
                        </PendingIndicator>
                      </ParticipantAvatar>
                    ))}
              </ParticipantsGrid>
            </ParticipantsScrollContainer>
          </ParticipantsSection>
        </MainContent>
      </HeaderContainer>

      {showUpdate && (
        <UpdateDetailsModal
          activity={activity}
          onClose={handleCloseUpdate}
          onUpdate={handleUpdate}
        />
      )}

      {helpVisible && (
        <HelpOverlay onClick={handleHelpClose}>
          <HelpPopup onClick={e => e.stopPropagation()}>
            <PopupHeader>
              <PopupTitle>How it works ✨</PopupTitle>
              <CloseButton onClick={handleHelpClose}>
                <X size={20} />
              </CloseButton>
            </PopupHeader>
            <StepContainer>
              <StepTitle>{steps[helpStep].title}</StepTitle>
              <StepDesc>{steps[helpStep].desc}</StepDesc>
              <NavControls>
                <NavButton
                  onClick={() => setHelpStep(s => s - 1)}
                  disabled={helpStep === 0}
                >
                  ← Previous
                </NavButton>
                {helpStep < steps.length - 1 ? (
                  <NavButton onClick={() => setHelpStep(s => s + 1)}>
                    Next →
                  </NavButton>
                ) : (
                  <NavButton onClick={handleHelpClose}>
                    Got it!
                  </NavButton>
                )}
              </NavControls>
            </StepContainer>
          </HelpPopup>
        </HelpOverlay>
      )}

      {showAllParticipants && (
        <AllParticipantsOverlay onClick={handleCloseAll}>
          <AllParticipantsContent onClick={e => e.stopPropagation()}>
            <PopupHeader>
              <PopupTitle>All Participants</PopupTitle>
              <CloseButton onClick={handleCloseAll}>
                <X size={20} />
              </CloseButton>
            </PopupHeader>
            {allParticipants.length > 0 && (
              <ProgressContainer>
                <MessageLine>
                  {`${responsesCount}/${totalToRespond} preferences collected`}
                </MessageLine>
                <ProgressBarBackground>
                  <ProgressBarFill width={(responsesCount / totalToRespond) * 100} />
                </ProgressBarBackground>
              </ProgressContainer>
            )}
            <AllList>
              {allParticipants.map((p, i) => (
                <ParticipantItem key={i}>
                  <Info>
                    <ParticipantCircle>
                      <ParticipantImage src={p.isHost ? SmallTriangle : getDisplayImage(p)} alt={p.name} />
                      {p.isHost && (
                        <HostIndicatorLarge>
                          <Crown size={16} />
                        </HostIndicatorLarge>
                      )}
                    </ParticipantCircle>

                    <Details>
                      <ParticipantName>
                        {p.isHost && isCurrentUserOrganizer ? "You" : p.name}
                        {p.isHost && ' (Organizer)'}
                        {p.isGuest && ' (guest)'}
                      </ParticipantName>

                      <StatusRow>
                        {hasResponded(p) ? (
                          <CheckCircle size={16} style={{ color: '#10b981' }} />
                        ) : (
                          <XCircle size={16} style={{ color: '#6b7280' }} />
                        )}
                        <StatusText>
                          {hasResponded(p) ? 'Response submitted' : 'Waiting for response'}
                        </StatusText>

                        {hasVoted(p) ? (
                          <CheckCircle size={16} style={{ color: '#8b5cf6', marginLeft: '0.5rem' }} />
                        ) : (
                          <XCircle size={16} style={{ color: '#6b7280', marginLeft: '0.5rem' }} />
                        )}
                        <StatusText style={{ marginLeft: '0.25rem' }}>
                          {hasVoted(p) ? 'Vote cast' : 'No vote yet'}
                        </StatusText>
                      </StatusRow>
                    </Details>
                  </Info>
                  {isOwner && !p.isHost && (
                    <Popconfirm
                      title="Remove this participant?"
                      description="This action cannot be undone."
                      icon={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                      onConfirm={() => handleRemove(p)}
                      okText="Remove"
                      cancelText="Cancel"
                      placement="top"
                      getPopupContainer={(triggerNode) => triggerNode.parentNode || document.body}
                      overlayStyle={{ zIndex: 99999 }}
                    >
                      <RemoveButton>
                        <X size={18} />
                      </RemoveButton>
                    </Popconfirm>
                  )}
                </ParticipantItem>
              ))}
            </AllList>
          </AllParticipantsContent>
        </AllParticipantsOverlay>
      )}

      {showInvitePopup && (
        <InviteOverlay onClick={handleClosePopup}>
          <InviteContent onClick={(e) => e.stopPropagation()}>
            <PopupHeader>
              <PopupTitle>Invite Participants</PopupTitle>
              <CloseButton onClick={handleClosePopup}>
                <X size={20} />
              </CloseButton>
            </PopupHeader>

            <InputGroup>
              <EmailInput
                type="email"
                placeholder="Enter email address..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
              />
              <AddEmailButton onClick={handleAddEmail}>
                <Plus size={20} />
              </AddEmailButton>
            </InputGroup>

            {manualEmails.length > 0 && (
              <EmailsContainer>
                {manualEmails.map((email, i) => (
                  <EmailPill key={i}>
                    <span>{email}</span>
                    <PillClose onClick={() =>
                      setManualEmails((prev) => prev.filter((_, idx) => idx !== i))
                    }>
                      <X size={14} />
                    </PillClose>
                  </EmailPill>
                ))}
              </EmailsContainer>
            )}

            <MultiSelectCommunity
              onSelectionChange={setCommunitySelected}
              onCreateBoard={onCreateBoard}
            />

            <InviteActions>
              <InviteButton onClick={handleInviteSubmit} disabled={manualEmails.length === 0 && communitySelected.length === 0}>
                Invite
              </InviteButton>
              <CancelButton onClick={handleClosePopup}>
                Cancel
              </CancelButton>
            </InviteActions>
          </InviteContent>
        </InviteOverlay>
      )}

      {showFinalPlansModal && (
        <FinalPlansModal
          isVisible={showFinalPlansModal}
          onClose={handleCloseModal}
          onShare={handleShare}
          shareUrl={shareUrl}
        />
      )}
    </>
  );
};

export default ActivityHeader;

const colors = {
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  secondary: '#06b6d4',
  accent: '#f59e0b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  borderLight: '#475569',
};


const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
`;

const HeaderContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0.5rem;
  
  @media (min-width: 768px) {
    padding: 1rem;
  }
`;

const TopActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 0.5rem;
  
  @media (min-width: 768px) {
    margin-bottom: 2rem;
    gap: 1rem;
  }

  > * {
    flex: 1;
  }

  > *:nth-child(2) {
    display: flex;
    justify-content: center;
  }

  > *:last-child {
    display: flex;
    justify-content: flex-end;
  }
`;

const TitleSection = styled.div`
  text-align: center;
  position: relative;
`;

const LeftActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
  }
`;

const RightActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
  }
`;

const ActionButton = styled.button`
  background: ${props =>
    props.$primary ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})` :
      props.$edit ? `rgba(139, 92, 246, 0.1)` :
        props.$delete ? `rgba(239, 68, 68, 0.1)` :
          `rgba(255, 255, 255, 0.05)`
  };
  border: 1px solid ${props =>
    props.$primary ? colors.primary :
      props.$edit ? colors.primary :
        props.$delete ? colors.error :
          colors.border
  };
  color: ${props =>
    props.$edit ? colors.primary :
      props.$delete ? colors.error :
        colors.text
  };
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;

  @media (min-width: 768px) {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    font-size: 1.25rem;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.25);
    background: ${props =>
    props.$primary ? `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})` :
      props.$edit ? `rgba(139, 92, 246, 0.2)` :
        props.$delete ? `rgba(239, 68, 68, 0.2)` :
          `rgba(255, 255, 255, 0.1)`
  };
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const HelpButton = styled(ActionButton)`
  position: relative;
  
  ${props => props.$bounce && css`
    animation: ${bounceAnimation} 2s ease-in-out infinite;
  `}

  &:hover .help-tooltip {
    opacity: 1;
    transform: translateY(-10px);
  }
`;

const HelpTooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-5px);
  background: ${colors.surface};
  color: ${colors.text};
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  border: 1px solid ${colors.border};
  z-index: 100;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: ${colors.surface};
  }
`;

const ActivityTypeChip = styled.div`
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  backdrop-filter: blur(8px);
  padding: 0.5rem 1rem;
  flex-shrink: 0; // Prevent it from shrinking on mobile
  
  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
  }
`;

const ActivityTypeText = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: ${colors.text};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  
  @media (min-width: 768px) {
    font-size: 0.9rem;
  }
`;
const LeaveButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${colors.error};
  color: ${colors.error};
  padding: 0.4rem 0.75rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 88px; // Add minimum width to match two buttons
  height: 40px; // Match the ActionButton height

  @media (min-width: 768px) {
    padding: 0.5rem 1rem;
    border-radius: 12px;
    gap: 0.5rem;
    font-size: 0.9rem;
    min-width: 120px; // Larger min-width for desktop
    height: 48px; // Match desktop ActionButton height
  }

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: translateY(-2px);
  }
`;

const LeaveButtonText = styled.span`
  display: none;
  
  @media (min-width: 375px) {
    display: inline;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    gap: 2rem;
  }
`;

const ActivityTitle = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 700;
  color: ${colors.text};
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, ${colors.text}, ${colors.primaryLight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (min-width: 768px) {
    margin: 0 0 1.5rem 0;
  }
`;

const DateTimeRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (min-width: 768px) {
    gap: 2rem;
  }
`;

const DateTimeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${colors.textSecondary};
  font-size: 0.9rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid ${colors.border};

  @media (min-width: 768px) {
    gap: 0.75rem;
    font-size: 1.1rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
  }

  svg {
    color: ${colors.primary};
    flex-shrink: 0;
  }
`;

const HostSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  backdrop-filter: blur(8px);
  
  @media (min-width: 768px) {
    gap: 1.25rem;
    border-radius: 20px;
  }
`;

const HostAvatar = styled.div`
  position: relative;
  flex-shrink: 0;
    border-radius: 50%; /* Make it a circle */
`;

const HostImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${colors.primary};
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.4);
  
  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
  }
`;

const HostBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};
  animation: ${glow} 2s ease-in-out infinite;

  @media (min-width: 768px) {
    width: 28px;
    height: 28px;
  }

  svg {
    color: white;
  }
`;

const HostInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const HostName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  span {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    color: ${colors.text};
    font-size: 1rem;
    
    @media (min-width: 768px) {
      font-size: 1.2rem;
    }
  }

  svg {
    color: #e91e63;
    animation: ${glow} 3s ease-in-out infinite;
    flex-shrink: 0;
  }
`;

const WelcomeMessage = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${colors.textSecondary};
  margin: 0;
  line-height: 1.6;
  font-style: italic;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const ParticipantsSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1.5rem;
    border-radius: 20px;
  }
`;

const ParticipantsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.75rem;
  flex-wrap: wrap; // Allow wrapping on very small screens
  
  @media (min-width: 768px) {
    align-items: center;
    margin-bottom: 1.25rem;
    gap: 1rem;
  }
`;

const ParticipantsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: ${colors.text};
  font-size: 1rem;
  
  @media (min-width: 768px) {
    gap: 0.75rem;
    font-size: 1.2rem;
  }

  svg {
    color: ${colors.primary};
    flex-shrink: 0;
  }
`;

const ParticipantsTitleText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResponseBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: ${colors.success};
  padding: 0.375rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (min-width: 768px) {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
`;


const ParticipantsGrid = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow: visible;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;

  @media (min-width: 768px) {
    gap: 0.75rem;
  }

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }
`;

const InviteButton = styled.button`
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border: 2px dashed rgba(255, 255, 255, 0.5);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 0.125rem;

  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
    gap: 0.25rem;
  }

  svg {
    width: 24px;
    height: 24px;
    
    @media (min-width: 768px) {
      width: 28px;
      height: 28px;
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
    border-style: solid;
  }
`;

const InviteButtonText = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  
  @media (min-width: 768px) {
    font-size: 0.7rem;
  }
`;

const ViewAllButton = styled(InviteButton)`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
  }
`;

const ViewAllButtonText = styled(InviteButtonText)``;

const ParticipantAvatar = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: ${props =>
    props.$isHost ? `3px solid ${colors.primary}` :
      props.$guestResponded ? `2px solid ${colors.success}` : // NEW: Green border for guest responses
        props.$pending ? `2px dashed ${colors.textMuted}` :
          `2px solid ${colors.border}`
  };
  opacity: ${props => props.$pending && !props.$guestResponded ? 0.6 : 1}; // NEW: Full opacity if guest responded
  transition: all 0.3s ease;

  @media (min-width: 768px) {
    width: 70px;
    height: 70px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #fff;
  border-radius: 50%;
`;

const HostIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};
  animation: ${glow} 2s ease-in-out infinite;

  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
  }

  svg {
    color: white;
  }
`;

const ResponseIndicator = styled.div`
  position: absolute;
  top: 2px; // Move further inside
  right: 2px; // Move further inside
  background: ${colors.success};
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};

  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
    top: 3px;
    right: 3px;
  }

  svg {
    color: white;
  }
`;

const ParticipantsScrollContainer = styled.div`
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }
`;

const PendingIndicator = styled.div`
  position: absolute;
  top: 2px; // Change from -2px to 2px
  right: 2px; // Change from -2px to 2px
  background: ${colors.warning};
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};

  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
    top: 3px; // Add this
    right: 3px; // Add this
  }

  svg {
    color: white;
  }
`;

const HelpOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
`;

const HelpPopup = styled.div`
  background: ${colors.surface};
  border-radius: 16px;
  border: 1px solid ${colors.border};
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  text-align: left;
  
  @media (min-width: 768px) {
    border-radius: 20px;
  }
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const PopupTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${colors.text};
  font-family: 'Montserrat', sans-serif;
  
  @media (min-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.textMuted};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: ${colors.text};
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StepContainer = styled.div`
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const StepTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 0.75rem;
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

const StepDesc = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${colors.textSecondary};
  margin-bottom: 1.5rem;
  
  @media (min-width: 768px) {
    font-size: 0.95rem;
  }
`;

const NavControls = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const NavButton = styled.button`
  background: ${colors.primary};
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
  }

  &:disabled {
    background: ${colors.textMuted};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${colors.primaryDark};
    transform: translateY(-1px);
  }
`;

const AllParticipantsOverlay = styled(HelpOverlay)``;

const AllParticipantsContent = styled(HelpPopup)`
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
`;

const ProgressContainer = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

const MessageLine = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${colors.textSecondary};
  margin: 0 0 0.75rem 0;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const ProgressBarBackground = styled.div`
  width: 100%;
  background: ${colors.border};
  border-radius: 8px;
  height: 8px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 8px;
  transition: width 0.3s ease;
  background-size: 200% 100%;
  animation: ${shimmer} 2s linear infinite;
`;

const AllList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  text-align: left;
  
  @media (min-width: 768px) {
    padding: 1rem;
  }
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
  border-radius: 10px;
  margin-bottom: 0.75rem;
  border: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    padding: 1rem;
    border-radius: 12px;
  }
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  
  @media (min-width: 768px) {
    gap: 1rem;
  }
`;

const ParticipantCircle = styled.div`
  position: relative;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  flex-shrink: 0;
  
  @media (min-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

const ParticipantImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const HostIndicatorLarge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colors.background};

  @media (min-width: 768px) {
    width: 18px;
    height: 18px;
  }

  svg {
    color: white;
  }
`;

const Details = styled.div`
  flex: 1;
  min-width: 0;
`;

const ParticipantName = styled.div`
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  
  @media (min-width: 768px) {
    gap: 0.5rem;
  }
`;

const StatusText = styled.span`
  font-size: 0.75rem;
  color: ${colors.textMuted};
  
  @media (min-width: 768px) {
    font-size: 0.8rem;
  }
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.error};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
`;

const InviteOverlay = styled(HelpOverlay)``;

const InviteContent = styled(HelpPopup)`
  max-width: 500px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem;
  margin-bottom: 1rem;
  margin-top: 1rem;
  
  @media (min-width: 768px) {
    padding: 0 1.5rem;
  }
`;

const EmailInput = styled.input`
  flex: 1;
  padding: 0.625rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: ${colors.text};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
  }

  &::placeholder {
    color: ${colors.textMuted};
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.1);
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const AddEmailButton = styled.button`
  background: ${colors.primary};
  border: none;
  color: white;
  padding: 0.625rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (min-width: 768px) {
    padding: 0.75rem;
    border-radius: 12px;
  }

  &:hover {
    background: ${colors.primaryDark};
  }
`;

const EmailsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 1.5rem 1rem;
  }
`;

const EmailPill = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(139, 92, 246, 0.1);
  color: ${colors.primary};
  padding: 0.375rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  
  @media (min-width: 768px) {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
`;

const PillClose = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${colors.error};
  }
`;

const InviteActions = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid ${colors.border};
  
  @media (min-width: 768px) {
    gap: 1rem;
    padding: 1.5rem;
  }
`;

const CancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  background: transparent;
  color: ${colors.textMuted};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${colors.text};
  }
`;