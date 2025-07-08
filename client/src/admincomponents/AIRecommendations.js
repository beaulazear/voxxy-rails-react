import React, { useState, useContext } from "react";
import styled, { keyframes } from 'styled-components';
import CuisineChat from "./CuisineChat";
import BarChat from "../cocktails//BarChat"; // NEW: Import BarChat
import LoadingScreenUser from "./LoadingScreenUser.js";
import mixpanel from "mixpanel-browser";
import { UserContext } from "../context/user";
import { Users, Share, HelpCircle, CheckCircle, Clock, Vote, BookHeart, Flag, Cog, X, ExternalLink, MapPin, DollarSign, Globe, Zap, Calendar } from 'lucide-react';

// ... keep all the existing styled components exactly the same ...

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
`;

const fadeInNoTransform = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const Container = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  color: #fff;
  padding-top: 2rem;
  animation: ${fadeInNoTransform} 0.8s ease-in-out,
             ${gradientAnimation} 15s ease infinite;
`;

const TopBar = styled.div`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  display: flex;
`;

const Heading = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  margin: 0 auto;
  text-align: center;
`;

const PhaseIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }
`;

const PhaseIcon = styled.div`
  color: #cc31e8;
`;

const PhaseContent = styled.div`
  flex: 1;
  text-align: left;
`;

const PhaseTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const PhaseSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #ccc;
`;

const ProgressBarContainer = styled.div`
  background: #333;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: #cc31e8;
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const PreferencesCard = styled.div`
  background: linear-gradient(135deg, #9051e1 0%, #cc31e8 100%);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const PreferencesIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const PreferencesTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
`;

const PreferencesText = styled.p`
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
  line-height: 1.5;
`;

const PreferencesButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 auto;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

const SubmittedCard = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const SubmittedIcon = styled.div`
  color: #28a745;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const SubmittedTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  color: #28a745;
`;

const SubmittedText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #ccc;
  line-height: 1.5;
  text-align: left;
`;

const ResubmitButton = styled.button`
  background: transparent;
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 auto;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(40, 167, 69, 0.1);
    transform: translateY(-1px);
  }
`;

const OrganizerSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const OrganizerTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
`;

const ParticipantsList = styled.div`
  margin-bottom: 1.5rem;
`;

const ParticipantItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParticipantName = styled.span`
  font-size: 0.9rem;
  ${({ $isGuest }) => $isGuest && `
    font-style: italic;
    opacity: 0.9;
  `}
`;

const ParticipantStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${({ $submitted }) => $submitted ? '#28a745' : '#ffc107'};
`;

const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  color: #ffc107;
  font-size: 0.85rem;
  margin: 1rem 0;
`;

const ErrorText = styled.p`
  color: #d9534f;
  text-align: center;
  font-style: italic;
  margin-bottom: 1rem;
`;

// Availability components (keep existing)
const AvailabilitySection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

const AvailabilityTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AvailabilityGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const DateCard = styled.div`
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
`;

const DateHeader = styled.div`
  font-weight: 600;
  color: #cc31e8;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const TimeSlots = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const TimeSlot = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  color: #ccc;
`;

const ParticipantAvailability = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  border-left: 3px solid #cc31e8;
`;

const ParticipantNameAvailability = styled.div`
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const OverlapAnalysis = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
  border-radius: 0.75rem;
`;

const OverlapTitle = styled.h4`
  color: #28a745;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TimeOverlapItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const TimeText = styled.span`
  color: #fff;
`;

const AvailabilityBadge = styled.span`
  color: ${({ $percentage }) => $percentage >= 70 ? '#28a745' : $percentage >= 50 ? '#ffc107' : '#dc3545'};
  font-size: 0.8rem;
  font-weight: 600;
`;

const RecommendationsList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  position: relative;
  background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: ${({ $selected }) => $selected ? '1px solid #28a745' : '1px solid rgba(255, 255, 255, 0.1)'};
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #28a745;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ContentWrapper = styled.div``;

const ListTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ListName = styled.span`
  font-weight: 600;
  text-align: left;
`;

const ListMeta = styled.span`
  font-size: 0.875rem;
  color: #ccc;
`;

const ListBottom = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LikeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: ${(props) => (props.$liked ? "#e25555" : "#ccc")};
  cursor: pointer;
  font-size: 0.875rem;
  & svg {
    fill: ${(props) => (props.$liked ? "#e25555" : "none")};
  }
`;

const VoteCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ccc;
  font-size: 0.875rem;
