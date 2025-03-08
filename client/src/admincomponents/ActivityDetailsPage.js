import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/user';
import styled from 'styled-components';
import {
  PageContainer,
  SmallSection,
} from "../styles/ActivityDetailsStyles";
import AIRecommendations from "./AIRecommendations";
import UpdateActivityModal from './UpdateActivityModal';
import PinnedActivityCard from './PinnedActivityCard';
import LoadingScreen from '../components/LoadingScreen.js';
import ActivityHeader from '../admincomponents/ActivityHeader.js'

function ActivityDetailsPage({ activityId, onBack }) {
  const { user, setUser } = useContext(UserContext);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
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

  if (!currentActivity) return <LoadingScreen />;

  const isOwner = user?.id === currentActivity?.user_id || user?.id === currentActivity?.user?.id;

  const handleInvite = async (email) => {

    console.log('invite clicked', email)

    if (!email) return;

    const normalizedEmail = email.trim().toLowerCase();
    const participants = currentActivity.participants || [];
    const pendingInvites = currentActivity.activity_participants || [];

    console.log(normalizedEmail)

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
      const newParticipant = await response.json();
      alert("Invitation sent!");

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
      <ActivityHeader
        activity={currentActivity}
        isOwner={isOwner}
        onBack={onBack}
        onEdit={() => setShowModal(true)}
        onDelete={handleDelete}
        onInvite={handleInvite}
      />
      <SmallSection>
        <TextContainer>
          <PinnedTitle>📌 Pinned Restaurants 📌</PinnedTitle>
          <SubTitle>
            Your pinned activities are here to stay! If you have a favorite, don’t forget to vote on it and leave a comment to share your thoughts. Need to make changes? ‘Chat with Voxxy’ to explore new options!
            <br></br><br></br>
            {pinnedActivities.length === 0 && (" No pinned restaurants yet! Click on a recommendation to pin it.")}
          </SubTitle>
        </TextContainer>
        <PinnedScrollContainer>
          {pinnedActivities.length > 0 && (
            pinnedActivities.map((pinned) => (
              <PinnedActivityCard
                key={pinned.id}
                isOwner={isOwner}
                setPinnedActivities={setPinnedActivities}
                pinned={pinned}
              />
            ))
          )}
        </PinnedScrollContainer>
      </SmallSection>
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

const TextContainer = styled.div`
  background: white;
  backdrop-filter: blur(15px);
  border-radius: 8px;
  width: fit-content;
  margin: 0 auto;
  padding: 8px;
  margin-bottom: 25px;
  margin-top: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
`

const SubTitle = styled.div`
  color: black; /* Ensure text is readable on a light background */
  max-width: 600px;
  margin: auto;
  font-size: 1.2rem;
  padding: 1rem;
`

const PinnedTitle = styled.h2`
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  margin-top: 0;
`;

const PinnedScrollContainer = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
  margin-left: -2.1rem;
  margin-right: -2.1rem;
  max-height: 800px;
  justify-content: center;

  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome/Safari */
  }
`;