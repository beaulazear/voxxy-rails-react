import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/user.js";
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

// Import all styled components
import {
  HeaderContainer,
  TopActions,
  LeftActions,
  RightActions,
  ActionButton,
  HelpButton,
  HelpTooltip,
  ActivityTypeChip,
  ActivityTypeText,
  LeaveButton,
  LeaveButtonText,
  MainContent,
  TitleSection,
  ActivityTitle,
  DateTimeRow,
  DateTimeItem,
  HostSection,
  HostAvatar,
  HostImage,
  HostBadge,
  HostInfo,
  HostName,
  WelcomeMessage,
  ParticipantsSection,
  ParticipantsHeader,
  ParticipantsTitle,
  ParticipantsTitleText,
  ResponseBadge,
  ParticipantsScrollContainer,
  ParticipantsGrid,
  InviteButton,
  InviteButtonText,
  ViewAllButton,
  ViewAllButtonText,
  ParticipantAvatar,
  AvatarImage,
  HostIndicator,
  ResponseIndicator,
  PendingIndicator,
  HelpOverlay,
  HelpPopup,
  PopupHeader,
  PopupTitle,
  CloseButton,
  StepContainer,
  StepTitle,
  StepDesc,
  NavControls,
  NavButton,
  AllParticipantsOverlay,
  AllParticipantsContent,
  ProgressContainer,
  MessageLine,
  ProgressBarBackground,
  ProgressBarFill,
  AllList,
  ParticipantItem,
  Info,
  ParticipantCircle,
  ParticipantImage,
  HostIndicatorLarge,
  Details,
  ParticipantName,
  StatusRow,
  StatusText,
  RemoveButton,
  InviteOverlay,
  InviteContent,
  InputGroup,
  EmailInput,
  AddEmailButton,
  EmailsContainer,
  EmailPill,
  PillClose,
  InviteActions,
  CancelButton
} from '../styles/ActivityHeaderStyles.js';

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
    avatar: SmallTriangle,
    profile_pic_url: activity.user?.profile_pic_url,
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
        profile_pic_url: p.profile_pic_url,
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
      isGuest: true,
      invitedEmail: p.invited_email
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
                  : activity.activity_type === 'Game Night'
                    ? 'Game Night 🎮'
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
                      <ParticipantAvatar key={`pending-${i}`} $pending={!hasResponded(p)} $guestResponded={hasResponded(p)}>
                        <AvatarImage src={getDisplayImage(p)} alt={p.name} />
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