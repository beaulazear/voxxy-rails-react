import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';
import { message, Modal } from "antd";
import AIRecommendations from "./AIRecommendations";
import UpdateActivityModal from './UpdateActivityModal';
import LoadingScreen from '../components/LoadingScreen.js';
import ActivityHeader from './ActivityHeader.js';
import ActivityCommentSection from './ActivityCommentSection.js';
import TimeSlots from '../letsmeet/TimeSlots.js';
import ActivityNotFoundScreen from './ActivityNotFoundScreen';
import { ExternalLink, CheckCircle, Clock, MapPin, DollarSign, Globe, Users, Gamepad2 } from 'lucide-react';

import {
  PageContainer,
  AnimatedSmokeBackground,
  BlurredOverlay,
  InvitePromptOverlay,
  InvitePromptCard,
  CloseButton,
  InviteTitle,
  InviteSubtitle,
  ButtonGroup,
  InviteButton,
  ActivityName,
  HostName,
  FinalizedMessage,
  FinalizedContent,
  CountdownContainer,
  CountdownGrid,
  CountdownCard,
  SelectedRestaurant,
  RestaurantActions,
  RestaurantButton,
  FinalizedButtonContainer,
  FinalizedButton
} from '../styles/ActivityDetailsStyles';

function ActivityDetailsPage() {
  const { user, setUser } = useContext(UserContext);
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [pinnedActivities, setPinnedActivities] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  // Helper function to check if activity is finalized
  const isActivityFinalized = (activity) => {
    if (!activity) return false;
    // Check for various finalized states - adjust these based on your data structure
    return activity.finalized === true ||
      activity.completed === true ||
      activity.status === 'finalized' ||
      activity.status === 'completed' ||
      (activity.collecting === false && activity.voting === false);
  };

  // Calculate if activity is finalized
  const activityFinalized = isActivityFinalized(currentActivity);

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

      // Fetch voting data with error handling for old activities
      fetch(`${API_URL}/activities/${numericActivityId}/pinned_activities`, {
        credentials: "include"
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          // Add safety check for array
          setPinnedActivities(Array.isArray(data) ? data : []);
        })
        .catch((error) => {
          console.error("Error fetching pinned activities:", error);
          setPinnedActivities([]); // Set empty array on error
        });
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

      // Fetch voting data with error handling
      if (pendingInvite.activity) {
        fetch(`${API_URL}/activities/${numericActivityId}/pinned_activities`, {
          credentials: "include"
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            // Add safety check for array
            setPinnedActivities(Array.isArray(data) ? data : []);
            console.log(data)
          })
          .catch((error) => {
            console.error("Error fetching pinned activities:", error);
            setPinnedActivities([]); // Set empty array on error
          });
      }
    } else {
      console.log('❌ No activity found - neither regular nor pending invite');
    }

    const activityToCheck = latestActivity || pendingInvite?.activity;
    if (activityToCheck?.activity_type === 'Meeting') {
      fetch(`${API_URL}/activities/${numericActivityId}/time_slots`, {
        credentials: "include"
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          // Add safety check for array
          setPinned(Array.isArray(data) ? data : []); // This will populate your pinned time slots
        })
        .catch((error) => {
          console.error("Error fetching time slots:", error);
          setPinned([]); // Set empty array on error
        });
    }

    return () => clearTimeout(timer);
  }, [user, numericActivityId, refreshTrigger, API_URL, pendingInvite]);

  // Countdown effect for finalized activities
  useEffect(() => {
    if (!activityFinalized || !currentActivity?.date_day || !currentActivity?.date_time) return;

    const updateCountdown = () => {
      const now = new Date().getTime();

      // Extract time from date_time (which has format "2000-01-01T22:03:00.000Z")
      const timeOnly = new Date(currentActivity.date_time);
      const hours = timeOnly.getHours();
      const minutes = timeOnly.getMinutes();
      const seconds = timeOnly.getSeconds();

      // Combine date_day with the extracted time
      const eventDate = new Date(currentActivity.date_day);
      eventDate.setHours(hours, minutes, seconds, 0);

      const difference = eventDate.getTime() - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours24 = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes60 = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds60 = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours: hours24, minutes: minutes60, seconds: seconds60 });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activityFinalized, currentActivity?.date_day, currentActivity?.date_time]);

  const handleBack = () => {
    navigate('/');
  };

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

  const handleViewFinalPlans = () => {
    const finalizedUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${currentActivity.id}/share`;
    window.open(finalizedUrl, '_blank');
  };

  const selectedActivity = pinnedActivities.find(activity => activity.selected === true);

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

  console.log(currentActivity)
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
              {activityFinalized ? (
                <FinalizedMessage>
                  <h3>
                    <CheckCircle size={24} />
                    Activity Finalized
                  </h3>
                  <p>This activity has been finalized! All the voting and planning is complete.</p>

                  <FinalizedContent>
                    {/* Countdown Timer */}
                    {currentActivity?.date_day && currentActivity?.date_time && (
                      <CountdownContainer>
                        <h4>
                          <Clock size={20} />
                          Event starts in
                        </h4>
                        <CountdownGrid>
                          <CountdownCard>
                            <strong>{String(countdown.days).padStart(2, '0')}</strong>
                            <small>Days</small>
                          </CountdownCard>
                          <CountdownCard>
                            <strong>{String(countdown.hours).padStart(2, '0')}</strong>
                            <small>Hours</small>
                          </CountdownCard>
                          <CountdownCard>
                            <strong>{String(countdown.minutes).padStart(2, '0')}</strong>
                            <small>Minutes</small>
                          </CountdownCard>
                          <CountdownCard>
                            <strong>{String(countdown.seconds).padStart(2, '0')}</strong>
                            <small>Seconds</small>
                          </CountdownCard>
                        </CountdownGrid>
                      </CountdownContainer>
                    )}

                    {selectedActivity && currentActivity?.activity_type !== 'Meeting' && (
                      <SelectedRestaurant>
                        <h4>
                          📍 Final Selection
                        </h4>
                        <div className="restaurant-name">{selectedActivity.title}</div>

                        {currentActivity?.activity_type === 'Game Night' && (
                          <>
                            {selectedActivity.address && (
                              <div className="restaurant-detail">
                                <Users size={16} />
                                {selectedActivity.address}
                              </div>
                            )}

                            {selectedActivity.hours && (
                              <div className="restaurant-detail">
                                <Clock size={16} />
                                {selectedActivity.hours}
                              </div>
                            )}

                            {selectedActivity.price_range && (
                              <div className="restaurant-detail">
                                <Gamepad2 size={16} />
                                Difficulty: {selectedActivity.price_range}
                              </div>
                            )}
                          </>
                        )}

                        {(currentActivity?.activity_type === 'Restaurant' || currentActivity?.activity_type === 'Cocktails') && (
                          <>
                            {selectedActivity.address && (
                              <div className="restaurant-detail">
                                <MapPin size={16} />
                                {selectedActivity.address}
                              </div>
                            )}

                            {selectedActivity.price_range && (
                              <div className="restaurant-detail">
                                <DollarSign size={16} />
                                {selectedActivity.price_range}
                              </div>
                            )}
                          </>
                        )}

                        {selectedActivity.description && (
                          <div className="restaurant-description">
                            {selectedActivity.description}
                          </div>
                        )}

                        <RestaurantActions>
                          {selectedActivity.website && (
                            <RestaurantButton
                              href={selectedActivity.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Globe size={14} />
                              {currentActivity?.activity_type === 'Game Night' ? 'Game Info' : 'Website'}
                            </RestaurantButton>
                          )}
                          {/* Only show map link for restaurants/cocktails with real addresses */}
                          {selectedActivity.address && (currentActivity?.activity_type === 'Restaurant' || currentActivity?.activity_type === 'Cocktails') && (
                            <RestaurantButton
                              href={`https://maps.google.com?q=${encodeURIComponent(selectedActivity.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MapPin size={14} />
                              Map View
                            </RestaurantButton>
                          )}
                        </RestaurantActions>
                      </SelectedRestaurant>
                    )}
                  </FinalizedContent>

                  <FinalizedButtonContainer>
                    <FinalizedButton $primary onClick={handleViewFinalPlans}>
                      <ExternalLink size={16} />
                      View Final Plans
                    </FinalizedButton>
                  </FinalizedButtonContainer>
                </FinalizedMessage>
              ) : (
                <>
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
                </>
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
            {activityFinalized ? (
              <FinalizedMessage>
                <h3>
                  <CheckCircle size={24} />
                  Activity Finalized
                </h3>
                <p>This activity has been finalized! All the voting and planning is complete.</p>

                <FinalizedContent>
                  {currentActivity?.date_day && currentActivity?.date_time && (
                    <CountdownContainer>
                      <h4>
                        <Clock size={20} />
                        Event starts in
                      </h4>
                      <CountdownGrid>
                        <CountdownCard>
                          <strong>{String(countdown.days).padStart(2, '0')}</strong>
                          <small>Days</small>
                        </CountdownCard>
                        <CountdownCard>
                          <strong>{String(countdown.hours).padStart(2, '0')}</strong>
                          <small>Hours</small>
                        </CountdownCard>
                        <CountdownCard>
                          <strong>{String(countdown.minutes).padStart(2, '0')}</strong>
                          <small>Minutes</small>
                        </CountdownCard>
                        <CountdownCard>
                          <strong>{String(countdown.seconds).padStart(2, '0')}</strong>
                          <small>Seconds</small>
                        </CountdownCard>
                      </CountdownGrid>
                    </CountdownContainer>
                  )}

                  {/* Selected Restaurant/Activity */}
                  {selectedActivity && currentActivity?.activity_type !== 'Meeting' && (
                    <SelectedRestaurant>
                      <h4>
                        📍 Final Selection
                      </h4>
                      <div className="restaurant-name">{selectedActivity.title}</div>

                      {/* Game Night specific fields */}
                      {currentActivity?.activity_type === 'Game Night' && (
                        <>
                          {selectedActivity.address && (
                            <div className="restaurant-detail">
                              <Users size={16} />
                              {selectedActivity.address}
                            </div>
                          )}

                          {selectedActivity.hours && (
                            <div className="restaurant-detail">
                              <Clock size={16} />
                              {selectedActivity.hours}
                            </div>
                          )}

                          {selectedActivity.price_range && (
                            <div className="restaurant-detail">
                              <Gamepad2 size={16} />
                              Difficulty: {selectedActivity.price_range}
                            </div>
                          )}
                        </>
                      )}

                      {/* Restaurant/Cocktails specific fields */}
                      {(currentActivity?.activity_type === 'Restaurant' || currentActivity?.activity_type === 'Cocktails') && (
                        <>
                          {selectedActivity.address && (
                            <div className="restaurant-detail">
                              <MapPin size={16} />
                              {selectedActivity.address}
                            </div>
                          )}

                          {selectedActivity.price_range && (
                            <div className="restaurant-detail">
                              <DollarSign size={16} />
                              {selectedActivity.price_range}
                            </div>
                          )}
                        </>
                      )}

                      {selectedActivity.description && (
                        <div className="restaurant-description">
                          {selectedActivity.description}
                        </div>
                      )}

                      <RestaurantActions>
                        {selectedActivity.website && (
                          <RestaurantButton
                            href={selectedActivity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Globe size={14} />
                            {currentActivity?.activity_type === 'Game Night' ? 'Game Info' : 'Website'}
                          </RestaurantButton>
                        )}
                        {/* Only show map link for restaurants/cocktails with real addresses */}
                        {selectedActivity.address && (currentActivity?.activity_type === 'Restaurant' || currentActivity?.activity_type === 'Cocktails') && (
                          <RestaurantButton
                            href={`https://maps.google.com?q=${encodeURIComponent(selectedActivity.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin size={14} />
                            Map View
                          </RestaurantButton>
                        )}
                      </RestaurantActions>
                    </SelectedRestaurant>
                  )}
                </FinalizedContent>

                <FinalizedButtonContainer>
                  <FinalizedButton $primary onClick={handleViewFinalPlans}>
                    <ExternalLink size={16} />
                    View Final Plans
                  </FinalizedButton>
                </FinalizedButtonContainer>
              </FinalizedMessage>
            ) : (
              <>
                {(currentActivity?.activity_type === 'Restaurant' || currentActivity?.activity_type === 'Cocktails' || currentActivity?.activity_type === 'Game Night') && (
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
              </>
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