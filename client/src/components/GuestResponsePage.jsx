import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from 'styled-components';
import CuisineChat from "../admincomponents/CuisineChat";
import BarChat from "../cocktails/BarChat";
import GameNightPreferenceChat from "../gamenight/GameNightPreferenceChat";
import LetsMeetScheduler from "../letsmeet/LetsMeetScheduler";
import LoadingScreenUser from "../admincomponents/LoadingScreenUser.js";
import { HelpCircle, CheckCircle, BookHeart, AlertCircle, ArrowRight, Calendar, MessageSquare, User } from 'lucide-react';

const fadeInNoTransform = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const FullScreenBackground = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #1A1625 0%, #2D1B47 100%);
  animation: ${fadeInNoTransform} 0.8s ease-in-out;
`;

const Navbar = styled.nav`
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(26, 22, 37, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(147, 51, 234, 0.2);
`;

const NavbarContainer = styled.div`
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  
  @media (max-width: 768px) {
    max-width: 480px;
  }
  
  @media (max-width: 480px) {
    max-width: 420px;
  }
`;

const Logo = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  
  img {
    height: 40px;
    filter: brightness(1.1);
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const NavLink = styled.a`
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(147, 51, 234, 0.1);
  border: 1px solid rgba(147, 51, 234, 0.2);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 14px;
  
  &:hover {
    background: rgba(147, 51, 234, 0.2);
    border-color: rgba(147, 51, 234, 0.4);
    transform: translateY(-1px);
  }
`;

const Container = styled.div`
  max-width: 640px;
  margin: 0 auto;
  color: #fff;
  padding: 3rem 2rem;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    max-width: 480px;
    padding: 2rem 1rem;
  }
  
  @media (max-width: 480px) {
    max-width: 420px;
    padding: 1rem 0.75rem;
  }
`;

const TopBar = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Heading = styled.h1`
  font-family: 'Montserrat', sans-serif;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #FFFFFF;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
  
  @media (max-width: 480px) {
    font-size: 26px;
  }
`;

const Subheading = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.6;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const ActivityCard = styled.div`
  background: rgba(147, 51, 234, 0.05);
  border: 1px solid rgba(147, 51, 234, 0.15);
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  text-align: center;
  backdrop-filter: blur(10px);
  
  @media (max-width: 768px) {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const OrganizerTitle = styled.h3`
  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #FFFFFF;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ActivityDetail = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
`;

const ProfilePicture = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 16px;
  border: 3px solid rgba(147, 51, 234, 0.3);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.2);
`;

const ProfileInitial = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9333EA, #7C3AED);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 24px;
  font-weight: 700;
  color: white;
  border: 3px solid rgba(147, 51, 234, 0.3);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.2);
`;

const PreferencesCard = styled.div`
  background: #1A1625;
  border: 1px solid rgba(147, 51, 234, 0.2);
  padding: 32px;
  border-radius: 24px;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #9333EA, #7C3AED, #6B21A8);
  }
  
  @media (max-width: 768px) {
    padding: 28px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 24px;
  }
`;

const PreferencesIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: #A855F7;
`;

const PreferencesTitle = styled.h3`
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  margin: 0 0 16px 0;
  font-weight: 600;
  color: #FFFFFF;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const PreferencesText = styled.p`
  margin: 0 0 20px 0;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  font-size: 15px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const PreferencesButton = styled.button`
  background: linear-gradient(135deg, #9333EA, #7C3AED);
  color: #FFFFFF;
  border: none;
  padding: 14px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);
  
  &:hover {
    background: linear-gradient(135deg, #7C3AED, #6B21A8);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(147, 51, 234, 0.5);
  }
`;

const SubmittedCard = styled.div`
  background: #1A1625;
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 32px;
  border-radius: 24px;
  margin-bottom: 24px;
  text-align: left;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #28a745, #5cb85c);
  }
  
  @media (max-width: 768px) {
    padding: 28px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 24px;
  }
`;

const SubmittedTitle = styled.h3`
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #28a745;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const SubmittedText = styled.p`
  margin: 0 0 20px 0;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  font-size: 15px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ResubmitButton = styled.button`
  background: rgba(147, 51, 234, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(147, 51, 234, 0.3);
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(147, 51, 234, 0.2);
    border-color: rgba(147, 51, 234, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(147, 51, 234, 0.3);
  }
`;

const ErrorCard = styled.div`
  background: #1A1625;
  border: 1px solid rgba(220, 53, 69, 0.3);
  padding: 32px;
  border-radius: 24px;
  margin-bottom: 24px;
  text-align: left;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #dc3545, #c82333);
  }
  
  @media (max-width: 768px) {
    padding: 28px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 24px;
  }
`;

