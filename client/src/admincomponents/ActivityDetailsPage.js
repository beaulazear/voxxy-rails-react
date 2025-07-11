import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import {
  PageContainer,
} from "../styles/ActivityDetailsStyles";
import { message, Modal } from "antd";
import AIRecommendations from "./AIRecommendations";
import UpdateActivityModal from './UpdateActivityModal';
import LoadingScreen from '../components/LoadingScreen.js';
import ActivityHeader from './ActivityHeader.js';
import ActivityCommentSection from './ActivityCommentSection.js';
import TimeSlots from '../letsmeet/TimeSlots.js';
import ActivityNotFoundScreen from './ActivityNotFoundScreen';

const gradientMove = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const smokeDriftA = keyframes`
  0%   { transform: translate(-20%, -20%) scale(1); opacity: 0.5; }
  50%  { transform: translate(20%, 20%) scale(1.2); opacity: 0.3; }
  100% { transform: translate(-20%, -20%) scale(1); opacity: 0.5; }
`;

const smokeDriftB = keyframes`
  0%   { transform: translate(20%, -20%) scale(1); opacity: 0.4; }
  50%  { transform: translate(-20%, 20%) scale(1.3); opacity: 0.2; }
  100% { transform: translate(20%, -20%) scale(1); opacity: 0.4; }
`;

export const AnimatedSmokeBackground = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  
  background: linear-gradient(
    135deg,
    #201925,
    #1e1824,
    #1c1422
  );
  background-size: 300% 300%;
  animation: ${gradientMove} 25s ease infinite;

  &::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.08),
      transparent 60%
    );
    filter: blur(100px);
    mix-blend-mode: overlay;
    animation: ${smokeDriftA} 40s ease-in-out infinite;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%; right: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.06),
      transparent 50%
    );
    filter: blur(120px);
    mix-blend-mode: overlay;
    animation: ${smokeDriftB} 55s ease-in-out infinite;
    pointer-events: none;
  }
`;

const BlurredOverlay = styled.div`
  position: relative;
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
`;

const InvitePromptOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const InvitePromptCard = styled.div`
  background: linear-gradient(135deg, #2C1E33, #1a1425);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(to right, rgba(207, 56, 221, 0.9), rgba(211, 148, 245, 0.9), rgba(185, 84, 236, 0.9));
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { background-position: 200% 0; }
    50% { background-position: -200% 0; }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const InviteTitle = styled.h2`
  color: #fff;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const InviteSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const InviteButton = styled.button`
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  
  background: ${({ $decline }) =>
    $decline
      ? "linear-gradient(135deg, #e74c3c, #c0392b)"
      : "linear-gradient(to right, rgba(207, 56, 221, 0.9), rgba(211, 148, 245, 0.9), rgba(185, 84, 236, 0.9))"};
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    background: ${({ $decline }) =>
    $decline
      ? "linear-gradient(135deg, #c0392b, #a93226)"
      : "linear-gradient(135deg, #7b3ea1, #5a1675)"};
  }

  &:active {
    transform: translateY(0);
  }
`;

const ActivityName = styled.span`
  color: #CC31E8;
  font-weight: 600;
`;

const HostName = styled.span`
  color: #f39c12;
  font-weight: 600;
