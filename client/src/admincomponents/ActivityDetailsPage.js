import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import CuisineChat from './CuisineChat';
import AIRecommendations from "./AIRecommendations";

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

  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
  }

  button {
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

function ActivityDetailsPage({ activity, onBack }) {
  const [activeTab, setActiveTab] = useState('Recommendations');
  const [showChat, setShowChat] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false); // New state for triggering refresh

  const { setUser } = useContext(UserContext);

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
        <h1>{activity.activity_name || 'Activity Details'}</h1>
        <button onClick={() => onBack()}>Back</button>
      </Header>

      <Section>
        <h2>Details</h2>
        <div className="location">
          📍 {activity.activity_location || 'Not specified'}
        </div>
        <div className="date">
          📅 {activity.date_notes}
        </div>
      </Section>

      <Section>
        <h2>Participants</h2>
        <div className="participants">
          <div className="participant">AK</div>
          <div className="participant">AK</div>
          <div className="participant">AK</div>
          <div className="participant">AK</div>
          <div className="add-participant">+ Invite</div>
        </div>
      </Section>

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
          {activeTab === "Recommendations" && <AIRecommendations activity={activity} refreshTrigger={refreshTrigger} />}
          {activeTab === "Discussion" && <p>Discussion content goes here.</p>}
        </div>
      </TabsSection>

      <ChatButton>
        <StyledButton onClick={() => setShowChat(true)}>
          Chat with Voxxy
        </StyledButton>
      </ChatButton>

      <ChatButton>
        <StyledButton $isDelete onClick={() => handleDelete(activity.id)}>
          Delete Board
        </StyledButton>
      </ChatButton>

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
    </PageContainer>
  );
}

export default ActivityDetailsPage;