import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import CuisineChat from './CuisineChat';
import AIRecommendations from "./AIRecommendations";
import UpdateActivityModal from './UpdateActivityModal';

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
  background-color: #f9f9f9;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  text-align: left;
  position: relative;
  width: 100%;

  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0 auto;
    flex-grow: 1;
    text-align: center;
  }

  .back-button {
    padding: 0.5rem 1rem;
    background: #e942f5;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;

    &:hover {
      background: #d932e0;
    }
  }

  .icon-buttons {
    position: relative;
    display: flex;
    align-items: center;
  }

  .trash-icon {
    cursor: pointer;
    font-size: 1.4rem;
    transition: opacity 0.3s ease;
    position: relative;
    padding-bottom: 10px; /* Extra space to avoid tooltip cramming */

    &:hover {
      opacity: 0.7;
    }

    &:hover::after {
      content: 'Delete Board';
      position: absolute;
      top: 140%; /* Moves tooltip below the icon */
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.75);
      color: #fff;
      font-size: 0.8rem;
      padding: 6px 10px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 1;
      visibility: visible;
      transition: opacity 0.2s ease-in-out;
    }
  }

  @media (min-width: 769px) {
    .icon-buttons {
      display: flex;
      align-items: center;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;

    h1 {
      order: 1;
      margin-bottom: 1rem;
    }

    .icon-buttons {
      order: 2;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: auto;
      margin-top: 1rem;
    }

    .back-button, 
    .trash-icon {
      order: 2;
    }
  }
`;

const Section = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;

  h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    text-align: left;
    font-weight: 600;
  }

  p {
    text-align: left;
  }

  .location,
  .date {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .participants {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;

    .participant {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #9b59b6;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .add-participant {
      padding: 0.5rem 1rem;
      background: #e9e9e9;
      border-radius: 20px;
      color: #333;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid #ccc;

      &:hover {
        background: #d9d9d9;
      }
    }
  }
`;

const TabsSection = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  .tabs {
    display: flex;
    width: 100%;
    max-width: 400px;
    justify-content: space-between;
    border-radius: 8px;
    overflow: hidden;

    button {
      flex: 1;
      padding: 0.75rem 0;
      text-align: center;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      background: #f0f0f0;
      color: #555;
      transition: all 0.3s ease;

      &.active {
        background: #fff;
        color: #000;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }
`;

const ChatButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
`;

const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s ease;
  background: ${(props) => (props.$isDelete ? "#e74c3c" : "#9b59b6")};

  &:hover {
    background: ${(props) => (props.$isDelete ? "#c0392b" : "#8e44ad")};
  }
`;

const DimmedOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
`;

const FlexContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const SmallSection = styled.div`
  flex: 1;
  min-width: 280px;
  background: #fff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    text-align: left;
    font-weight: 600;
  }

  .location,
  .date {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .participants {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;

    .participant {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #9b59b6;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .add-participant {
      padding: 0.5rem 1rem;
      background: #e9e9e9;
      border-radius: 20px;
      color: #333;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid #ccc;

      &:hover {
        background: #d9d9d9;
      }
    }
  }
`;

const InviteButton = styled.button`
  padding: 0.5rem 1rem;
  background: #9b59b6;
  color: #fff;
  border-radius: 20px;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  
  &:hover {
    background: #8e44ad;
  }
`;

const ParticipantsSection = styled.div`
  margin-top: 1rem;
  max-height: 200px; /* Fixed height */
  overflow-y: auto; /* Enables scrolling when content overflows */
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  background: #fff;

  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }

  .participant {
    display: inline-block;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border-radius: 20px;
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
  }

  .confirmed {
    background: #9b59b6;
    color: #fff;
  }

  .pending {
    background: #f0f0f0;
    color: #666;
    border: 1px solid #ccc;
  }
`;

function ActivityDetailsPage({ activity, onBack }) {
  const [activeTab, setActiveTab] = useState('Recommendations');
  const [showChat, setShowChat] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [updatedActivity, setUpdatedActivity] = useState(activity);

  const { setUser } = useContext(UserContext);

  const confirmedParticipants = activity.participants || [];
  const pendingParticipants = activity.activity_participants?.filter(p => !p.accepted) || [];

  const handleInvite = async () => {
    if (!inviteEmail) return;

    const isDuplicate =
      activity.participants.some((p) => p.email === inviteEmail) ||
      activity.activity_participants.some((p) => p.invited_email === inviteEmail);

    if (isDuplicate) {
      alert("This email is already invited or is a participant.");
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activity_participants/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: inviteEmail, activity_id: activity.id }),
    });

    if (response.ok) {
      alert("Invitation sent!");
      setInviteEmail("");
    } else {
      const data = await response.json();
      alert(data.error || "Failed to send invitation.");
    }
  };

  function handleUpdate(newData) {
    setUpdatedActivity(newData);

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
            onBack();
          } else {
            console.error("Failed to delete activity");
          }
        })
        .catch((error) => console.error("Error deleting activity:", error));
    }
  }

  if (!activity) return null;

  return (
    <PageContainer>
      <Header>
        <button className="back-button" onClick={onBack}>Back</button>
        <h1>{updatedActivity.activity_name || 'Activity Details'}</h1>
        <div className="icon-buttons">
          <span className="trash-icon" onClick={() => handleDelete(activity.id)}>🗑️</span>
        </div>
      </Header>

      <FlexContainer>
        <SmallSection>
          <h2>Details</h2>
          <div className="location">
            📍 {updatedActivity.activity_location || 'Not specified'}
          </div>
          <div className="date">
            📅 {updatedActivity.date_notes}
          </div>
          <button onClick={() => setShowModal(true)}>Update Details</button>
        </SmallSection>

        <SmallSection>
          <h2>Participants</h2>
          <ParticipantsSection>
            <h3>Confirmed Participants</h3>
            {confirmedParticipants.length > 0 ? (
              confirmedParticipants.map((participant) => (
                <div key={participant.id} className="participant confirmed">
                  {participant.name}
                </div>
              ))
            ) : (
              <p>No confirmed participants yet.</p>
            )}

            <h3>Pending Invites</h3>
            {pendingParticipants.length > 0 ? (
              pendingParticipants.map((invite, index) => (
                <div key={index} className="participant pending">
                  {invite.invited_email} (Pending)
                </div>
              ))
            ) : (
              <p>No pending invites.</p>
            )}
          </ParticipantsSection>

          <input
            type="email"
            placeholder="Invite by email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <InviteButton onClick={handleInvite}>Invite</InviteButton>
        </SmallSection>
      </FlexContainer>

      <Section>
        <h2>Pin</h2>
        <p>No pin added yet.</p>
      </Section>
      <TabsSection>
        <div className="tabs">
          <button
            className={activeTab === "Recommendations" ? "active" : ""}
            onClick={() => setActiveTab("Recommendations")}
          >
            Recommendations
          </button>
          <button
            className={activeTab === "Discussion" ? "active" : ""}
            onClick={() => setActiveTab("Discussion")}
          >
            Discussion
          </button>
        </div>
        <div className="tab-content">
          {activeTab === "Recommendations" && <AIRecommendations activity={updatedActivity} refreshTrigger={refreshTrigger} />}
          {activeTab === "Discussion" && <p>Discussion content goes here.</p>}
        </div>
      </TabsSection>

      {activeTab === "Recommendations" && (
        <ChatButton>
          <StyledButton onClick={() => setShowChat(true)}>
            Chat with Voxxy
          </StyledButton>
        </ChatButton>
      )}

      {showChat && (
        <>
          <DimmedOverlay />

          <CuisineChat
            activityId={activity.id}
            onClose={() => setShowChat(false)}
            onChatComplete={() => {
              setRefreshTrigger(prev => !prev);
              console.log('🔄 refreshTrigger updated!', !refreshTrigger);
            }}
          />
        </>
      )}

      {showModal && (
        <UpdateActivityModal
          activity={updatedActivity}
          onClose={() => setShowModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </PageContainer>
  );
}

export default ActivityDetailsPage;