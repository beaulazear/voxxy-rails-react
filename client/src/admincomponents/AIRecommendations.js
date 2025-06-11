import React, { useState, useContext } from "react";
import styled, { keyframes } from 'styled-components';
import RestaurantMap from "./RestaurantMap";
import CuisineChat from "./CuisineChat";
import LoadingScreenUser from "./LoadingScreenUser";
import mixpanel from "mixpanel-browser";
import { UserContext } from "../context/user";
import { Users, Share, HelpCircle, CheckCircle, Clock, Vote, BookHeart, Flag, Cog } from 'lucide-react';

export default function AIRecommendations({
  activity,
  pinnedActivities,
  setPinnedActivities,
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

  const { id, responses, activity_location, date_notes, collecting, voting, finalized, selected_pinned_activity_id } = activity;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const totalParticipants = activity.participants.length + 1;
  const currentUserResponse = responses.find(r => r.user_id === user.id);
  const responseRate = (responses.length / totalParticipants) * 100;

  const participantsWithVotes = new Set();
  pinnedActivities.forEach(pin => {
    (pin.voters || []).forEach(voter => {
      participantsWithVotes.add(voter.id);
    });
  });
  const votingRate = (participantsWithVotes.size / totalParticipants) * 100;

  const handleStartChat = () => {
    if (process.env.NODE_ENV === "production") {
      mixpanel.track("Chat with Voxxy Clicked", { activity: id });
    }
    setShowChat(true);
  };

  const moveToVotingPhase = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/openai/restaurant_recommendations`,
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

      const pinnedPromises = recs.map(rec =>
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

      const pinnedResults = await Promise.all(pinnedPromises);
      const newPinnedActivities = await Promise.all(
        pinnedResults.map(res => res.json())
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

      setUser(prevUser => ({
        ...prevUser,
        activities: prevUser.activities.map(act =>
          act.id === id
            ? { ...act, collecting: false, voting: true }
            : act
        )
      }));
      setPinnedActivities(newPinnedActivities);
      setRefreshTrigger(f => !f);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowMoveToVotingModal(false);
    }
  };

  const handleLike = (pin) => {
    if (process.env.NODE_ENV === "production") {
      mixpanel.track("Pinned Activity Voted On", { user: user.id });
    }
    const hasLiked = (pin.voters || []).some(v => v.id === user.id);

    console.log(pin)

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
  }

  function closeDetail() {
    setShowDetailModal(false);
    setSelectedRec(null);
  }
  
  const shareUrl = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/activities/${activity.id}/share`;
  const sharePlanUrlClick = () => {
    window.open(
      shareUrl,    // your URL
      '_blank',                 // open in new tab
      'noopener,noreferrer'     // recommended for security
    );
  };

  if (loading) return <LoadingScreenUser autoDismiss={false} />;

  if (collecting && !voting) {
    return (
      <Container>
        <TopBar>
          <Heading>Submit Your Preferences</Heading>
        </TopBar>

        {error && <ErrorText>{error}</ErrorText>}

        <PhaseIndicator>
          <PhaseIcon><HelpCircle size={24} /></PhaseIcon>
          <PhaseContent>
            <PhaseTitle>Group Status</PhaseTitle>
            <PhaseSubtitle>{responses.length}/{totalParticipants} participants have submitted</PhaseSubtitle>
          </PhaseContent>
        </PhaseIndicator>

        <ProgressBarContainer>
          <ProgressBar $percent={responseRate} />
        </ProgressBarContainer>

        {isOwner && (
          <OrganizerSection>
            <OrganizerTitle>Organizer Controls</OrganizerTitle>
            <ParticipantsList>
              {activity.participants.concat([{ id: user.id, name: activity.organizer?.name || 'You' }]).map((participant, index) => {
                const hasSubmitted = responses.some(r => r.user_id === participant.id) ||
                  (participant.name === activity.organizer?.name && responses.some(r => r.user_id === user.id));
                return (
                  <ParticipantItem key={index}>
                    <ParticipantName>{participant.name || participant.email}</ParticipantName>
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

        {!currentUserResponse ? (
          <PreferencesCard>
            <PreferencesIcon><BookHeart size={48} /></PreferencesIcon>
            <PreferencesTitle>Submit Your Preferences!</PreferencesTitle>
            <PreferencesText>
              Help us find the perfect restaurant by sharing your food preferences and dietary needs.
            </PreferencesText>
            <PreferencesButton onClick={handleStartChat}>
              <HelpCircle size={20} />
              Take Preferences Quiz
            </PreferencesButton>
          </PreferencesCard>
        ) : (
          <SubmittedCard>
            <SubmittedIcon><CheckCircle size={48} /></SubmittedIcon>
            <SubmittedTitle>Thank you for submitting your response!</SubmittedTitle>
            <SubmittedText>
              The organizer will gather recommendations shortly. You can resubmit your preferences if you'd like to make changes.
            </SubmittedText>
            <ResubmitButton onClick={handleStartChat}>
              <HelpCircle size={18} />
              Resubmit Preferences
            </ResubmitButton>
          </SubmittedCard>
        )}

        {showChat && (
          <>
            <DimOverlay onClick={() => setShowChat(false)} />
            <CuisineChat
              activityId={id}
              onClose={() => setShowChat(false)}
              onChatComplete={async () => {
                setRefreshTrigger(f => !f);
                setShowChat(false);
              }}
            />
          </>
        )}

        {showMoveToVotingModal && (
          <>
            <GenerateDim onClick={() => setShowMoveToVotingModal(false)} />
            <GenerateModal>
              <ModalHeader>
                <ModalTitle>Move to Voting Phase?</ModalTitle>
              </ModalHeader>

              <InfoRow>
                <Users size={18} />
                <span>{Math.round(responseRate)}% of participants have submitted preferences</span>
              </InfoRow>

              {responseRate < 50 && (
                <WarningBox>
                  <span>⚠️ Less than 50% of participants have submitted their preferences. Consider waiting for more responses to get better recommendations.</span>
                </WarningBox>
              )}

              <FullWidthButton $primary onClick={moveToVotingPhase}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Generate Recommendations</div>
                  <small>This will create restaurant options for the group to vote on</small>
                </div>
              </FullWidthButton>

              <FullWidthButton onClick={() => setShowMoveToVotingModal(false)}>
                Cancel
              </FullWidthButton>
            </GenerateModal>
          </>
        )}
      </Container>
    );
  }

  if (voting && !collecting && !finalized) {
    return (
      <Container>
        <TopBar>
          <Heading>Vote on Restaurants</Heading>
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
            <OrganizerTitle><Cog size={20} /> Organizer Controls</OrganizerTitle>
            <ParticipantsList>
              {activity.participants.concat([{ id: user.id, name: activity.organizer?.name || 'You' }]).map((participant, index) => {
                const hasVoted = Array.from(participantsWithVotes).includes(participant.id) ||
                  (participant.name === activity.organizer?.name && Array.from(participantsWithVotes).includes(user.id));
                return (
                  <ParticipantItem key={index}>
                    <ParticipantName>{participant.name || participant.email}</ParticipantName>
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
                      <LikeButton
                        onClick={e => { e.stopPropagation(); handleLike(p); }}
                        $liked={(p.voters || []).some(v => v.id === user.id)}
                      >
                        {(p.voters || []).some(v => v.id === user.id) ? "❤️" : "🤍"} {(p.votes || []).length}
                      </LikeButton>
                    </div>
                  </ListBottom>
                </ContentWrapper>
              </ListItem>
            ))}
        </RecommendationsList>
        {pinnedActivities.length > 0 && (
          <RestaurantMapWrapper>
            <RestaurantMap recommendations={pinnedActivities} />
          </RestaurantMapWrapper>
        )}

        {showDetailModal && selectedRec && (
          <>
            <Overlay onClick={closeDetail} />
            <DetailModalContent onClick={(e) => e.stopPropagation()}>
              <DetailClose onClick={closeDetail}>×</DetailClose>
              <DetailTitle>{selectedRec.title || selectedRec.name}</DetailTitle>
              <DetailText>
                <strong>Price:</strong> {selectedRec.price_range || "N/A"}
              </DetailText>
              <DetailText>
                <strong>Hours:</strong> {selectedRec.hours || "N/A"}
              </DetailText>
              {selectedRec.description && (
                <DetailText>{selectedRec.description}</DetailText>
              )}
              {selectedRec.reason && (
                <DetailText>
                  <strong>Why:</strong> {selectedRec.reason}
                </DetailText>
              )}
              {selectedRec.website && (
                <DetailLink href={selectedRec.website} target="_blank">
                  Visit Website
                </DetailLink>
              )}
              <DetailText>
                <strong>Address:</strong> {selectedRec.address || "N/A"}
              </DetailText>
              <PhotoGallery>
                {(selectedRec.photos || []).map((p, i) => {
                  const src = p.photo_reference
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`
                    : p;
                  return <Photo key={i} src={src} alt="" />;
                })}
              </PhotoGallery>
            </DetailModalContent>
          </>
        )}
      </Container>
    );
  }

  if (finalized) {
    return (
      <Container>
        <TopBar>
          <Heading>Activity Finalized</Heading>
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

        {pinnedActivities.length > 0 && (
          <RestaurantMapWrapper>
            <RestaurantMap recommendations={pinnedActivities} />
          </RestaurantMapWrapper>
        )}

        {showDetailModal && selectedRec && (
          <>
            <Overlay onClick={closeDetail} />
            <DetailModalContent onClick={(e) => e.stopPropagation()}>
              <DetailClose onClick={closeDetail}>×</DetailClose>
              <DetailTitle>{selectedRec.title || selectedRec.name}</DetailTitle>
              <DetailText>
                <strong>Price:</strong> {selectedRec.price_range || "N/A"}
              </DetailText>
              <DetailText>
                <strong>Hours:</strong> {selectedRec.hours || "N/A"}
              </DetailText>
              {selectedRec.description && (
                <DetailText>{selectedRec.description}</DetailText>
              )}
              {selectedRec.reason && (
                <DetailText>
                  <strong>Why:</strong> {selectedRec.reason}
                </DetailText>
              )}
              {selectedRec.website && (
                <DetailLink href={selectedRec.website} target="_blank">
                  Visit Website
                </DetailLink>
              )}
              <DetailText>
                <strong>Address:</strong> {selectedRec.address || "N/A"}
              </DetailText>
              <PhotoGallery>
                {(selectedRec.photos || []).map((p, i) => {
                  const src = p.photo_reference
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${process.env.REACT_APP_PLACES_KEY}`
                    : p;
                  return <Photo key={i} src={src} alt="" />;
                })}
              </PhotoGallery>
            </DetailModalContent>
          </>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <TopBar>
        <Heading>Restaurant Planning</Heading>
      </TopBar>
      <p>Activity is not in collecting or voting phase.</p>
    </Container>
  );
}

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
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
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
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SubmittedCard = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  text-align: left;
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
`;

const ResubmitButton = styled.button`
  background: transparent;
  color: #28a745;
  border: 1px solid #28a745;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  
  &:hover {
    background: rgba(40, 167, 69, 0.1);
  }
`;

const OrganizerSection = styled.div`
  background: #2a1e30;
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
`;

const ParticipantStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${({ $submitted }) => $submitted ? '#28a745' : '#ffc107'};
`;

const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  padding: 1rem;
  border-radius: 0.5rem;
  color: #ffc107;
  font-size: 0.9rem;
  margin: 1rem 0;
`;

const ErrorText = styled.p`
  color: #d9534f;
  text-align: center;
  font-style: italic;
  margin-bottom: 1rem;
`;

const RecommendationsList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  position: relative;
  background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.2)' : '#2a1e30'};
  border: ${({ $selected }) => $selected ? '2px solid #28a745' : 'none'};
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(40, 167, 69, 0.3)' : '#342540'};
  }
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #28a745;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
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

const RestaurantMapWrapper = styled.div`
  margin-top: 1rem;
`;

const DimOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 997;
`;

const Overlay = styled(DimOverlay)`
  backdrop-filter: blur(8px);
`;

const DetailModalContent = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #2a1e30;
  padding: 1.5rem;
  border-radius: 1rem;
  max-width: 90%;
  width: 24rem;
  color: #fff;
  z-index: 1001;
  text-align: left;
`;

const DetailClose = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #ccc;
  cursor: pointer;
`;

const DetailTitle = styled.h3`
  margin-top: 0;
  font-size: 1.5rem;
`;

const DetailText = styled.p`
  margin: 0.5rem 0;
`;

const DetailLink = styled.a`
  display: inline-block;
  margin: 0.5rem 0;
  color: #9051e1;
  text-decoration: underline;
`;

const PhotoGallery = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  overflow-x: auto;
`;

const Photo = styled.img`
  height: 4rem;
  border-radius: 0.5rem;
  object-fit: cover;
`;

const GenerateDim = styled(DimOverlay)`
  backdrop-filter: blur(6px);
`;

const GenerateModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #2a1e30;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  z-index: 1002;
  width: 90%;
  max-width: 24rem;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalHeader = styled.div`
  text-align: left;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 500;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  text-align: left;
`;

const FullWidthButton = styled.button`
  width: 100%;
  background: ${({ $primary }) => ($primary ? '#cc31e8' : 'transparent')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#6c63ff')};
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid #6c63ff')};
  padding: 1rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;

  &:hover {
    ${({ $primary }) =>
    $primary
      ? `background: #b22cc0;`
      : `background: rgba(108, 99, 255, 0.1); color: #6c63ff;`}
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;