`;

const DimOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 997;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cc31e8;
    border-radius: 2px;
  }
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const ModalTitle = styled.h2`
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
`;

const ModalSubtitle = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem 2rem 2rem;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #cc31e8;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #ccc;
`;

const DetailLabel = styled.span`
  font-weight: 600;
  color: #fff;
`;

const DetailValue = styled.span`
  color: #ccc;
`;

const PhotoGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const Photo = styled.img`
  width: 100%;
  height: 120px;
  border-radius: 0.75rem;
  object-fit: cover;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const Description = styled.p`
  color: #ccc;
  line-height: 1.5;
  margin: 0;
  text-align: left;
`;

const Reason = styled.div`
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-top: 1rem;
  text-align: left;
`;

const ReasonTitle = styled.div`
  color: #cc31e8;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
`;

const ReasonText = styled.p`
  color: #ccc;
  margin: 0;
  line-height: 1.4;
  font-size: 0.85rem;
`;

const WebsiteLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #cc31e8;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.85rem;
  margin-top: 1rem;
  padding: 0.6rem 1rem;
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(204, 49, 232, 0.2);
    transform: translateY(-1px);
  }
`;

const GoogleMapContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  margin-top: 1rem;
  
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const MapLoadingContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const MapLoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid rgba(204, 49, 232, 0.3);
  border-top: 3px solid #cc31e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const MapLoadingText = styled.div`
  color: #ccc;
  font-size: 0.85rem;
  text-align: center;
`;

const Button = styled.button`
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  
  background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
      : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $primary }) => ($primary ? 'white' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid rgba(204, 49, 232, 0.3)')};
  
  &:hover:not(:disabled) { 
    transform: translateY(-1px);
    box-shadow: ${({ $primary }) =>
    $primary
      ? '0 4px 12px rgba(204, 49, 232, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)'};
    background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
      : 'rgba(255, 255, 255, 0.08)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const FullWidthButton = styled.button`
  width: 100%;
  background: ${({ $primary }) => ($primary ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)' : 'transparent')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid rgba(204, 49, 232, 0.3)')};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    ${({ $primary }) =>
    $primary
      ? `background: linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(204, 49, 232, 0.3);`
      : `background: rgba(204, 49, 232, 0.1); color: #cc31e8; transform: translateY(-1px);`}
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalProgressContainer = styled.div`
  margin: 1rem 0;
`;

const ModalProgressBarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

const ModalProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const ProgressInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ccc;
  font-size: 0.85rem;
`;

const ProgressLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressPercentage = styled.div`
  color: #cc31e8;
  font-weight: 600;
`;

// Keep all existing helper functions
const generateGoogleMapsEmbedUrl = (address, apiKey) => {
  if (!address || !apiKey) {
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=15`;
  return url;
};

const analyzeAvailability = (responses) => {
  const availabilityData = {};
  const participantCount = {};

  responses.forEach(response => {
    const availability = response.availability || {};
    const participantName = response.user?.name || response.email || 'Anonymous';

    Object.entries(availability).forEach(([date, times]) => {
      if (!availabilityData[date]) {
        availabilityData[date] = {};
        participantCount[date] = 0;
      }
      participantCount[date]++;

      times.forEach(time => {
        if (!availabilityData[date][time]) {
          availabilityData[date][time] = [];
        }
        availabilityData[date][time].push(participantName);
      });
    });
  });

  return { availabilityData, participantCount };
};