`;

function ActivityDetailsPage() {
  const { user, setUser } = useContext(UserContext);
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [pinnedActivities, setPinnedActivities] = useState([]);
  const [pinned, setPinned] = useState([]);

  const topRef = useRef(null)

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const numericActivityId = parseInt(activityId, 10);

  useEffect(() => {
    if (!activityId || isNaN(numericActivityId)) {
      navigate('/', { replace: true });
    }
  }, [activityId, numericActivityId, navigate]);

  const pendingInvite = user?.participant_activities?.find(
    p => {
      const activityId = p.activity?.id || p.activity_id;
      return activityId === numericActivityId && !p.accepted;
    }
  );

  useEffect(() => {
    if (isNaN(numericActivityId) || !user) return;

    const timer = setTimeout(() => {
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    const latestActivity =
      user.activities?.find((act) => act.id === numericActivityId) ||
      user.participant_activities?.find((p) => p.activity?.id === numericActivityId)?.activity;

    if (latestActivity) {
      setCurrentActivity({ ...latestActivity });

      fetch(`${API_URL}/activities/${numericActivityId}/pinned_activities`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          setPinnedActivities(data)
        })
        .catch((error) => console.error("Error fetching pinned activities:", error));
    } else if (pendingInvite) {
      
      if (pendingInvite.activity && Object.keys(pendingInvite.activity).length > 0) {
        console.log('✅ Using pendingInvite.activity:', pendingInvite.activity);
        setCurrentActivity({ ...pendingInvite.activity });
      } else {
        console.log('❌ No activity data in pendingInvite, fetching from API...');

        fetch(`${API_URL}/activities/${numericActivityId}`, {
          credentials: "include"
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then((completeActivity) => {
            console.log('✅ Fetched complete activity from API:', completeActivity);
            setCurrentActivity(completeActivity);
          })
          .catch((error) => {
            console.error("❌ Error fetching activity data:", error);
          });
      }

      fetch(`${API_URL}/activities/${numericActivityId}/pinned_activities`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          setPinnedActivities(data);
          console.log(data)
        })
        .catch((error) => console.error("Error fetching pinned activities:", error));
    } else {
      console.log('❌ No activity found - neither regular nor pending invite');
    }

    if (latestActivity.activity_type === 'Meeting') {
      fetch(`${API_URL}/activities/${numericActivityId}/time_slots`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          setPinned(data) // This will populate your pinned time slots
        })
        .catch((error) => console.error("Error fetching time slots:", error));
    }

    return () => clearTimeout(timer);
  }, [user, numericActivityId, refreshTrigger, API_URL, pendingInvite]);

  const handleBack = () => {
    navigate('/');
  };

  // Show loading if invalid ID or no user
  if (isNaN(numericActivityId) || !user) {
    return <LoadingScreen />;
  }

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;

    try {
      const response = await fetch(
        `${API_URL}/activity_participants/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email, activity_id: numericActivityId }),
        }
      );

      if (!response.ok) {
        message.error("Failed to accept invite.");
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
            ? updatedActivity  // ← Just use the complete updated activity
            : activity
        ),
      }));

      message.success("Welcome to the board!");
      setRefreshTrigger(prev => !prev);
    } catch (error) {
      console.error("Error accepting invite:", error);
      message.error("Failed to accept invite.");
    }
  };

  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;

    try {
      const response = await fetch(
        `${API_URL}/activity_participants/decline`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email, activity_id: numericActivityId }),
        }
      );

      if (response.ok) {
        setUser((prevUser) => ({
          ...prevUser,
          participant_activities: prevUser.participant_activities.filter(
            (p) => p.activity.id !== numericActivityId
          ),
        }));
        message.success("Invite declined.");
        handleBack(); // Navigate back since they're no longer part of this activity
      } else {
        message.error("Failed to decline invite.");
      }
    } catch (error) {
      console.error("Error declining invite:", error);
      message.error("Failed to decline invite.");
    }
  };

  if (!currentActivity && !pendingInvite) {
    return <ActivityNotFoundScreen onReturnHome={handleBack} />;
  }

  if (pendingInvite && !currentActivity) {
    return (
      <>
        <AnimatedSmokeBackground ref={topRef} />
        <PageContainer>
          <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
            <h2>Loading invitation...</h2>
            <p>Please wait while we fetch the activity details.</p>
          </div>
        </PageContainer>
      </>
    );
  }

  const isOwner = user?.id === currentActivity?.user_id || user?.id === currentActivity?.user?.id;

  const handleInvite = async (email) => {

    if (!email) return;

    const normalizedEmail = email.trim().toLowerCase();
    const participants = currentActivity.participants || [];
    const pendingInvites = currentActivity.activity_participants || [];

    const isDuplicate =
      participants.some((p) => p?.email?.toLowerCase() === normalizedEmail) ||
      pendingInvites.some((p) => p?.email?.toLowerCase() === normalizedEmail);

    if (isDuplicate) {
      alert("This email is already invited or is a participant.");
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activity_participants/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email, activity_id: currentActivity.id }),
    });

    if (response.ok) {
      const newParticipant = {
        invited_email: normalizedEmail,
        name: 'Invite Pending',
        confirmed: false
      }

      setUser((prevUser) => {
        const updatedUser = {
          ...prevUser,
          activities: prevUser.activities.map((act) =>
            act.id === currentActivity.id
              ? {
                ...act,
                participants: newParticipant.user_id
                  ? [...(act.participants || []), { id: newParticipant.user_id, name: newParticipant.invited_email }]
                  : act.participants,
                activity_participants: [...(act.activity_participants || []), newParticipant],
              }
              : act
          ),
        };
        return updatedUser;
      });

      setRefreshTrigger((prev) => !prev);
    } else {
      const data = await response.json();
      alert(data.error || "Failed to send invitation.");
    }
  };

  async function handleUpdate(newData) {

    setUser((prevUser) => ({
      ...prevUser,
      activities: prevUser.activities.map((act) =>
        act.id === newData.id ? newData : act
      ),
    }));

    setRefreshTrigger((prev) => !prev);
  }

  function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this activity? This action is permanent and cannot be undone."
    );

    if (confirmDelete) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) {
            console.log(`Activity with ID ${id} deleted successfully`);

            setUser((prevUser) => ({
              ...prevUser,
              activities: prevUser.activities.filter(
                (activity) => activity.id !== id
              ),
            }));
            handleBack();
          } else {
            console.error("Failed to delete activity");
          }
        })
        .catch((error) => console.error("Error deleting activity:", error));
    }
  }

  function handleTimeSlotPin(newSlots) {
    setPinned(newSlots)
  }

  function handleTimeSlotDelete(oldSlotId) {
    const newPinned = pinned.filter(s => s.id !== oldSlotId)
    setPinned(newPinned)
  }

  const toggleVote = slot => {
    const endpoint = slot.votes_count && slot.user_voted ? 'unvote' : 'vote';
    const isVoting = endpoint === 'vote';

    fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${numericActivityId}/time_slots/${slot.id}/${endpoint}`,
      { method: 'POST', credentials: 'include' }
    )
      .then(res => res.json())
      .then(({ votes_count, availability_count }) => { // <- Add availability_count here
        setPinned(prev => prev
          .map(s => {
            if (s.id === slot.id) {
              let updatedVoterIds = s.voter_ids || [];

              if (isVoting) {
                if (!updatedVoterIds.includes(user.id)) {
                  updatedVoterIds = [...updatedVoterIds, user.id];
                }
              } else {
                updatedVoterIds = updatedVoterIds.filter(id => id !== user.id);
              }

              return {
                ...s, // <- This preserves existing properties
                votes_count,
                availability_count, // <- Add this line
                user_voted: isVoting,
                voter_ids: updatedVoterIds
              };
            }
            return s;
          })
          .sort((a, b) => b.votes_count - a.votes_count)
        );
      })
      .catch(error => {
        console.error('Error toggling vote:', error);
      });
  };

  const handleRemoveParticipant = async (participant) => {
    try {
      const url = new URL(`${API_URL}/activity_participants/remove`);
      url.searchParams.set("activity_id", currentActivity.id);
      url.searchParams.set("email", participant.email);

      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");
      message.success('Participant successfully removed!');

      const newComment = data.comment;

      setUser(prev => ({
        ...prev,
        activities: prev.activities.map(a => {
          if (a.id !== currentActivity.id) return a;
          return {
            ...a,
            participants: (a.participants || []).filter(p => p.email !== participant.email),
            activity_participants: (a.activity_participants || [])
              .filter(ap => ap.invited_email !== participant.email),
            comments: [...(a.comments || []), newComment],
          };
        })
      }));

      setCurrentActivity(prev => ({
        ...prev,
        participants: (prev.participants || []).filter(p => p.email !== participant.email),
        activity_participants: (prev.activity_participants || [])
          .filter(ap => ap.invited_email !== participant.email),
        comments: [...(prev.comments || []), newComment],
      }));

      setRefreshTrigger(t => !t);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLeaveActivity = async () => {
    Modal.confirm({
      title: 'Leave Activity',
      content: 'Are you sure you want to leave this activity? This action is permanent and you cannot rejoin unless invited again.',
      okText: 'Leave',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await performLeave();
      },
    });
  };

  const performLeave = async () => {
    try {
      const response = await fetch(
        `${API_URL}/activity_participants/leave`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ activity_id: numericActivityId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || "Failed to leave activity.");
        return;
      }

      setUser((prevUser) => ({
        ...prevUser,
        participant_activities: prevUser.participant_activities.filter(
          (p) => p.activity.id !== numericActivityId
        ),
      }));

      message.success("You have successfully left the activity.");
      handleBack();
    } catch (error) {
      console.error("Error leaving activity:", error);
      message.error("Failed to leave activity.");
    }
  };

  return (
    <>
      <AnimatedSmokeBackground ref={topRef} />
      <PageContainer>
        <ActivityHeader
          activity={currentActivity}
          isOwner={isOwner}
          onBack={handleBack}
          onLeave={handleLeaveActivity}
          onEdit={() => setShowModal(true)}
          onDelete={handleDelete}
          onInvite={handleInvite}
          onRemoveParticipant={handleRemoveParticipant}
          votes={currentActivity?.activity_type === 'Meeting' ? pinned : pinnedActivities}
        />

        {pendingInvite ? (
          <>
            <BlurredOverlay>
              {currentActivity?.activity_type === 'Restaurant' && (
                <AIRecommendations
                  onEdit={() => setShowModal(true)}
                  isOwner={isOwner}
                  pinnedActivities={pinnedActivities}
                  setPinnedActivities={setPinnedActivities}
                  activity={currentActivity}
                  setRefreshTrigger={setRefreshTrigger}
                />
              )}
              {currentActivity?.activity_type === 'Meeting' && (
                <TimeSlots
                  onEdit={() => setShowModal(true)}
                  isOwner={isOwner}
                  handleTimeSlotDelete={handleTimeSlotDelete}
                  toggleVote={toggleVote}
                  setPinned={handleTimeSlotPin}
                  pinned={pinned}
                  currentActivity={currentActivity}
                  setCurrentActivity={setCurrentActivity}
                />
              )}
              {currentActivity && <ActivityCommentSection activity={currentActivity} />}
            </BlurredOverlay>

            <InvitePromptOverlay>
              <InvitePromptCard onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={handleBack}>
                  ×
                </CloseButton>
                <InviteTitle>🎉 You're Invited!</InviteTitle>
                <InviteSubtitle>
                  <HostName>{currentActivity?.user?.name}</HostName> invited you to join{' '}
                  <ActivityName>{currentActivity?.activity_name}</ActivityName>:
                  <br></br>
                  <i style={{ fontFamily: 'Roboto' }}>{currentActivity?.welcome_message}</i>
                </InviteSubtitle>
                <ButtonGroup>
                  <InviteButton onClick={handleAcceptInvite}>
                    Accept Invite
                  </InviteButton>
                  <InviteButton $decline onClick={handleDeclineInvite}>
                    Decline
                  </InviteButton>
                </ButtonGroup>
              </InvitePromptCard>
            </InvitePromptOverlay>
          </>
        ) : (
          <>
            {(currentActivity?.activity_type === 'Restaurant' || currentActivity?.activity_type === 'Cocktails') && (
              <AIRecommendations
                onEdit={() => setShowModal(true)}
                isOwner={isOwner}
                pinnedActivities={pinnedActivities}
                setPinnedActivities={setPinnedActivities}
                setPinned={handleTimeSlotPin}
                activity={currentActivity}
                setRefreshTrigger={setRefreshTrigger}
              />
            )}
            {currentActivity?.activity_type === 'Meeting' && (
              <TimeSlots
                onEdit={() => setShowModal(true)}
                isOwner={isOwner}
                handleTimeSlotDelete={handleTimeSlotDelete}
                toggleVote={toggleVote}
                setPinned={handleTimeSlotPin}
                pinned={pinned}
                currentActivity={currentActivity}
                setCurrentActivity={setCurrentActivity}
              />
            )}
            {currentActivity && <ActivityCommentSection activity={currentActivity} />}
          </>
        )}

        {showModal && (
          <UpdateActivityModal
            pinned={pinned}
            pinnedActivities={pinnedActivities}
            activity={currentActivity}
            onClose={() => setShowModal(false)}
            onUpdate={handleUpdate}
          />
        )}
      </PageContainer>
    </>
  );
}

export default ActivityDetailsPage;