import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from 'styled-components';
import CuisineChat from "../admincomponents/CuisineChat";
import LetsMeetScheduler from "../letsmeet/LetsMeetScheduler";
import LoadingScreenUser from "../admincomponents/LoadingScreenUser.js";
import { HelpCircle, CheckCircle, BookHeart, AlertCircle, ArrowRight, Calendar } from 'lucide-react';

const fadeInNoTransform = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const FullScreenBackground = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  animation: ${fadeInNoTransform} 0.8s ease-in-out;
`;

const Container = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  color: #fff;
  padding: 120px 1rem 2rem;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 110px 1rem 2rem;
  }
`;

const TopBar = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Heading = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  background: #fff;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subheading = styled.p`
  font-size: 1.1rem;
  color: #ccc;
  margin: 0;
  line-height: 1.4;
`;

const ActivityCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  text-align: left;
  backdrop-filter: blur(10px);
`;

const ActivityName = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  text-align: center;
`;

const ActivityDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #ccc;
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const ActivityDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
`;

const PreferencesCard = styled.div`
  background: linear-gradient(135deg, #9051e1 0%, #cc31e8 100%);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(204, 49, 232, 0.3);
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
  text-align: left;
  backdrop-filter: blur(10px);
`;

const SubmittedTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  color: #28a745;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const SubmittedText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #ccc;
  line-height: 1.6;
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

const ErrorCard = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  text-align: left;
  backdrop-filter: blur(10px);
`;

const ErrorTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  color: #dc3545;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const ErrorText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #ccc;
  line-height: 1.6;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
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
    background: linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(204, 49, 232, 0.3);
  }
`;

const DimOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 997;
`;

const InfoText = styled.p`
  color: #ccc;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 2rem;
  line-height: 1.5;