const AvailabilityDisplay = ({ responses, activity }) => {
  if (!activity.allow_participant_time_selection) return null;

  const responsesWithAvailability = responses.filter(r =>
    r.availability && Object.keys(r.availability).length > 0
  );

  if (responsesWithAvailability.length === 0) {
    return (
      <AvailabilitySection>
        <AvailabilityTitle>
          <Calendar size={20} />
          Time Preferences
        </AvailabilityTitle>
        <p style={{ color: '#ccc', margin: 0 }}>
          No availability submitted yet. Participants will share their preferred times along with their preferences.
        </p>
      </AvailabilitySection>
    );
  }

  const { availabilityData, participantCount } = analyzeAvailability(responsesWithAvailability);

  return (
    <AvailabilitySection>
      <AvailabilityTitle>
        <Calendar size={20} />
        Group Availability ({responsesWithAvailability.length} responses)
      </AvailabilityTitle>

      <AvailabilityGrid>
        {responsesWithAvailability.map((response, index) => (
          <ParticipantAvailability key={index}>
            <ParticipantNameAvailability>
              {response.user?.name || response.email || 'Anonymous'}
            </ParticipantNameAvailability>
            <AvailabilityGrid>
              {Object.entries(response.availability || {}).map(([date, times]) => (
                <DateCard key={date}>
                  <DateHeader>{new Date(date).toLocaleDateString()}</DateHeader>
                  <TimeSlots>
                    {times.map((time, i) => (
                      <TimeSlot key={i}>{time}</TimeSlot>
                    ))}
                  </TimeSlots>
                </DateCard>
              ))}
            </AvailabilityGrid>
          </ParticipantAvailability>
        ))}
      </AvailabilityGrid>

      {Object.keys(availabilityData).length > 0 && (
        <OverlapAnalysis>
          <OverlapTitle>
            📊 Best Times (Most Available)
          </OverlapTitle>
          {Object.entries(availabilityData).map(([date, timeData]) => {
            const sortedTimes = Object.entries(timeData)
              .sort(([, a], [, b]) => b.length - a.length)
              .slice(0, 5);

            return (
              <DateCard key={date} style={{ marginBottom: '1rem', background: 'rgba(40, 167, 69, 0.1)' }}>
                <DateHeader style={{ color: '#28a745' }}>
                  {new Date(date).toLocaleDateString()}
                  <span style={{ fontWeight: 'normal', marginLeft: '0.5rem' }}>
                    ({participantCount[date]} participant{participantCount[date] !== 1 ? 's' : ''})
                  </span>
                </DateHeader>
                {sortedTimes.map(([time, participants]) => {
                  const percentage = (participants.length / responsesWithAvailability.length) * 100;
                  return (
                    <TimeOverlapItem key={time}>
                      <TimeText>{time}</TimeText>
                      <AvailabilityBadge $percentage={percentage}>
                        {participants.length}/{responsesWithAvailability.length} available ({Math.round(percentage)}%)
                      </AvailabilityBadge>
                    </TimeOverlapItem>
                  );
                })}
              </DateCard>
            );
          })}
        </OverlapAnalysis>
      )}
    </AvailabilitySection>
  );
};

