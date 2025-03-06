import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/user';
import {
  PageContainer,
  Header,
  FlexContainer,
  SmallSection,
  InviteButton,
  ParticipantsSection,
} from "../styles/ActivityDetailsStyles";
import AIRecommendations from "./AIRecommendations";
import UpdateActivityModal from './UpdateActivityModal';
import PinnedActivityCard from './PinnedActivityCard';

function ActivityDetailsPage({ activityId, onBack }) {
  const { user, setUser } = useContext(UserContext);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [pinnedActivities, setPinnedActivities] = useState([]);

  useEffect(() => {
    const latestActivity =
      user.activities.find((act) => act.id === activityId) ||
      user.participant_activities.find((p) => p.activity.id === activityId)?.activity;

    if (latestActivity) {
      setCurrentActivity({ ...latestActivity });

      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

      fetch(`${API_URL}/activities/${activityId}/pinned_activities`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setPinnedActivities(data))
        .catch((error) => console.error("Error fetching pinned activities:", error));
    }

  }, [user, activityId, refreshTrigger]);

  if (!currentActivity) return <p>Loading...</p>;

  const isOwner = user?.id === currentActivity?.user_id || user?.id === currentActivity?.user?.id;

  const participantsArray = Array.isArray(currentActivity.participants) ? currentActivity.participants : [];
  const pendingInvitesArray = Array.isArray(currentActivity.activity_participants)
    ? currentActivity.activity_participants.filter(p => !p.accepted)
    : [];

  const hostParticipant = {
    name: `${currentActivity.user?.name || "Unknown"} (Host)`,
    email: currentActivity.user?.email || "N/A",
    confirmed: true
  };

  const allParticipants = [
    hostParticipant,
    ...participantsArray.filter(p => p.email)
      .map(p => ({
        name: p.name || p.email,
        email: p.email,
        confirmed: true
      })),
    ...pendingInvitesArray.map(p => ({
      name: p.invited_email,
      email: p.invited_email,
      confirmed: false
    }))
  ];

  const handleInvite = async () => {
    if (!inviteEmail) return;

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    const participants = currentActivity.participants || [];
    const pendingInvites = currentActivity.activity_participants || [];

    const isDuplicate =
      participants.some((p) => p?.email?.toLowerCase() === normalizedEmail) ||
      pendingInvites.some((p) => p?.invited_email?.toLowerCase() === normalizedEmail);

    if (isDuplicate) {
      alert("This email is already invited or is a participant.");
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activity_participants/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: inviteEmail, activity_id: currentActivity.id }),
    });

    if (response.ok) {
      const newParticipant = await response.json();
      alert("Invitation sent!");
      setInviteEmail("");

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
        console.log("🔄 Updated User Context:", updatedUser);
        return updatedUser;
      });

      setRefreshTrigger((prev) => !prev);
    } else {
      const data = await response.json();
      alert(data.error || "Failed to send invitation.");
    }
  };

  function handleUpdate(newData) {
    setCurrentActivity((prevActivity) => ({
      ...newData,
      user: prevActivity.user,
    }));

    setUser((prevUser) => ({
      ...prevUser,
      activities: prevUser.activities.map((act) =>
        act.id === newData.id ? { ...newData, user: act.user } : act
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
            onBack();
          } else {
            console.error("Failed to delete activity");
          }
        })
        .catch((error) => console.error("Error deleting activity:", error));
    }
  }

  return (
    <PageContainer>
      <Header>
        <h1>{currentActivity.activity_name || 'Activity Details'}</h1>
        <button className="back-button" onClick={onBack}>Back</button>
      </Header>

      <FlexContainer>
        <SmallSection>
          <h2>Trip Details</h2>
          <div className="content-wrapper">
            <div className="detail-item">
              🚀 <strong>Name:</strong> {currentActivity.activity_name || 'Not specified'}
            </div>
            <div className="detail-item">
              📍 <strong>Location:</strong> {currentActivity.activity_location || 'Not specified'}
            </div>
            <div className="detail-item">
              ⏰ <strong>Time:</strong> {currentActivity.date_notes || 'Not specified'}
            </div>
            <div className="detail-item">
              👤 <strong>Host:</strong> {isOwner ? "You" : currentActivity?.user?.name || "Unknown"}
            </div>
          </div>
          {isOwner && (
            <div className="update-section">
              <span className="update-icon" onClick={() => setShowModal(true)}>🔄</span>
              <span className="trash-icon" onClick={() => handleDelete(currentActivity.id)}>🗑️</span>
            </div>
          )}
        </SmallSection>

        <SmallSection>
          <h2>Participants - {currentActivity.group_size}</h2>
          <ParticipantsSection>
            <div className="participants-list">
              {allParticipants.length > 0 ? (
                allParticipants.map((participant, index) => (
                  <div key={index} className={`participant ${participant.confirmed ? 'confirmed' : 'pending'}`}>
                    {participant.name || participant.email}
                  </div>
                ))
              ) : (
                <p>No participants yet.</p>
              )}
            </div>
          </ParticipantsSection>

          {isOwner && (
            <div className="invite-section">
              <input
                type="email"
                placeholder="Invite by email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <InviteButton onClick={handleInvite}>Invite</InviteButton>
            </div>
          )}
        </SmallSection>
        <SmallSection>
          <h2>Pinned Restaurants</h2>
          <div style={{ overflowY: 'auto' }}>
            {pinnedActivities.length > 0 ? (
              pinnedActivities.map((pinned) => (
                <PinnedActivityCard key={pinned.id} isOwner={isOwner} setPinnedActivities={setPinnedActivities} pinned={pinned} />
              ))
            ) : (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                No pinned restaurants yet! Click on a recommendation to pin it.
              </p>
            )}
          </div>
        </SmallSection>
      </FlexContainer>
      <AIRecommendations setPinnedActivities={setPinnedActivities} activity={currentActivity} setRefreshTrigger={setRefreshTrigger} />

      {showModal && (
        <UpdateActivityModal
          activity={currentActivity}
          onClose={() => setShowModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </PageContainer>
  );
}

export default ActivityDetailsPage;