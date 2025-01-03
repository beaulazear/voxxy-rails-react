import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';

const Hero = styled.div`
  height: clamp(30vh, 40vh, 50vh); /* Smoothly adjusts height across devices */
  display: flex;
  flex-direction: column;
  justify-content: space-evenly; /* Even spacing above and below */
  align-items: center;
  text-align: center;
  background-color: #fff;
  padding: clamp(20px, 5vw, 60px) 20px; /* Adaptive padding for smaller screens */

  h1 {
    font-size: clamp(1.8rem, 5vw, 4rem); /* Scales smoothly */
    font-weight: bold;
    margin: 5px 0;
    background: linear-gradient(to right, #6c63ff, #e942f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: clamp(1rem, 2.5vw, 1.5rem); /* Scales smoothly */
    margin: 5px 0;
    max-width: 800px;
    color: #555;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    height: 35vh; /* Reduce height slightly */
    padding: 20px 15px; /* Adjust padding */
  }

  @media (max-width: 480px) {
    height: 30vh; /* Further reduce height */
    padding: 15px 10px; /* Adjust padding */
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

function TripPlanner() {
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    return (
      <LoadingScreen>
        <h1>Loading User Data...</h1>
      </LoadingScreen>
    );
  }

  const handleSkiTripClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/ski-trip', { replace: true }); // Prevent history duplication
    }, 1000);
  };

  const handleTripSelect = (tripName) => {
    if (tripName === 'Ski Trip') {
      handleSkiTripClick();
    } else {
      console.log(`Selected Trip: ${tripName}`);
      alert(`Selected Trip: ${tripName}`);
    }
  };

  return (
    <>
      <Hero>
        <h1>Your next escape awaits....</h1>
        <p>
          Voxxy helps you and your crew decide where to go, where to stay, and what to do – without
          the chaos.
        </p>
      </Hero>
      <TripSelection>
        {[
          { name: 'Choose a Destination', icon: '/assets/choose-destination-icon.png' },
          { name: 'Ski Trip', icon: '/assets/ski-trip-icon.png' },
          { name: 'Trip Around Ireland', icon: '/assets/trip-around-ireland-icon.png' },
          { name: 'Plan a Road Trip', icon: '/assets/plan-a-road-trip-icon.png' },
          { name: 'Spring Break', icon: '/assets/spring-break-icon.png' },
          { name: 'Recommend a Trip', icon: '/assets/request-a-trip-icon.png' },
        ].map((trip) => (
          <TripCard key={trip.name} onClick={() => handleTripSelect(trip.name)}>
            <img src={trip.icon} alt={trip.name} />
            <h2>{trip.name}</h2>
          </TripCard>
        ))}
      </TripSelection>
      {isLoading && (
        <LoadingScreen>
          <h1>Voxxy Loading...</h1>
          <p>Let's Map Out Your Next Adventure!</p>
        </LoadingScreen>
      )}
    </>
  );
}

export default TripPlanner;