export default function AIRecommendations({
  activity,
  pinnedActivities,
  setPinnedActivities,
  setPinned,
  setRefreshTrigger,
  isOwner,
  onEdit,
}) {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMoveToVotingModal, setShowMoveToVotingModal] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  React.useEffect(() => {
    if (mapLoading && showDetailModal) {
      const timer = setTimeout(() => {
        setMapLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [mapLoading, showDetailModal]);

  const { id, responses, activity_location, date_notes, collecting, voting, finalized, selected_pinned_activity_id } = activity;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

  // NEW: Determine activity type for dynamic text and API calls
  const activityType = activity.activity_type || 'Restaurant';
  const isCocktailsActivity = activityType === 'Cocktails';

  // NEW: Dynamic text based on activity type
  const getActivityText = () => {
    if (isCocktailsActivity) {
      return {
        submitTitle: 'Submit Your Bar Preferences',
        submitDescription: 'Help us find the perfect bar by sharing your drink preferences and atmosphere needs',
        planningTitle: 'Bar Planning',
        votingTitle: 'Vote on Bars',
        finalizedTitle: 'Activity Finalized',
        preferencesQuiz: 'Take Bar Preferences Quiz',
        resubmitPreferences: 'Resubmit Bar Preferences',
        reasonTitle: 'Why This Bar?',
        apiEndpoint: '/api/openai/bar_recommendations'
      };
    }
    return {
      submitTitle: 'Submit Your Preferences',
      submitDescription: 'Help us find the perfect restaurant by sharing your food preferences and dietary needs',
      planningTitle: 'Restaurant Planning',
      votingTitle: 'Vote on Restaurants',
      finalizedTitle: 'Activity Finalized',
      preferencesQuiz: 'Take Preferences Quiz',
      resubmitPreferences: 'Resubmit Preferences',
      reasonTitle: 'Why This Restaurant?',
      apiEndpoint: '/api/openai/restaurant_recommendations'
    };
  };

  const activityText = getActivityText();

  const allParticipants = activity.participants || [];
  const totalParticipants = allParticipants.length + 1;

  const currentUserResponse = user ? responses.find(r =>
    r.user_id === user.id || r.email === user.email
  ) : null;
  const responseRate = (responses.length / totalParticipants) * 100;

  const participantsWithVotes = new Set();
  pinnedActivities.forEach(pin => {
    (pin.voters || []).forEach(voter => {
      participantsWithVotes.add(voter.id);
    });
  });
  const votingRate = (participantsWithVotes.size / totalParticipants) * 100;

  const hasParticipantSubmitted = (participant) => {
    if (participant.user_id) {
      return responses.some(r => r.user_id === participant.user_id);
    }
    if (participant.invited_email) {
      return responses.some(r => r.email === participant.invited_email);
    }
    return false;
  };

  const getParticipantDisplayName = (participant) => {
    if (participant.user_id && participant.name) {
      return participant.name;
    }
    return participant.invited_email || participant.email || 'Unknown';
  };

  const isGuestParticipant = (participant) => {
    return !participant.user_id && participant.invited_email;
  };

  const handleStartChat = () => {
    if (process.env.NODE_ENV === "production" && user) {
      const trackingEvent = isCocktailsActivity ? "Bar Chat with Voxxy Clicked" : "Chat with Voxxy Clicked";
      mixpanel.track(trackingEvent, { activity: id });
    }
    setShowChat(true);
  };

  const moveToVotingPhase = async () => {
    setLoading(true);
    setError("");

    try {
      // NEW: Use dynamic API endpoint based on activity type
      const res = await fetch(
        `${API_URL}${activityText.apiEndpoint}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses: responses.map(r => r.notes).join("\n\n"),
            activity_location,
            date_notes,
            activity_id: id,
          }),
        }
      );

      if (!res.ok) throw new Error("❌ Error fetching recommendations");
      const { recommendations: recs } = await res.json();

      const pinnedActivityPromises = recs.map(rec =>
        fetch(`${API_URL}/activities/${id}/pinned_activities`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pinned_activity: {
              title: rec.name,
              description: rec.description || "",
              hours: rec.hours || "",
              price_range: rec.price_range || "",
              address: rec.address || "",
              votes: [],
              voters: [],
              reviews: rec.reviews || [],
              photos: rec.photos || [],
              reason: rec.reason || "",
              website: rec.website || "",
            },
          }),
        })
      );

      let pinnedTimeSlotPromises = [];
      if (activity.allow_participant_time_selection) {
        const availabilityMap = {};
        responses.forEach(response => {
          const availability = response.availability;
          if (!availability) return;

          Object.entries(availability).forEach(([date, times]) => {
            if (!Array.isArray(times)) return;
            if (!availabilityMap[date]) availabilityMap[date] = {};
            times.forEach(time => {
              availabilityMap[date][time] = (availabilityMap[date][time] || 0) + 1;
            });
          });
        });

        const allSlots = [];
        Object.entries(availabilityMap).forEach(([date, times]) => {
          Object.entries(times).forEach(([time, count]) => {
            allSlots.push({ date, time, count });
          });
        });

        const topSlots = allSlots
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        pinnedTimeSlotPromises = topSlots.map(slot =>
          fetch(`${API_URL}/activities/${id}/time_slots`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: slot.date,
              time: slot.time
            }),
          })
        );
      }

      const [pinnedActivityResults, pinnedTimeSlotResults] = await Promise.all([
        Promise.all(pinnedActivityPromises),
        Promise.all(pinnedTimeSlotPromises)
      ]);

      const newPinnedActivities = await Promise.all(
        pinnedActivityResults.map(res => res.json())
      );

      const newTimeSlots = await Promise.all(
        pinnedTimeSlotResults.map(res => res.json())
      );

      await fetch(`${API_URL}/activities/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collecting: false,
          voting: true
        }),
      });

      if (user && setUser) {
        setUser(prevUser => ({
          ...prevUser,
          activities: prevUser.activities.map(act =>
            act.id === id
              ? { ...act, collecting: false, voting: true }
              : act
          )
        }));
      }

      setPinnedActivities(newPinnedActivities);
      setPinnedActivities(newTimeSlots)
      setRefreshTrigger(f => !f);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowMoveToVotingModal(false);
    }
  };

  const handleLike = (pin) => {
    if (!user) return;

    if (process.env.NODE_ENV === "production") {
      mixpanel.track("Pinned Activity Voted On", { user: user.id });
    }
    const hasLiked = (pin.voters || []).some(v => v.id === user.id);

    if (hasLiked) {
      const vote = (pin.votes || []).find(v => v.user_id === user.id)
      if (!vote) return;
      fetch(`${API_URL}/pinned_activities/${pin.id}/votes/${vote.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setPinnedActivities((prev) =>
              prev.map((a) =>
                a.id === pin.id
                  ? {
                    ...a,
                    votes: data.votes,
                    voters: data.voters,
                  }
                  : a
              )
            );
            setRefreshTrigger(f => !f)
          }
        });
    } else {
      fetch(`${API_URL}/pinned_activities/${pin.id}/votes`, {
        method: "POST",
        credentials: "include",
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setPinnedActivities((prev) =>
              prev.map((a) =>
                a.id === pin.id
                  ? {
                    ...a,
                    votes: data.votes,
                    voters: data.voters,
                  }
                  : a
              )
            );
            setRefreshTrigger(f => !f)
          }
        });
    }
  };

  function openDetail(rec) {
    setSelectedRec(rec);
    setShowDetailModal(true);
    setMapLoading(true);
  }

  function closeDetail() {
    setShowDetailModal(false);
    setSelectedRec(null);
  }

  const shareUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${activity.id}/share`;
  const sharePlanUrlClick = () => {
    window.open(
      shareUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (loading) return <LoadingScreenUser autoDismiss={false} />;

  if (collecting && !voting) {
    return (
      <Container>
        <TopBar>
          <Heading>{activityText.submitTitle}</Heading>
        </TopBar>

        {error && <ErrorText>{error}</ErrorText>}

        <PhaseIndicator>
          <PhaseIcon><HelpCircle size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Group Status</PhaseTitle>
            <PhaseSubtitle>
              {responses.length}/{totalParticipants} participants have submitted
              {activity.allow_participant_time_selection && " preferences & availability"}
            </PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={responseRate} />
        </ProgressBarContainer>

        <AvailabilityDisplay responses={responses} activity={activity} />

        {isOwner && (
          <OrganizerSection>
            <OrganizerTitle><Cog size={20} style={{ marginBottom: '4px' }} /> Organizer Controls</OrganizerTitle>
            <ParticipantsList>
              <ParticipantItem>
                <ParticipantName>
                  {activity.organizer?.name || user?.name || 'You'} (Organizer)
                </ParticipantName>
                <ParticipantStatus $submitted={currentUserResponse !== null}>
                  {currentUserResponse ? <CheckCircle size={16} /> : <Clock size={16} />}
                  {currentUserResponse ? 'Submitted' : 'Waiting'}
                </ParticipantStatus>
              </ParticipantItem>

              {allParticipants.map((participant, index) => {
                const hasSubmitted = hasParticipantSubmitted(participant);
                const displayName = getParticipantDisplayName(participant);
                const isGuest = isGuestParticipant(participant);

                return (
                  <ParticipantItem key={index}>
                    <ParticipantName $isGuest={isGuest}>
                      {displayName} {isGuest && '(guest)'}
                    </ParticipantName>
                    <ParticipantStatus $submitted={hasSubmitted}>
                      {hasSubmitted ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {hasSubmitted ? 'Submitted' : 'Waiting'}
                    </ParticipantStatus>
                  </ParticipantItem>
                );
              })}
            </ParticipantsList>
            <FullWidthButton $primary onClick={() => setShowMoveToVotingModal(true)}>
              <Vote size={20} />
              Move to Voting Phase
            </FullWidthButton>
          </OrganizerSection>
        )}

        {user && !currentUserResponse ? (
          <PreferencesCard>
            <PreferencesIcon><BookHeart size={48} /></PreferencesIcon>
            <PreferencesTitle>Submit Your Preferences!</PreferencesTitle>
            <PreferencesText>
              {activityText.submitDescription}
              {activity.allow_participant_time_selection && " and your availability"}.
            </PreferencesText>
            <PreferencesButton onClick={handleStartChat}>
              <HelpCircle size={20} />
              {activity.allow_participant_time_selection ? `${activityText.preferencesQuiz} & Availability` : activityText.preferencesQuiz}
            </PreferencesButton>
          </PreferencesCard>
        ) : user && currentUserResponse ? (
          <SubmittedCard>
            <SubmittedIcon><CheckCircle size={48} /></SubmittedIcon>
            <SubmittedTitle>Thank you for submitting your response!</SubmittedTitle>
            <SubmittedText>
              The organizer will gather recommendations shortly. You can resubmit your preferences
              {activity.allow_participant_time_selection && " and availability"} if you'd like to make changes.
            </SubmittedText>
            <ResubmitButton onClick={handleStartChat}>
              <HelpCircle size={18} />
              {activity.allow_participant_time_selection ? `${activityText.resubmitPreferences} & Availability` : activityText.resubmitPreferences}
            </ResubmitButton>
          </SubmittedCard>
        ) : null}

        {/* NEW: Conditionally render correct chat component */}
        {showChat && user && (
          <>
            <DimOverlay onClick={() => setShowChat(false)} />
            {isCocktailsActivity ? (
              <BarChat
                activityId={id}
                onClose={() => setShowChat(false)}
                onChatComplete={async () => {
                  setRefreshTrigger(f => !f);
                  setShowChat(false);
                }}
              />
            ) : (
              <CuisineChat
                activityId={id}
                onClose={() => setShowChat(false)}
                onChatComplete={async () => {
                  setRefreshTrigger(f => !f);
                  setShowChat(false);
                }}
              />
            )}
          </>
        )}

        {showMoveToVotingModal && (
          <ModalOverlay onClick={() => setShowMoveToVotingModal(false)}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Move to voting phase?</ModalTitle>
                <ModalSubtitle>Generate recommendations and start group voting</ModalSubtitle>
                <CloseButton onClick={() => setShowMoveToVotingModal(false)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <Section>
                  <ModalProgressContainer>
                    <ModalProgressBarContainer>
                      <ModalProgressBar $percent={responseRate} />
                    </ModalProgressBarContainer>
                    <ProgressInfo>
                      <ProgressLeft>
                        <Users size={16} />
                        <span>{responses.length}/{totalParticipants} users submitted</span>
                      </ProgressLeft>
                      <ProgressPercentage>{Math.round(responseRate)}%</ProgressPercentage>
                    </ProgressInfo>
                  </ModalProgressContainer>

                  {responseRate < 50 && (
                    <WarningBox>
                      <span>⚠️ Less than 50% of participants have submitted their preferences. Consider waiting for more responses to get better recommendations.</span>
                    </WarningBox>
                  )}
                </Section>

                <ButtonRow>
                  <Button onClick={() => setShowMoveToVotingModal(false)}>
                    Cancel
                  </Button>
                  <Button $primary onClick={moveToVotingPhase}>
                    <Zap size={16} />
                    Generate Recommendations
                  </Button>
                </ButtonRow>
              </ModalBody>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Container>
    );
  }

  if (voting && !collecting && !finalized) {
    return (
      <Container>
        <TopBar>
          <Heading>{activityText.votingTitle}</Heading>
        </TopBar>

        <PhaseIndicator>
          <PhaseIcon><Vote size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Voting Phase</PhaseTitle>
            <PhaseSubtitle>{participantsWithVotes.size}/{totalParticipants} participants have voted. After everyone has voted, your organizer can finalize the activity plans. ✨</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={votingRate} />
        </ProgressBarContainer>

        {error && <ErrorText>{error}</ErrorText>}

        {isOwner && (
          <OrganizerSection>
            <OrganizerTitle><Cog style={{ marginBottom: '4px' }} size={20} /> Organizer Controls</OrganizerTitle>
            <ParticipantsList>
              <ParticipantItem>
                <ParticipantName>
                  {activity.organizer?.name || user?.name || 'You'} (Organizer)
                </ParticipantName>
                <ParticipantStatus $submitted={Array.from(participantsWithVotes).includes(user?.id)}>
                  {Array.from(participantsWithVotes).includes(user?.id) ? <CheckCircle size={16} /> : <Clock size={16} />}
                  {Array.from(participantsWithVotes).includes(user?.id) ? 'Voted' : 'Waiting'}
                </ParticipantStatus>
              </ParticipantItem>

              {allParticipants.map((participant, index) => {
                const hasVoted = participant.user_id && Array.from(participantsWithVotes).includes(participant.user_id);
                const displayName = getParticipantDisplayName(participant);
                const isGuest = isGuestParticipant(participant);

                return (
                  <ParticipantItem key={index}>
                    <ParticipantName $isGuest={isGuest}>
                      {displayName} {isGuest && '(guest - cannot vote)'}
                    </ParticipantName>
                    <ParticipantStatus $submitted={hasVoted}>
                      {hasVoted ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {hasVoted ? 'Voted' : 'Waiting'}
                    </ParticipantStatus>
                  </ParticipantItem>
                );
              })}
            </ParticipantsList>
            <FullWidthButton $primary onClick={onEdit}>
              <Flag size={20} />
              Finalize Activity
            </FullWidthButton>
          </OrganizerSection>
        )}

        <RecommendationsList>
          {[...pinnedActivities]
            .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
            .map((p) => (
              <ListItem key={p.id}>
                <ContentWrapper onClick={() => openDetail(p)}>
                  <ListTop>
                    <ListName>{p.title}</ListName>
                    <ListMeta>{p.price_range || "N/A"}</ListMeta>
                  </ListTop>
                  <ListBottom>
                    <div style={{ textAlign: 'left' }}>
                      <div>{p.hours || "N/A"}</div>
                      <div>{p.address || "N/A"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {user && (
                        <LikeButton
                          onClick={e => { e.stopPropagation(); handleLike(p); }}
                          $liked={(p.voters || []).some(v => v.id === user.id)}
                        >
                          {(p.voters || []).some(v => v.id === user.id) ? "❤️" : "🤍"} {(p.votes || []).length}
                        </LikeButton>
                      )}
                      {!user && (
                        <VoteCount>
                          ❤️ {(p.votes || []).length}
                        </VoteCount>
                      )}
                    </div>
                  </ListBottom>
                </ContentWrapper>
              </ListItem>
            ))}
        </RecommendationsList>

        {showDetailModal && selectedRec && (
          <ModalOverlay onClick={closeDetail}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{selectedRec.title || selectedRec.name}</ModalTitle>
                <CloseButton onClick={closeDetail}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <DetailGrid>
                  <DetailItem>
                    <DollarSign style={{ color: '#D4AF37' }} size={16} />
                    <DetailLabel>Price:</DetailLabel>
                    <DetailValue>{selectedRec.price_range || "N/A"}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <Clock size={16} />
                    <DetailLabel>Hours:</DetailLabel>
                    <DetailValue>{selectedRec.hours || "N/A"}</DetailValue>
                  </DetailItem>
                </DetailGrid>

                {selectedRec.description && (
                  <Section>
                    <SectionHeader>
                      <HelpCircle size={20} />
                      <SectionTitle>About</SectionTitle>
                    </SectionHeader>
                    <Description>
                      {selectedRec.description}
                      {selectedRec.website && (
                        <>
                          <br /><br />
                          <WebsiteLink href={selectedRec.website} target="_blank" rel="noopener noreferrer">
                            <Globe size={16} />
                            Visit Website
                            <ExternalLink size={14} />
                          </WebsiteLink>
                        </>
                      )}
                    </Description>
                  </Section>
                )}

                {selectedRec.reason && (
                  <Reason style={{ marginBottom: '1rem' }}>
                    <ReasonTitle>{activityText.reasonTitle}</ReasonTitle>
                    <ReasonText>{selectedRec.reason}</ReasonText>
                  </Reason>
                )}

                {selectedRec.address && (
                  <Section>
                    <SectionHeader>
                      <MapPin size={20} />
                      <SectionTitle>Location</SectionTitle>
                    </SectionHeader>
                    <Description>{selectedRec.address}</Description>

                    {GOOGLE_MAPS_API_KEY ? (
                      <div style={{ position: 'relative' }}>
                        {mapLoading && (
                          <MapLoadingContainer>
                            <MapLoadingSpinner />
                            <MapLoadingText>Loading map...</MapLoadingText>
                          </MapLoadingContainer>
                        )}
                        <GoogleMapContainer style={{ display: mapLoading ? 'none' : 'block' }}>
                          <iframe
                            title={`Map showing location of ${selectedRec.title || selectedRec.name}`}
                            src={generateGoogleMapsEmbedUrl(selectedRec.address, GOOGLE_MAPS_API_KEY)}
                            allowFullScreen
                            loading="lazy"
                            onLoad={() => {
                              console.log('Map iframe loaded');
                              setTimeout(() => setMapLoading(false), 500);
                            }}
                            onError={() => {
                              console.log('Map failed to load');
                              setMapLoading(false);
                            }}
                          />
                        </GoogleMapContainer>
                      </div>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: '0.75rem',
                        color: '#ffc107',
                        fontSize: '0.85rem',
                        marginTop: '1rem'
                      }}>
                        ⚠️ Google Maps API key not found. Check your environment variables.
                      </div>
                    )}
                  </Section>
                )}

                {(selectedRec.photos || []).length > 0 && (
                  <Section>
                    <SectionHeader>
                      <span>📸</span>
                      <SectionTitle>Photos</SectionTitle>
                    </SectionHeader>
                    <PhotoGallery>
                      {(selectedRec.photos || []).map((p, i) => {
                        const src = p.photo_reference
                          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`
                          : p;
                        return <Photo key={i} src={src} alt="" />;
                      })}
                    </PhotoGallery>
                  </Section>
                )}
              </ModalBody>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Container>
    );
  }

  if (finalized) {
    return (
      <Container>
        <TopBar>
          <Heading>{activityText.finalizedTitle}</Heading>
        </TopBar>

        <PhaseIndicator style={{ cursor: 'pointer' }} onClick={sharePlanUrlClick}>
          <PhaseIcon><Share size={24} /> </PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Share Finalized Activity Link!</PhaseTitle>
            <PhaseSubtitle>Click here to view & share finalized activity.</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        {error && <ErrorText>{error}</ErrorText>}

        <RecommendationsList>
          {[...pinnedActivities]
            .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
            .map((p) => {
              const isSelected = p.id === selected_pinned_activity_id;
              return (
                <ListItem key={p.id} $selected={isSelected}>
                  {isSelected && (
                    <SelectedBadge>
                      <CheckCircle size={16} />
                      <span>SELECTED</span>
                    </SelectedBadge>
                  )}
                  <ContentWrapper onClick={() => openDetail(p)}>
                    <ListTop>
                      <ListName>{p.title}</ListName>
                      <ListMeta>{p.price_range || "N/A"}</ListMeta>
                    </ListTop>
                    <ListBottom>
                      <div style={{ textAlign: 'left' }}>
                        <div>{p.hours || "N/A"}</div>
                        <div>{p.address || "N/A"}</div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <VoteCount>
                          ❤️ {(p.votes || []).length}
                        </VoteCount>
                      </div>
                    </ListBottom>
                  </ContentWrapper>
                </ListItem>
              );
            })}
        </RecommendationsList>

        {showDetailModal && selectedRec && (
          <ModalOverlay onClick={closeDetail}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{selectedRec.title || selectedRec.name}</ModalTitle>
                <CloseButton onClick={closeDetail}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <DetailGrid>
                  <DetailItem>
                    <DollarSign style={{ color: '#D4AF37' }} size={16} />
                    <DetailLabel>Price:</DetailLabel>
                    <DetailValue>{selectedRec.price_range || "N/A"}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <Clock size={16} />
                    <DetailLabel>Hours:</DetailLabel>
                    <DetailValue>{selectedRec.hours || "N/A"}</DetailValue>
                  </DetailItem>
                </DetailGrid>

                {selectedRec.description && (
                  <Section>
                    <SectionHeader>
                      <HelpCircle size={20} />
                      <SectionTitle>About</SectionTitle>
                    </SectionHeader>
                    <Description>
                      {selectedRec.description}
                      {selectedRec.website && (
                        <>
                          <br /><br />
                          <WebsiteLink href={selectedRec.website} target="_blank" rel="noopener noreferrer">
                            <Globe size={16} />
                            Visit Website
                            <ExternalLink size={14} />
                          </WebsiteLink>
                        </>
                      )}
                    </Description>
                  </Section>
                )}

                {selectedRec.address && (
                  <Section>
                    <SectionHeader>
                      <MapPin size={20} />
                      <SectionTitle>Location</SectionTitle>
                    </SectionHeader>
                    <Description>{selectedRec.address}</Description>

                    {GOOGLE_MAPS_API_KEY ? (
                      <div style={{ position: 'relative' }}>
                        {mapLoading && (
                          <MapLoadingContainer>
                            <MapLoadingSpinner />
                            <MapLoadingText>Loading map...</MapLoadingText>
                          </MapLoadingContainer>
                        )}
                        <GoogleMapContainer style={{ display: mapLoading ? 'none' : 'block' }}>
                          <iframe
                            title={`Map showing location of ${selectedRec.title || selectedRec.name}`}
                            src={generateGoogleMapsEmbedUrl(selectedRec.address, GOOGLE_MAPS_API_KEY)}
                            allowFullScreen
                            loading="lazy"
                            onLoad={() => {
                              console.log('Map iframe loaded');
                              setTimeout(() => setMapLoading(false), 500);
                            }}
                            onError={() => {
                              console.log('Map failed to load');
                              setMapLoading(false);
                            }}
                          />
                        </GoogleMapContainer>
                      </div>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: '0.75rem',
                        color: '#ffc107',
                        fontSize: '0.85rem',
                        marginTop: '1rem'
                      }}>
                        ⚠️ Google Maps API key not found. Check your environment variables.
                      </div>
                    )}
                  </Section>
                )}

                {selectedRec.reason && (
                  <Reason style={{ marginBottom: '1rem' }}>
                    <ReasonTitle>{activityText.reasonTitle}</ReasonTitle>
                    <ReasonText>{selectedRec.reason}</ReasonText>
                  </Reason>
                )}

                {(selectedRec.photos || []).length > 0 && (
                  <Section>
                    <SectionHeader>
                      <span>📸</span>
                      <SectionTitle>Photos</SectionTitle>
                    </SectionHeader>
                    <PhotoGallery>
                      {(selectedRec.photos || []).map((p, i) => {
                        const src = p.photo_reference
                          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`
                          : p;
                        return <Photo key={i} src={src} alt="" />;
                      })}
                    </PhotoGallery>
                  </Section>
                )}
              </ModalBody>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <TopBar>
        <Heading>{activityText.planningTitle}</Heading>
      </TopBar>
      <p>Activity is not in collecting or voting phase.</p>
    </Container>
  );
}