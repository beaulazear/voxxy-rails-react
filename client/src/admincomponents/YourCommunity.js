import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import SmallTriangle from "../assets/SmallTriangle.png";
import NoCommunityMembers from "./NoCommunityMembers";
import colors from '../styles/Colors';

export default function YourCommunity({ showInvitePopup, onSelectUser }) {
  const { user } = useContext(UserContext);
  const [showAll, setShowAll] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);

  if (!user) return null;

  // build map of community peers
  const allUsersMap = new Map();
  user.activities?.forEach(act => {
    act.participants?.forEach(p => {
      if (p.id !== user.id) {
        const existing = allUsersMap.get(p.id) || { user: p, lastDate: null, lastName: '', count: 0, sharedActivities: [] };
        existing.count += 1;
        existing.sharedActivities.push(act.activity_name);
        const date = new Date(act.date_day);
        if (!existing.lastDate || date > existing.lastDate) {
          existing.lastDate = date;
          existing.lastName = act.activity_name;
        }
        allUsersMap.set(p.id, existing);
      }
    });
  });
  user.participant_activities?.forEach(pa => {
    const { activity: act } = pa;
    const host = act.user;
    if (host?.id !== user.id) {
      const existing = allUsersMap.get(host.id) || { user: host, lastDate: null, lastName: '', count: 0, sharedActivities: [] };
      existing.count += 1;
      existing.sharedActivities.push(act.activity_name);
      const date = new Date(act.date_day);
      if (!existing.lastDate || date > existing.lastDate) {
        existing.lastDate = date;
        existing.lastName = act.activity_name;
      }
      allUsersMap.set(host.id, existing);
    }
    act.participants?.forEach(p => {
      if (p.id !== user.id) {
        const existing = allUsersMap.get(p.id) || { user: p, lastDate: null, lastName: '', count: 0, sharedActivities: [] };
        existing.count += 1;
        existing.sharedActivities.push(act.activity_name);
        const date = new Date(act.date_day);
        if (!existing.lastDate || date > existing.lastDate) {
          existing.lastDate = date;
          existing.lastName = act.activity_name;
        }
        allUsersMap.set(p.id, existing);
      }
    });
  });

  function formatSince(iso) {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  const community = Array.from(allUsersMap.values())
    .sort((a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name));

  if (community.length === 0) return <NoCommunityMembers />;
  const displayed = showAll ? community : community.slice(0, 5);

  function handleCardClick(peerData) {
    if (showInvitePopup && onSelectUser) {
      onSelectUser(peerData.user);
    } else {
      setSelectedPeer(peerData);
    }
  }

  return (
    <div>
      <Wrapper>
        <Header>
          <TitleText>Your Voxxy Crew 🎭</TitleText>
          <Subtitle>Friends you’ve Voxxed with.</Subtitle>
        </Header>

        {/* Scrollable list container */}
        <ScrollArea>
          <Grid>
            {displayed.map(peerData => (
              <Card
                key={peerData.user.id}
                onClick={() => handleCardClick(peerData)}
              >
                <Avatar
                  $hasAvatar={!!peerData.user.avatar}
                  src={peerData.user.avatar || SmallTriangle}
                  alt={peerData.user.name}
                />
                <Info>
                  <PeerName>{peerData.user.name}</PeerName>
                  <LastAct>Last: <em>{peerData.lastName}</em></LastAct>
                  <Since>On Voxxy since {formatSince(peerData.user.created_at)}</Since>
                </Info>
              </Card>
            ))}
          </Grid>
        </ScrollArea>

        {community.length > 8 && (
          <Toggle onClick={() => setShowAll(v => !v)}>
            {showAll ? 'Show Less' : 'View All'}
          </Toggle>
        )}
      </Wrapper>

      {selectedPeer && !showInvitePopup && (
        <ModalOverlay onClick={() => setSelectedPeer(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setSelectedPeer(null)}>×</CloseButton>
            <ModalHeader>
              <Avatar
                $hasAvatar={!!selectedPeer.user.avatar}
                src={selectedPeer.user.avatar || SmallTriangle}
                alt={selectedPeer.user.name}
              />
              <UserInfo>
                <PeerName>{selectedPeer.user.name}</PeerName>
                <Email>{selectedPeer.user.email}</Email>
                <Since>On Voxxy since {formatSince(selectedPeer.user.created_at)}</Since>
              </UserInfo>
            </ModalHeader>
            <ActivitiesList>
              <p>Shared Activities ({selectedPeer.count})</p>
              <ul>
                {selectedPeer.sharedActivities.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </ActivitiesList>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}

// styled components

const Wrapper = styled.div`
  text-align: left;
`;

const Header = styled.h2`
  font-size: 2rem;
  display: flex;
  flex-direction: column;
  padding-top: 40px;
  padding-left: 1rem;
  margin-bottom: 1.5rem;
`;

const TitleText = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: bold;
  color: #fff;
`;

const Subtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #fff;
  margin: 0.5rem 0 1rem;
`;

const ScrollArea = styled.div`
  overflow-y: auto;
  padding-right: 1rem;          /* keep content from under the scrollbar */

  /* hide scrollbar in Firefox */
  scrollbar-width: none;
  /* hide scrollbar in IE 10+ */
  -ms-overflow-style: none;

  /* hide scrollbar in WebKit browsers */
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const Card = styled.div`
  background: ${colors.backgroundTwo};
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &:hover {
    box-shadow: 0 0 20px rgba(153,85,230,0.4);
    transform: translateY(-4px);
  }
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
  border: ${props => props.$hasAvatar ? '2px solid white' : '4px solid white'};
  margin-right: 1rem;
`;

const Info = styled.div`
  flex: 1;
  text-align: left;
`;

const PeerName = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0;
`;

const LastAct = styled.p`
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  margin: 0.25rem 0 0;
`;

const Since = styled.p`
  font-size: 0.75rem;
  color: ${colors.textSecondary};
  margin: 0.25rem 0 0;
  font-style: italic;
`;

const Toggle = styled.button`
  margin-top: 1.5rem;
  background: none;
  border: none;
  color: ${colors.primaryButton};
  cursor: pointer;
  font-size: 1rem;
  &:hover { text-decoration: underline; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${colors.backgroundTwo};
  padding: 2rem;
  border-radius: 1rem;
  max-width: 400px;
  width: 90%;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const UserInfo = styled.div`
  margin-left: 1rem;
`;

const Email = styled.p`
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  margin: 0.25rem 0;
`;

const ActivitiesList = styled.div`
  margin-top: 1rem;
  text-align: left;
  ul {
    padding-left: 1.2rem;
    margin: 0;
  }
  li { 
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    color: #fff;
  }
  p { color: #fff; }
`;