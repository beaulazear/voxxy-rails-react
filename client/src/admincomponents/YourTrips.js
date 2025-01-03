import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';

const Hero = styled.div`
  height: clamp(30vh, 40vh, 50vh);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  text-align: center;
  background-color: #fff;
  padding: clamp(20px, 5vw, 60px) 20px;

  h1 {
    font-size: clamp(1.8rem, 5vw, 4rem);
    font-weight: bold;
    margin: 5px 0;
    background: linear-gradient(to right, #6c63ff, #e942f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    margin: 5px 0;
    max-width: 800px;
    color: #555;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    height: 35vh;
    padding: 20px 15px;
  }

  @media (max-width: 480px) {
    height: 30vh;
    padding: 15px 10px;
  }
`;

const TripSelection = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
  background-color: #fff;
  justify-items: center;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

const TripCard = styled.div`
  width: 100%;
  max-width: 300px;
  height: 350px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
  background: white;
  padding: 20px;
  margin-bottom: 50px;

  img {
    width: 100%;
    height: 275px;
    object-fit: cover;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 1.2em;
    margin: 10px 0;
    color: #333;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #888;
  margin-top: 50px;
`;

const LoadingScreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  h1 {
    font-size: 4vw;
    font-weight: bold;
    margin: 0;
    background: linear-gradient(to right, #6c63ff, #e942f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: 2.5vw;
    font-weight: bold;
    margin: 10px 0 0;
    background: linear-gradient(to right, #6c63ff, #e942f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 6vw;
    }
    p {
      font-size: 4vw;
    }
  }
`;

function YourTrips() {
  const { user, setUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  if (!user) {
    return (
      <LoadingScreen>
        <h1>Loading User Data...</h1>
      </LoadingScreen>
    );
  }

  const handleTripClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleDelete = (activityId) => {

    fetch(`${API_URL}/activities/${activityId}`, {
      method: 'DELETE',
      credentials: 'include', // Ensure session is maintained
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error('Failed to delete activity');
        }
        return resp.json();
      })
      .then(() => {
        setUser((prevUser) => ({
          ...prevUser,
          activities: prevUser.activities.filter(
            (activity) => activity.id !== activityId
          ),
        }));
      })
      .catch((error) => {
        console.error('Error deleting activity:', error);
      });
  };

  return (
    <>
      <Hero>
        <h1>Your Trips with Voxxy</h1>
        <p>
          Below are your current trips with Voxxy.
        </p>
      </Hero>
      {user.activities && user.activities.length > 0 ? (
        <TripSelection>
          {user.activities.map((activity) => (
            <TripCard key={activity.id} onClick={() => handleTripClick(activity)}>
              <img
                src={activity.image || '/assets/ski-trip-icon.png'}
                alt={activity.activity_name}
              />
              <h2>{activity.activity_name}</h2>
              <button onClick={() => handleDelete(activity.id)}>Delete</button>
            </TripCard>
          ))}
        </TripSelection>
      ) : (
        <EmptyState>
          No trips yet. Your planned activities will appear here once created!
        </EmptyState>
      )}
      {isLoading && (
        <LoadingScreen>
          <h1>Voxxy Loading...</h1>
          <p>Let's Map Out Your Next Adventure!</p>
        </LoadingScreen>
      )}
    </>
  );
}

export default YourTrips;