import React, { useContext, useState } from "react";
import styled, { keyframes } from "styled-components";
import { UserContext } from "../context/user";
import Woman from "../assets/Woman.jpg";
import NoCommunityMembers from "./NoCommunityMembers";
import { Users, Calendar, Utensils, X } from "lucide-react";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const cardHover = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
    box-shadow: 0 8px 32px rgba(207, 56, 221, 0.2);
  }
  50% {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 16px 48px rgba(207, 56, 221, 0.4);
  }
`;

const avatarPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(207, 56, 221, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(207, 56, 221, 0.1);
  }
`;

const modalSlideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

export default function YourCommunity({ showInvitePopup, onSelectUser, onCreateBoard }) {
  const { user } = useContext(UserContext);
  const [showAll, setShowAll] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Helper function to get display image with proper priority
  const getDisplayImage = (userObj) => {
    if (userObj?.profile_pic_url) {
      const profilePicUrl = userObj.profile_pic_url.startsWith('http')
        ? userObj.profile_pic_url
        : `${API_URL}${userObj.profile_pic_url}`;
      return profilePicUrl;
    }
    return userObj?.avatar || Woman;
  };

  if (!user) return null;

  const allUsersMap = new Map();

  // Process user's activities
  user.activities?.forEach(act => {
    act.participants?.forEach(p => {
      if (p.id !== user.id) {
        const existing = allUsersMap.get(p.id) || {
          user: p,
          lastDate: null,
          lastName: '',
          count: 0,
          sharedActivities: [],
          recentRestaurants: [],
          firstActivity: null
        };
        existing.count += 1;
        existing.sharedActivities.push({
          name: act.activity_name,
          type: act.activity_type,
          emoji: act.emoji,
          date: act.date_day
        });

        const selectedPin = act.pinned_activities?.find(pin => pin.selected);
        if (selectedPin && act.activity_type === 'Dining') {
          existing.recentRestaurants.push({
            name: selectedPin.name,
            rating: selectedPin.rating,
            date: act.date_day
          });
        }

        const date = new Date(act.date_day);
        if (!existing.lastDate || date > existing.lastDate) {
          existing.lastDate = date;
          existing.lastName = act.activity_name;
        }
        if (!existing.firstActivity || date < new Date(existing.firstActivity)) {
          existing.firstActivity = act.date_day;
        }
        allUsersMap.set(p.id, existing);
      }
    });
  });

  // Process participant activities
  user.participant_activities?.forEach(pa => {
    const { activity: act } = pa;
    const host = act.user;
    if (host?.id !== user.id) {
      const existing = allUsersMap.get(host.id) || {
        user: host,
        lastDate: null,
        lastName: '',
        count: 0,
        sharedActivities: [],
        recentRestaurants: [],
        firstActivity: null
      };
      existing.count += 1;
      existing.sharedActivities.push({
        name: act.activity_name,
        type: act.activity_type,
        emoji: act.emoji,
        date: act.date_day
      });

      const selectedPin = act.pinned_activities?.find(pin => pin.selected);
      if (selectedPin && act.activity_type === 'Dining') {
        existing.recentRestaurants.push({
          name: selectedPin.name,
          rating: selectedPin.rating,
          date: act.date_day
        });
      }

      const date = new Date(act.date_day);
      if (!existing.lastDate || date > existing.lastDate) {
        existing.lastDate = date;
        existing.lastName = act.activity_name;
      }
      if (!existing.firstActivity || date < new Date(existing.firstActivity)) {
        existing.firstActivity = act.date_day;
      }
      allUsersMap.set(host.id, existing);
    }

    act.participants?.forEach(p => {
      if (p.id !== user.id) {
        const existing = allUsersMap.get(p.id) || {
          user: p,
          lastDate: null,
          lastName: '',
          count: 0,
          sharedActivities: [],
          recentRestaurants: [],
          firstActivity: null
        };
        existing.count += 1;
        existing.sharedActivities.push({
          name: act.activity_name,
          type: act.activity_type,
          emoji: act.emoji,
          date: act.date_day
        });

        const selectedPin = act.pinned_activities?.find(pin => pin.selected);
        if (selectedPin && act.activity_type === 'Dining') {
          existing.recentRestaurants.push({
            name: selectedPin.name,
            rating: selectedPin.rating,
            date: act.date_day
          });
        }

        const date = new Date(act.date_day);
        if (!existing.lastDate || date > existing.lastDate) {
          existing.lastDate = date;
          existing.lastName = act.activity_name;
        }
        if (!existing.firstActivity || date < new Date(existing.firstActivity)) {
          existing.firstActivity = act.date_day;
        }
        allUsersMap.set(p.id, existing);
      }
    });
  });

  function formatSince(dateString) {
    if (!dateString) return 'Jan 2024';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  }

  const community = Array.from(allUsersMap.values())
    .sort((a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name));

  if (community.length === 0) return <NoCommunityMembers onCreateBoard={onCreateBoard} />;

  const displayed = showAll ? community : community.slice(0, 4);

  function handleCardClick(peerData) {
    if (showInvitePopup && onSelectUser) {
      onSelectUser(peerData.user);
    } else {
      setSelectedPeer(peerData);
    }
  }

  return (
    <Wrapper>
      <Header>
        <TitleText>Your Voxxy Crew</TitleText>
        <Subtitle>Friends you've shared adventures with</Subtitle>
      </Header>

      <GridContainer>
        <Grid>
          {displayed.map(peerData => (
            <Card
              key={peerData.user.id}
              onClick={() => handleCardClick(peerData)}
            >
              <CardContent>
                <Avatar
                  src={getDisplayImage(peerData.user)}
                  alt={peerData.user.name}
                />
                <UserName>{peerData.user.name}</UserName>
                <ActivityCount>
                  {peerData.count} {peerData.count === 1 ? 'activity' : 'activities'}
                </ActivityCount>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </GridContainer>

      {community.length > 4 && (
        <ViewAllButton onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show Less' : `View All ${community.length} Members`}
        </ViewAllButton>
      )}

      {selectedPeer && !showInvitePopup && (
        <ModalOverlay onClick={() => setSelectedPeer(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setSelectedPeer(null)}>
              <X size={20} />
            </CloseButton>

            <ModalHeader>
              <LargeAvatarContainer>
                <LargeAvatar
                  src={getDisplayImage(selectedPeer.user)}
                  alt={selectedPeer.user.name}
                />
              </LargeAvatarContainer>
              <UserDetails>
                <PeerName>{selectedPeer.user.name}</PeerName>
                <JoinDate>
                  <Calendar size={14} /> Voxxing since {formatSince(selectedPeer.firstActivity)}
                </JoinDate>
                <ActivityCountDetail>
                  <Users size={14} /> {selectedPeer.count} shared activities
                </ActivityCountDetail>
              </UserDetails>
            </ModalHeader>

            {selectedPeer.recentRestaurants.length > 0 && (
              <Section>
                <SectionTitle>
                  <Utensils size={16} />
                  Recent Restaurant Picks
                </SectionTitle>
                <RestaurantList>
                  {selectedPeer.recentRestaurants
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 3)
                    .map((restaurant, idx) => (
                      <RestaurantItem key={idx}>
                        <RestaurantName>{restaurant.name}</RestaurantName>
                        <RestaurantMeta>
                          {restaurant.rating && <span>⭐ {restaurant.rating}</span>}
                          <span>{formatDate(restaurant.date)}</span>
                        </RestaurantMeta>
                      </RestaurantItem>
                    ))}
                </RestaurantList>
              </Section>
            )}

            <Section>
              <SectionTitle>
                <Calendar size={16} />
                Shared Activities ({selectedPeer.count})
              </SectionTitle>
              <ActivitiesList>
                {selectedPeer.sharedActivities
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                  .map((activity, idx) => (
                    <ActivityItem key={idx}>
                      <ActivityEmoji>{activity.emoji}</ActivityEmoji>
                      <ActivityDetails>
                        <ActivityName>{activity.name}</ActivityName>
                        <ActivityMeta>{activity.type} • {formatDate(activity.date)}</ActivityMeta>
                      </ActivityDetails>
                    </ActivityItem>
                  ))}
                {selectedPeer.sharedActivities.length > 5 && (
                  <MoreActivities>
                    +{selectedPeer.sharedActivities.length - 5} more activities
                  </MoreActivities>
                )}
              </ActivitiesList>
            </Section>
          </ModalContent>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out;
  padding: 0 1rem;
`;

const Header = styled.div`
  padding: 2rem 0 1.5rem;
`;

const TitleText = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  background: linear-gradient(135deg, #f4f0f5, #d394f5, #cf38dd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  color: #d8cce2;
  margin: 0.5rem 0 0;
  font-weight: 400;
  opacity: 0.9;
`;

const GridContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 400px;
  width: 100%;
  
  @media (max-width: 480px) {
    gap: 1rem;
    max-width: 320px;
  }
`;

const Card = styled.div`
  aspect-ratio: 1;
  background: linear-gradient(135deg, 
    rgba(42, 30, 46, 0.7), 
    rgba(64, 51, 71, 0.8)
  );
  backdrop-filter: blur(20px);
  border: 2px solid rgba(207, 56, 221, 0.3);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(207, 56, 221, 0.15);
  position: relative;
  overflow: hidden;

  &:hover {
    animation: ${cardHover} 0.6s ease-out;
    border-color: rgba(207, 56, 221, 0.6);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #cf38dd, #d394f5, #b954ec);
    opacity: 0.8;
  }
`;

const CardContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.75rem;
  gap: 0.8rem;
`;

const Avatar = styled.img`
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid rgba(207, 56, 221, 0.6);
  background-color: #f4f0f5;
  transition: all 0.3s ease;
  animation: ${avatarPulse} 3s ease-in-out infinite;

  &:hover {
    transform: scale(1.1);
    border-color: rgba(207, 56, 221, 0.9);
  }
`;

const UserName = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #f4f0f5;
  margin: 0;
  text-align: center;
  line-height: 1.2;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  word-wrap: break-word;
  max-width: 100%;
`;

const ActivityCount = styled.div`
  font-size: 0.75rem;
  color: #d394f5;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
`;

const ViewAllButton = styled.button`
  margin: 2rem auto 1rem;
  display: block;
  background: linear-gradient(135deg, #cf38dd, #d394f5);
  border: 2px solid rgba(207, 56, 221, 0.4);
  color: #f4f0f5;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.8rem 2.5rem;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(207, 56, 221, 0.2);

  &:hover {
    background: linear-gradient(135deg, #bf2aca, #be7fdd);
    border-color: rgba(207, 56, 221, 0.6);
    box-shadow: 0 12px 32px rgba(207, 56, 221, 0.3);
    transform: translateY(-2px);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, 
    rgba(42, 30, 46, 0.95), 
    rgba(64, 51, 71, 0.95)
  );
  backdrop-filter: blur(20px);
  border: 2px solid rgba(207, 56, 221, 0.4);
  padding: 2rem;
  border-radius: 24px;
  max-width: 480px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 48px rgba(207, 56, 221, 0.3);
  animation: ${modalSlideIn} 0.3s ease-out;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: rgba(207, 56, 221, 0.2);
  border: 2px solid rgba(207, 56, 221, 0.4);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4f0f5;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(207, 56, 221, 0.4);
    border-color: rgba(207, 56, 221, 0.8);
    transform: scale(1.05);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1.5rem;
`;

const LargeAvatarContainer = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const LargeAvatar = styled.img`
  width: 85px;
  height: 85px;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid rgba(207, 56, 221, 0.8);
  background-color: #f4f0f5;
  box-shadow: 0 0 25px rgba(207, 56, 221, 0.5);
`;

const UserDetails = styled.div`
  flex: 1;
  text-align: left;
`;

const PeerName = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  color: #f4f0f5;
  margin: 0 0 0.5rem 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;

const JoinDate = styled.div`
  font-size: 0.85rem;
  color: #d8cce2;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
`;

const ActivityCountDetail = styled.div`
  font-size: 0.85rem;
  color: #d394f5;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  color: #f4f0f5;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #cf38dd;
  }
`;

const RestaurantList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RestaurantItem = styled.div`
  background: rgba(207, 56, 221, 0.1);
  border: 1px solid rgba(207, 56, 221, 0.2);
  border-radius: 12px;
  padding: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(207, 56, 221, 0.15);
    border-color: rgba(207, 56, 221, 0.3);
  }
`;

const RestaurantName = styled.div`
  font-weight: 600;
  color: #f4f0f5;
  margin-bottom: 0.25rem;
`;

const RestaurantMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #d8cce2;
`;

const ActivitiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(64, 51, 71, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(207, 56, 221, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(64, 51, 71, 0.7);
    border-color: rgba(207, 56, 221, 0.2);
  }
`;

const ActivityEmoji = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const ActivityDetails = styled.div`
  flex: 1;
  min-width: 0;
  text-align: left;
`;

const ActivityName = styled.div`
  font-weight: 600;
  color: #f4f0f5;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActivityMeta = styled.div`
  font-size: 0.75rem;
  color: #d8cce2;
`;

const MoreActivities = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: #cf38dd;
  font-style: italic;
  padding: 0.5rem;
`;