import React, { useContext, useState } from "react";
import styled, { keyframes } from "styled-components";
import { UserContext } from "../context/user";
import SmallTriangle from "../assets/SmallTriangle.png";
import Woman from "../assets/Woman.jpg";
import NoCommunityMembers from "./NoCommunityMembers";
import { Users, Calendar, MapPin, Utensils, Clock } from "lucide-react";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const cardHover = keyframes`
  0%, 100% {
    box-shadow: 0 4px 20px rgba(207, 56, 221, 0.15);
  }
  50% {
    box-shadow: 0 8px 32px rgba(207, 56, 221, 0.3);
  }
`;

const avatarGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(207, 56, 221, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(207, 56, 221, 0.7);
  }
`;

const badgeFloat = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
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
  const displayed = showAll ? community : community.slice(0, 3);

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
        <TitleText>Your Voxxy Crew 🎭</TitleText>
        <Subtitle>Friends you've gone on adventures with</Subtitle>
      </Header>

      <ScrollArea>
        <Grid>
          {displayed.map(peerData => (
            <Card
              key={peerData.user.id}
              onClick={() => handleCardClick(peerData)}
            >
              <CardHeader>
                <ProfileSection>
                  <Avatar
                    src={getDisplayImage(peerData.user)}
                    alt={peerData.user.name}
                  />
                  <UserInfo>
                    <PeerName>{peerData.user.name}</PeerName>
                    <JoinDate>
                      <Calendar size={12} /> Since {formatSince(peerData.firstActivity)}
                    </JoinDate>
                  </UserInfo>
                </ProfileSection>

                <ActivityBadge>
                  <span className="count">{peerData.count}</span>
                  <span className="label">Activities</span>
                </ActivityBadge>
              </CardHeader>

              <CardContent>
                {peerData.recentRestaurants.length > 0 && (
                  <RecentVenue>
                    <VenueIcon>
                      <MapPin size={14} />
                    </VenueIcon>
                    <VenueDetails>
                      <VenueName>{peerData.recentRestaurants[peerData.recentRestaurants.length - 1].name}</VenueName>
                      {peerData.recentRestaurants[peerData.recentRestaurants.length - 1].rating && (
                        <Rating>⭐ {peerData.recentRestaurants[peerData.recentRestaurants.length - 1].rating}</Rating>
                      )}
                    </VenueDetails>
                  </RecentVenue>
                )}

                <LastActivity>
                  <ActivityIcon>
                    <Clock size={14} />
                  </ActivityIcon>
                  <ActivityText>
                    Last: <em>{peerData.lastName}</em>
                  </ActivityText>
                </LastActivity>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </ScrollArea>

      {community.length > 3 && (
        <Toggle onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show Less' : `View All ${community.length} Members`}
        </Toggle>
      )}

      {selectedPeer && !showInvitePopup && (
        <ModalOverlay onClick={() => setSelectedPeer(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setSelectedPeer(null)}>×</CloseButton>

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
                <ActivityCount>
                  <Users size={14} /> {selectedPeer.count} shared activities
                </ActivityCount>
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
  text-align: left;
  animation: ${fadeIn} 0.8s ease-out;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: 3rem 1rem 1rem;
`;

const TitleText = styled.h2`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: bold;
  background: linear-gradient(135deg, #f4f0f5, #d394f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const Subtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #d8cce2;
  margin: 0.5rem 0 0;
  font-weight: 400;
`;

const ScrollArea = styled.div`
  overflow-y: auto;
  padding: 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const Card = styled.div`
  background: linear-gradient(135deg, 
    rgba(42, 30, 46, 0.95), 
    rgba(64, 51, 71, 0.9)
  );
  backdrop-filter: blur(12px);
  border: 2px solid rgba(207, 56, 221, 0.25);
  border-radius: 24px;
  padding: 0;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(207, 56, 221, 0.1);
  overflow: hidden;
  position: relative;

  &:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(207, 56, 221, 0.5);
    animation: ${cardHover} 2s ease-in-out;
    box-shadow: 0 16px 48px rgba(207, 56, 221, 0.2);
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

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 1rem;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid rgba(207, 56, 221, 0.6);
  background-color: #f4f0f5;
  transition: all 0.3s ease;
  animation: ${avatarGlow} 4s ease-in-out infinite;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
    border-color: rgba(207, 56, 221, 0.8);
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PeerName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #f4f0f5;
  margin: 0 0 0.25rem 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const JoinDate = styled.div`
  font-size: 0.8rem;
  color: #d8cce2;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
`;

const ActivityBadge = styled.div`
  background: linear-gradient(135deg, #cf38dd, #b954ec);
  border-radius: 16px;
  padding: 0.5rem 0.75rem;
  text-align: center;
  border: 2px solid rgba(244, 240, 245, 0.2);
  box-shadow: 0 4px 16px rgba(207, 56, 221, 0.3);
  animation: ${badgeFloat} 3s ease-in-out infinite;
  flex-shrink: 0;

  .count {
    display: block;
    font-size: 1.1rem;
    font-weight: 800;
    color: #f4f0f5;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    line-height: 1.2;
  }

  .label {
    display: block;
    font-size: 0.6rem;
    color: rgba(244, 240, 245, 0.9);
    text-transform: uppercase;
    font-weight: 600;
    line-height: 1;
    margin-top: 2px;
    letter-spacing: 0.5px;
  }
`;

const CardContent = styled.div`
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RecentVenue = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(207, 56, 221, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(207, 56, 221, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(207, 56, 221, 0.12);
    border-color: rgba(207, 56, 221, 0.3);
  }
`;

const VenueIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(207, 56, 221, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    color: #cf38dd;
  }
`;

const VenueDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VenueName = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #f4f0f5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Rating = styled.span`
  font-size: 0.75rem;
  color: #d394f5;
  flex-shrink: 0;
  margin-left: 0.5rem;
`;

const LastActivity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(64, 51, 71, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(207, 56, 221, 0.1);
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(185, 84, 236, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    color: #b954ec;
  }
`;

const ActivityText = styled.div`
  font-size: 0.8rem;
  color: #d8cce2;
  
  em {
    color: #cf38dd;
    font-weight: 600;
    font-style: normal;
  }
`;

const Toggle = styled.button`
  margin: 2rem auto 1rem;
  display: block;
  background: linear-gradient(135deg, #cf38dd, #d394f5);
  border: 2px solid rgba(207, 56, 221, 0.4);
  color: #f4f0f5;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 999px;
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
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
  backdrop-filter: blur(16px);
  border: 2px solid rgba(207, 56, 221, 0.4);
  padding: 2rem;
  border-radius: 24px;
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 48px rgba(207, 56, 221, 0.3);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(207, 56, 221, 0.2);
  border: 2px solid rgba(207, 56, 221, 0.4);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.2rem;
  color: #f4f0f5;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(207, 56, 221, 0.4);
    border-color: rgba(207, 56, 221, 0.8);
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
`;

const ActivityCount = styled.div`
  font-size: 0.85rem;
  color: #d394f5;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
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
  border-radius: 8px;
  padding: 0.75rem;
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
  border-radius: 8px;
  border: 1px solid rgba(207, 56, 221, 0.1);
`;

const ActivityEmoji = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const ActivityDetails = styled.div`
  flex: 1;
  min-width: 0;
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