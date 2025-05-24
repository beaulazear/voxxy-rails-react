import React, { useState, useEffect, useCallback, useContext } from "react";
import styled from "styled-components";
import RestaurantMap from "./RestaurantMap";
import CuisineChat from "./CuisineChat";
import LoadingScreenUser from "./LoadingScreenUser";
import mixpanel from "mixpanel-browser";
import { UserContext } from "../context/user";

export default function AIRecommendations({
  activity,
  pinnedActivities,
  setPinnedActivities,
  setRefreshTrigger,
  isOwner,
}) {
  const { user } = useContext(UserContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { id, responses, activity_location, date_notes } = activity;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/check_cached_recommendations?activity_id=${id}`, {
      credentials: "include",
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        setRecommendations(data.recommendations);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [API_URL, id]);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/api/openai/trending_recommendations`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activity_location, date_notes, activity_id: id }),
        }
      );
      if (!res.ok) throw new Error("❌ Error fetching trending");
      const { recommendations: recs } = await res.json();
      setRecommendations(
        recs.filter((r) => !pinnedActivities.some((p) => p.title === r.name))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL, activity_location, date_notes, pinnedActivities, id]);

  const fetchRecommendations = useCallback(async (overrideResponses = null) => {
    const useThese = overrideResponses ?? responses;       // 👈 either the passed‑in array or the prop
    setLoading(true);
    setError("");
    try {
      if (!useThese?.length) {
        await fetchTrending();
        return;
      }
      const res = await fetch(
        `${API_URL}/api/openai/restaurant_recommendations`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses: useThese.map(r => r.notes).join("\n\n"),
            activity_location,
            date_notes,
            activity_id: id,
          }),
        }
      );
      if (!res.ok) throw new Error("❌ Error fetching recommendations");
      const { recommendations: recs } = await res.json();
      setRecommendations(
        recs.filter((r) => !pinnedActivities.some((p) => p.title === r.name))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL, responses, activity_location, date_notes, pinnedActivities, id, fetchTrending]);

  function handleStartChat() {
    if (process.env.NODE_ENV === "production") {
      mixpanel.track("Chat with Voxxy Clicked", { activity: id });
    }
    setShowChat(true);
  }

  const createPinnedActivity = async (rec) => {
    try {
      const res = await fetch(
        `${API_URL}/activities/${id}/pinned_activities`,
        {
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
        }
      );
      if (!res.ok) throw new Error("Failed to pin activity");
      const newPinned = await res.json();
      setPinnedActivities((prev) => [...prev, newPinned]);
      setRecommendations((prev) => prev.filter((r) => r.name !== rec.name));
    } catch {
      alert("Something went wrong while pinning the activity.");
    }
  };

  const deletePinnedActivity = async (pin) => {
    try {
      const res = await fetch(
        `${API_URL}/activities/${id}/pinned_activities/${pin.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to unpin activity");
      setPinnedActivities((prev) => prev.filter((p) => p.id !== pin.id));
    } catch {
      alert("Something went wrong while unpinning the activity.");
    }
  };

  const handleLike = (pin) => {
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
  }
  function closeDetail() {
    setShowDetailModal(false);
    setSelectedRec(null);
  }

  if (loading) return <LoadingScreenUser autoDismiss={false} />;

  return (
    <Container>
      {recommendations.length === 0 && pinnedActivities.length === 0 ? (
        <>
          <TopBar>
            <Heading>Restaurant Options</Heading>
          </TopBar>
          <p style={{ paddingBottom: '1rem' }}>
            Tell Voxxy what you’re craving or let us whip up recommendations for you. ✨
          </p>
        </>
      ) : (
        <TopBar>
          <Heading>Restaurant Options</Heading>
        </TopBar>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      <RecommendationsList>
        {[...pinnedActivities]
          .sort(
            (a, b) =>
              (b.votes?.length || 0) - (a.votes?.length || 0)
          )
          .map((p) => (
            <ListItem key={p.id}>
              <ContentWrapper onClick={() => openDetail(p)}>
                <ListTop>
                  <ListName>{p.title}<Tag>PINNED</Tag></ListName>
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
                    {isOwner && (
                      <ActionButton onClick={e => {
                        e.stopPropagation();
                        deletePinnedActivity(p);
                      }}>
                        Unpin
                      </ActionButton>
                    )}
                  </div>
                </ListBottom>
              </ContentWrapper>
            </ListItem>
          ))}
        {!recommendations.length && (
          <>
            <FetchButton onClick={() => setShowGenerateModal(true)}>
              Generate Recommendations
            </FetchButton>
          </>

        )}
        {recommendations
          .filter((r) =>
            !pinnedActivities.some((p) => p.title === r.name)
          )
          .map((r, i) => (
            <ListItem key={i}>
              <ContentWrapper onClick={() => openDetail(r)}>
                <ListTop>
                  <ListName>{r.name}</ListName>
                  <ListMeta>{r.price_range || "N/A"}</ListMeta>
                </ListTop>
                <ListBottom>
                  <div style={{ textAlign: 'left' }}>
                    <div>{r.hours || "N/A"}</div>
                    <div>{r.address || "N/A"}</div>
                  </div>
                  <ActionButton onClick={e => {
                    e.stopPropagation();
                    createPinnedActivity(r);
                  }}>
                    Pin
                  </ActionButton>
                </ListBottom>
              </ContentWrapper>
            </ListItem>
          ))}
      </RecommendationsList>

      {recommendations.length > 0 && (
        <RestaurantMapWrapper>
          <RestaurantMap recommendations={recommendations} />
        </RestaurantMapWrapper>
      )}

      {showChat && (
        <>
          <DimOverlay onClick={() => setShowChat(false)} />
          <CuisineChat
            activityId={id}
            onClose={() => setShowChat(false)}
            onChatComplete={async (newResponse) => {
              const deduped = activity.responses.filter(
                r => r.user_id !== newResponse.user_id
              );
              const updated = [...deduped, newResponse];
              await fetchRecommendations(updated);
              setShowChat(false);
            }}
          />
        </>
      )}

      {showDetailModal && selectedRec && (
        <>
          <Overlay onClick={closeDetail} />
          <DetailModalContent onClick={(e) => e.stopPropagation()}>
            <DetailClose onClick={closeDetail}>×</DetailClose>
            <DetailTitle>{selectedRec.name}</DetailTitle>
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

      {showGenerateModal && (
        <>
          <DimOverlay onClick={() => setShowGenerateModal(false)} />

          <GenerateModal>
            <CloseX onClick={() => setShowGenerateModal(false)}>×</CloseX>

            <ModalTitle>AI Recommendations</ModalTitle>
            <ModalText>
              Choose how you’d like to get suggestions. Chat with Voxxy to submit your preferences, or generate recommendations based off the current activity data.
            </ModalText>

            <OptionButtons>
              <OptionButton
                onClick={async () => {
                  setShowGenerateModal(false);
                  await fetchRecommendations();
                }}
              >
                Generate
              </OptionButton>
              <OptionButton
                onClick={() => {
                  setShowGenerateModal(false);
                  handleStartChat();
                }}
              >
                Chat with Voxxy
              </OptionButton>
            </OptionButtons>

            <WarningText>
              ⚠️ Oops, hot off the press! New recs only every hour—helps keep our AI fueled and our planet happy. 🌱            </WarningText>
          </GenerateModal>
        </>
      )}

    </Container>
  );
}

const Container = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: #fff;
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

const ChatButton = styled.button`
  background: #9051e1;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
  &:hover {
    background: #7a3fc1;
  }

  @media (max-width: 600px) {
  font-size: 12px;
  }
`;

const FetchButton = styled(ChatButton)`
  display: block;
  margin: 1rem auto;
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
  background: #2a1e30;
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
`;

const ContentWrapper = styled.div``;

const Tag = styled.span`
   background: #8F51E0;
   color: #fff;
   font-size: 0.625rem;
   font-weight: bold;
   padding: 0.25rem 0.5rem;
   border-radius: 0.5rem;
   margin-left: 0.5rem;
`;

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

const ActionButton = styled.button`
  background: #28a745;
  color: #fff;
  border: none;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  &:hover {
    background: #218838;
  }
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

const RestaurantMapWrapper = styled.div`
  margin-top: 1rem;
`;

const DimOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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

const GenerateModal = styled.div`
  position: fixed;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  background: #2a1e30;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  z-index: 1002;
  max-width: 22rem;
  width: 90%;
  text-align: center;
  color: #fff;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ModalText = styled.p`
  margin: 0.75rem 0 1.25rem;
  font-size: 0.9rem;
  color: #ccc;
  text-align: left;
`;

const OptionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const OptionButton = styled.button`
  flex: 1;
  padding: 0.5rem 0;
  border: none;
  border-radius: 0.5rem;
  background: #9051e1;
  color: #fff;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.2s ease;

  &:first-of-type {
    background: #6c63ff;
  }
  &:hover {
    background: #7a3fc1;
  }
`;

const WarningText = styled.p`
  font-size: 0.75rem;
  color: #e0a800;
  margin: 0;
`;

const CloseX = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.25rem;
  cursor: pointer;
`;