`;

export default function GuestResponsePage() {
  const { activityId, token } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [guestEmail, setGuestEmail] = useState(null);
  const [existingResponse, setExistingResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const fetchGuestData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/activities/${activityId}/respond/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Invalid invitation link. The link may have expired or been used already.");
        } else {
          setError("Unable to load activity information. Please try again later.");
        }
        return;
      }

      const data = await response.json();
      setActivity(data.activity);
      setGuestEmail(data.participant_email);
      setExistingResponse(data.existing_response);
    } catch (err) {
      console.error("Error fetching guest data:", err);
      setError("Unable to connect to the server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, activityId, token]);

  useEffect(() => {
    fetchGuestData();
  }, [fetchGuestData]);

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleChatComplete = () => {
    setShowChat(false);
    setSubmissionSuccess(true);
    // Refresh data to get updated response
    fetchGuestData();
  };

  const handleCreateAccount = () => {
    // Navigate to signup with activity context
    navigate(`/signup?invited_email=${encodeURIComponent(guestEmail)}&activity_id=${activityId}`);
  };

  if (loading) {
    return <LoadingScreenUser autoDismiss={false} />;
  }

  if (error) {
    return (
      <FullScreenBackground>
        <Container>
          <TopBar>
            <Heading>Oops!</Heading>
            <Subheading>There was a problem with your invitation</Subheading>
          </TopBar>

          <ErrorCard>
            <ErrorTitle>
              <AlertCircle size={24} />
              Unable to Load Invitation
            </ErrorTitle>
            <ErrorText>{error}</ErrorText>
            <ActionButton onClick={() => navigate('/')}>
              <ArrowRight size={16} />
              Go to Voxxy Home
            </ActionButton>
          </ErrorCard>
        </Container>
      </FullScreenBackground>
    );
  }

  if (!activity) {
    return (
      <FullScreenBackground>
        <Container>
          <TopBar>
            <Heading>Activity Not Found</Heading>
            <Subheading>This activity may no longer be available</Subheading>
          </TopBar>
        </Container>
      </FullScreenBackground>
    );
  }

  return (
    <FullScreenBackground>
      <Container>
        <TopBar>
          <Heading>
            {activity?.activity_type === 'Meeting' ? '👥 You\'re Invited to Meet!' : '🍽️ You\'re Invited!'}
          </Heading>
          <Subheading>
            {activity?.activity_type === 'Meeting'
              ? 'Share your availability for the group'
              : 'Submit your food preferences for the group'
            }
          </Subheading>
        </TopBar>

        <ActivityCard>
          <ActivityName>{activity.activity_name}</ActivityName>
          <ActivityDetails>
            {activity.activity_location && (
              <ActivityDetail>
                📍 {activity.activity_location}
              </ActivityDetail>
            )}
            {activity.date_notes && (
              <ActivityDetail>
                📅 {activity.date_notes}
              </ActivityDetail>
            )}
            <ActivityDetail>
              👤 Responding as: {guestEmail}
            </ActivityDetail>
          </ActivityDetails>
        </ActivityCard>

        {submissionSuccess && (
          <SubmittedCard>
            <SubmittedTitle>
              <CheckCircle size={24} />
              Response Submitted Successfully! 🎉
            </SubmittedTitle>
            <SubmittedText>
              Thank you for submitting your {activity?.activity_type === 'Meeting' ? 'availability' : 'preferences'}! The organizer will gather everyone's responses and send you the final {activity?.activity_type === 'Meeting' ? 'meeting details' : 'restaurant options'} soon.
            </SubmittedText>
          </SubmittedCard>
        )}

        {!existingResponse && !submissionSuccess ? (
          <PreferencesCard>
            {activity.activity_type === 'Restaurant' && (
              <>
                <PreferencesIcon>
                  <BookHeart size={48} />
                </PreferencesIcon>
                <PreferencesTitle>Submit Your Food Preferences!</PreferencesTitle>
                <PreferencesText>
                  Help the group find the perfect restaurant by sharing your cuisine preferences, dietary needs, and budget.
                </PreferencesText>
                <PreferencesButton onClick={handleStartChat}>
                  <HelpCircle size={20} />
                  Start Preferences Quiz
                </PreferencesButton>
              </>
            )}
            {activity.activity_type === 'Meeting' && (
              <>
                <PreferencesIcon>
                  <Calendar size={48} />
                </PreferencesIcon>
                <PreferencesTitle>Submit Your Availability!</PreferencesTitle>
                <PreferencesText>
                  Help the group find the perfect time to meet by sharing your availability.
                </PreferencesText>
                <PreferencesButton onClick={handleStartChat}>
                  <HelpCircle size={20} />
                  Start Preferences Quiz
                </PreferencesButton>
              </>
            )}

          </PreferencesCard>
        ) : existingResponse && !submissionSuccess ? (
          <SubmittedCard>
            <SubmittedTitle>
              <CheckCircle size={24} />
              Thank you for your response!
            </SubmittedTitle>
            <SubmittedText>
              You've already submitted your preferences. The organizer will send final details once everyone has responded. You can update your preferences if needed.
            </SubmittedText>
            <ResubmitButton onClick={handleStartChat}>
              <HelpCircle size={18} />
              Update Preferences
            </ResubmitButton>
          </SubmittedCard>
        ) : null}

        <InfoText>
          Want to create an account to manage all your activities?
          <br />
          <ActionButton onClick={handleCreateAccount} style={{ marginTop: '1rem' }}>
            Create Free Account
          </ActionButton>
        </InfoText>

        {showChat && (
          <>
            <DimOverlay onClick={() => setShowChat(false)} />
            {activity?.activity_type === 'Meeting' ? (
              <LetsMeetScheduler
                activityId={activityId}
                currentActivity={activity}
                responseSubmitted={submissionSuccess}
                onClose={() => setShowChat(false)}
                guestMode={true}
                guestToken={token}
                guestEmail={guestEmail}
                onChatComplete={handleChatComplete}
              />
            ) : (
              <CuisineChat
                activityId={activityId}
                guestMode={true}
                guestToken={token}
                guestEmail={guestEmail}
                guestActivity={activity}
                onClose={() => setShowChat(false)}
                onChatComplete={handleChatComplete}
              />
            )}
          </>
        )}
      </Container>
    </FullScreenBackground>
  );
}