const ErrorTitle = styled.h3`
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #dc3545;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const ErrorText = styled.p`
  margin: 0 0 20px 0;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  font-size: 15px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #9333EA, #7C3AED);
  color: #FFFFFF;
  border: none;
  padding: 14px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);
  
  &:hover {
    background: linear-gradient(135deg, #7C3AED, #6B21A8);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(147, 51, 234, 0.5);
  }
`;

const DimOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 997;
`;

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-size: 14px;
  margin-top: 20px;
  line-height: 1.6;
`;

export default function GuestResponsePage() {
  const { activityId, token } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [guestEmail, setGuestEmail] = useState(null);
  const [existingResponse, setExistingResponse] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
  
  // Determine the app base URL based on environment
  const getAppBaseUrl = () => {
    if (window.location.hostname.includes('heyvoxxy.com')) {
      return 'https://www.heyvoxxy.com';
    } else if (window.location.hostname.includes('voxxyai.com')) {
      return 'https://www.voxxyai.com';
    }
    return 'http://localhost:3000';
  };

  const getActivityTypeInfo = (activityType) => {
    const activityTypes = {
      'Restaurant': { 
        emoji: '🍜', 
        title: 'Restaurant',
        description: 'Find the perfect spot that satisfies everyone\'s cravings & dietary needs!' 
      },
      'Cocktails': { 
        emoji: '🍸', 
        title: 'Cocktails',
        description: 'Discover the ideal bar that matches your group\'s vibe & budget!' 
      },
      'Game Night': { 
        emoji: '🎮', 
        title: 'Game Night',
        description: 'Find the perfect games for you & your group!' 
      },
      'Meeting': { 
        emoji: '⏰', 
        title: 'Meeting',
        description: 'Find a time that works for everyone\'s schedule!' 
      },
      'Night Out': { 
        emoji: '🎉', 
        title: 'Night Out',
        description: 'Plan the perfect night out that everyone will love!' 
      }
    };

    return activityTypes[activityType] || { 
      emoji: '🎉', 
      title: 'Activity',
      description: 'Join this group activity!' 
    };
  };

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
      setIsExistingUser(data.is_existing_user || false);
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
    fetchGuestData();
  };

  const renderChatComponent = () => {
    const commonProps = {
      activityId,
      onClose: () => setShowChat(false),
      guestMode: true,
      guestToken: token,
      guestEmail: guestEmail,
      onChatComplete: handleChatComplete
    };

    switch (activity?.activity_type) {
      case 'Meeting':
        return (
          <LetsMeetScheduler
            {...commonProps}
            currentActivity={activity}
            responseSubmitted={submissionSuccess}
          />
        );
      case 'Cocktails':
        return (
          <BarChat
            {...commonProps}
            guestActivity={activity}
          />
        );
      case 'Game Night':
        return (
          <GameNightPreferenceChat
            {...commonProps}
            guestActivity={activity}
          />
        );
      case 'Restaurant':
      default:
        return (
          <CuisineChat
            {...commonProps}
            guestActivity={activity}
          />
        );
    }
  };

  const handleCreateAccountOrLogin = () => {
    if (isExistingUser) {
      navigate(`/login?invited_email=${encodeURIComponent(guestEmail)}&activity_id=${activityId}`);
    } else {
      navigate(`/signup?invited_email=${encodeURIComponent(guestEmail)}&activity_id=${activityId}`);
    }
  };

  if (loading) {
    return <LoadingScreenUser autoDismiss={false} />;
  }

  const appBaseUrl = getAppBaseUrl();

  if (error) {
    return (
      <FullScreenBackground>
        <Navbar>
          <NavbarContainer>
            <Logo href={`${appBaseUrl}/`}>
              <img src="/HEADER.svg" alt="Voxxy logo" />
            </Logo>
            <NavLinks>
              <NavLink href={`${appBaseUrl}/#/login`}>Login</NavLink>
              <NavLink href={`${appBaseUrl}/#/signup`}>Signup</NavLink>
            </NavLinks>
          </NavbarContainer>
        </Navbar>
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
        <Navbar>
          <NavbarContainer>
            <Logo href={`${appBaseUrl}/`}>
              <img src="/HEADER.svg" alt="Voxxy logo" />
            </Logo>
            <NavLinks>
              <NavLink href={`${appBaseUrl}/#/login`}>Login</NavLink>
              <NavLink href={`${appBaseUrl}/#/signup`}>Signup</NavLink>
            </NavLinks>
          </NavbarContainer>
        </Navbar>
        <Container>
          <TopBar>
            <Heading>Activity Not Found</Heading>
            <Subheading>This activity may no longer be available</Subheading>
          </TopBar>
        </Container>
      </FullScreenBackground>
    );
  }

  const activityInfo = getActivityTypeInfo(activity.activity_type);

  return (
    <FullScreenBackground>
      <Navbar>
        <NavbarContainer>
          <Logo href={`${appBaseUrl}/`}>
            <img src="/HEADER.svg" alt="Voxxy logo" />
          </Logo>
          <NavLinks>
            <NavLink href={`${appBaseUrl}/#/login`}>Login</NavLink>
            <NavLink href={`${appBaseUrl}/#/signup`}>Signup</NavLink>
          </NavLinks>
        </NavbarContainer>
      </Navbar>
      <Container>
        <TopBar>
          <Heading>
            {activityInfo.emoji} Share Your {activity.activity_type === 'Restaurant' ? 'Food' : activity.activity_type === 'Cocktails' ? 'Bar' : activity.activity_type === 'Game Night' ? 'Game' : 'Schedule'} Preferences
          </Heading>
          <Subheading>
            {activityInfo.description}
          </Subheading>
        </TopBar>

        <ActivityCard>
          {(activity.user?.profile_pic_url || activity.user?.avatar) ? (
            <ProfilePicture 
              src={activity.user.profile_pic_url || activity.user.avatar} 
              alt={`${activity.user.name}'s profile`}
            />
          ) : (
            <ProfileInitial>
              {(activity.user?.name || 'Y').charAt(0).toUpperCase()}
            </ProfileInitial>
          )}
          <OrganizerTitle>
            {activity.user?.name || 'Your friend'} wants your input!
          </OrganizerTitle>
          <ActivityDetail style={{ 
            textAlign: 'center', 
            marginTop: '12px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Responding as: <span style={{ color: '#A855F7', fontWeight: '500' }}>{guestEmail}</span>
          </ActivityDetail>
        </ActivityCard>

        {submissionSuccess && (
          <SubmittedCard>
            <SubmittedTitle>
              <CheckCircle size={24} />
              Response Submitted Successfully! 🎉
            </SubmittedTitle>
            <SubmittedText>
              Thank you for submitting your {activity?.activity_type === 'Meeting' ? 'availability' : 'preferences'}! {isExistingUser && 'You have also accepted the invitation to this activity. '}The organizer will gather everyone's responses and send you the final {activity?.activity_type === 'Meeting' ? 'meeting details' : 'plans'} soon.
            </SubmittedText>
          </SubmittedCard>
        )}

        {!existingResponse && !submissionSuccess ? (
          <PreferencesCard>
            {(activity.activity_type === 'Restaurant' || activity.activity_type === 'Cocktails' || activity.activity_type === 'Game Night') && (
              <>
                <PreferencesIcon>
                  <BookHeart size={48} />
                </PreferencesIcon>
                <PreferencesTitle>
                  {isExistingUser ? 'Submit Preferences & Accept Invite!' : 'Submit Your Preferences!'}
                </PreferencesTitle>
                <PreferencesText>
                  Help the group find the perfect {
                    activity.activity_type === 'Restaurant' ? 'restaurant' :
                      activity.activity_type === 'Cocktails' ? 'night out' :
                        'game night'
                  } by sharing your preferences{activity.activity_type === 'Restaurant' ? ', dietary needs, and budget' :
                    activity.activity_type === 'Game Night' ? ' and favorite games' : ' and budget'}.
                  {isExistingUser && ' This will also accept the invitation to the activity & your response will be associated with your existing Voxxy account.'}
                </PreferencesText>
                <PreferencesButton onClick={handleStartChat}>
                  <HelpCircle size={20} />
                  {isExistingUser ? 'Submit & Accept' : 'Start Preferences Quiz'}
                </PreferencesButton>
              </>
            )}
            {activity.activity_type === 'Meeting' && (
              <>
                <PreferencesIcon>
                  <Calendar size={48} />
                </PreferencesIcon>
                <PreferencesTitle>
                  {isExistingUser ? 'Submit Availability & Accept Invite!' : 'Submit Your Availability!'}
                </PreferencesTitle>
                <PreferencesText>
                  Help the group find the perfect time to meet by sharing your availability.
                  {isExistingUser && ' This will also accept the invitation to the activity& your response will be associated with your existing Voxxy account.'}
                </PreferencesText>
                <PreferencesButton onClick={handleStartChat}>
                  <Calendar size={20} />
                  {isExistingUser ? 'Submit & Accept' : 'Share Availability'}
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
              You've already submitted your {activity?.activity_type === 'Lets Meet' ? 'availability' : 'preferences'}. The organizer will send final details once everyone has responded. You can update your response if needed.
            </SubmittedText>
            <ResubmitButton onClick={handleStartChat}>
              <MessageSquare size={18} />
              Update Response
            </ResubmitButton>
          </SubmittedCard>
        ) : null}

        <InfoText>
          {isExistingUser ? (
            <>
              Already have an account with this email?
              <br />
              <ActionButton onClick={handleCreateAccountOrLogin} style={{ marginTop: '1rem' }}>
                <User size={16} />
                Log In
              </ActionButton>
            </>
          ) : (
            <>
              Want to create an account to manage all your activities?
              <br />
              <ActionButton onClick={handleCreateAccountOrLogin} style={{ marginTop: '1rem' }}>
                Create Free Account
              </ActionButton>
            </>
          )}
        </InfoText>

        {showChat && (
          <>
            <DimOverlay onClick={() => setShowChat(false)} />
            {renderChatComponent()}
          </>
        )}
      </Container>
    </FullScreenBackground>
  );
}