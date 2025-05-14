import React, { useContext, useEffect, useState, useRef } from 'react';
import { UserContext } from '../context/user';
import {
  PageContainer,
} from "../styles/ActivityDetailsStyles";
import AIRecommendations from "./AIRecommendations";
import UpdateActivityModal from './UpdateActivityModal';
import LoadingScreen from '../components/LoadingScreen.js';
import ActivityHeader from './ActivityHeader.js';
import ActivityCommentSection from './ActivityCommentSection.js';
import TimeSlots from '../letsmeet/TimeSlots.js';
import SelectedPinnedActivity from './SelectedPinnedActivity.js';

function ActivityDetailsPage({ activityId, onBack }) {
  const { user, setUser } = useContext(UserContext);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [pinnedActivities, setPinnedActivities] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [pinned, setPinned] = useState([]);

  const topRef = useRef(null)

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activityId}/time_slots`, {
      method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => setPinned(data));
  }, [activityId])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    const latestActivity =
      user.activities.find((act) => act.id === activityId) ||
      user.participant_activities.find((p) => p.activity.id === activityId)?.activity;

    if (latestActivity) {
      setCurrentActivity({ ...latestActivity });

      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

      fetch(`${API_URL}/activities/${activityId}/pinned_activities`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setPinnedActivities(data)
          const selectedPin = data.find(p => p.selected === true);
          if (selectedPin) {
            setSelectedRestaurant(selectedPin)
          }
        })
        .catch((error) => console.error("Error fetching pinned activities:", error));
    }

    return () => clearTimeout(timer);

  }, [user, activityId, refreshTrigger]);

  if (!currentActivity) return <LoadingScreen />;

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

  function handleTimeSlotPin(newSlot) {
    setPinned(prev => [newSlot, ...prev])
  }


  const toggleVote = slot => {
    const endpoint = slot.votes_count && slot.user_voted ? 'unvote' : 'vote';
    fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activityId}/time_slots/${slot.id}/${endpoint}`,
      { method: 'POST', credentials: 'include' }
    )
      .then(res => res.json())
      .then(({ votes_count }) => {
        setPinned(prev => prev
          .map(s => s.id === slot.id
            ? { ...s, votes_count, user_voted: endpoint === 'vote' }
            : s
          )
          .sort((a, b) => b.votes_count - a.votes_count)
        );
      });
  };

  return (
    <div style={{ backgroundColor: '#201925' }} ref={topRef}>
      <PageContainer>
        <ActivityHeader
          activity={currentActivity}
          isOwner={isOwner}
          onBack={onBack}
          onEdit={() => setShowModal(true)}
          onDelete={handleDelete}
          onInvite={handleInvite}
        />
        {currentActivity.activity_type === 'Restaurant' && (
          <>
            {currentActivity.finalized === false && (
              <AIRecommendations isOwner={isOwner} pinnedActivities={pinnedActivities} setPinnedActivities={setPinnedActivities} activity={currentActivity} setRefreshTrigger={setRefreshTrigger} />
            )}
            {currentActivity.finalized && selectedRestaurant && (
              <SelectedPinnedActivity pinned={selectedRestaurant} />
            )}
          </>
        )}
        {currentActivity.activity_type === 'Meeting' && (
          <TimeSlots toggleVote={toggleVote} setPinned={handleTimeSlotPin} pinned={pinned} currentActivity={currentActivity} />
        )}
        <ActivityCommentSection activity={currentActivity} />
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
    </div>
  );
}

export default ActivityDetailsPage;