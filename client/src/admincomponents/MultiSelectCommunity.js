// src/components/MultiSelectCommunity.js

import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import SmallTriangle from "../assets/SmallTriangle.png";
import NoCommunityMembers from "./NoCommunityMembers";
import colors from "../styles/Colors";

export default function MultiSelectCommunity({ onSelectionChange, onCreateBoard }) {
    const { user } = useContext(UserContext);
    const [showAll, setShowAll] = useState(false);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        if (typeof onSelectionChange === "function") {
            onSelectionChange(selected);
        }
    }, [selected, onSelectionChange]);

    if (!user) return null;

    const allUsersMap = new Map();
    user.activities?.forEach((act) => {
        act.participants?.forEach((p) => {
            if (p.id !== user.id) {
                const existing =
                    allUsersMap.get(p.id) || {
                        user: p,
                        lastDate: null,
                        lastName: "",
                        count: 0,
                        sharedActivities: [],
                    };
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
    user.participant_activities?.forEach((pa) => {
        const { activity: act } = pa;
        const host = act.user;
        if (host?.id !== user.id) {
            const existing =
                allUsersMap.get(host.id) || {
                    user: host,
                    lastDate: null,
                    lastName: "",
                    count: 0,
                    sharedActivities: [],
                };
            existing.count += 1;
            existing.sharedActivities.push(act.activity_name);
            const date = new Date(act.date_day);
            if (!existing.lastDate || date > existing.lastDate) {
                existing.lastDate = date;
                existing.lastName = act.activity_name;
            }
            allUsersMap.set(host.id, existing);
        }
        act.participants?.forEach((p) => {
            if (p.id !== user.id) {
                const existing =
                    allUsersMap.get(p.id) || {
                        user: p,
                        lastDate: null,
                        lastName: "",
                        count: 0,
                        sharedActivities: [],
                    };
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
        return d.toLocaleString("en-US", { month: "short", year: "numeric" });
    }

    const community = Array.from(allUsersMap.values()).sort(
        (a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name)
    );

    if (community.length === 0) {
        return <NoCommunityMembers onCreateBoard={onCreateBoard} />;
    }

    const displayed = showAll ? community : community.slice(0, 5);

    function toggleUser(peerUser) {
        setSelected((prev) => {
            const exists = prev.find((u) => u.id === peerUser.id);
            if (exists) {
                return prev.filter((u) => u.id !== peerUser.id);
            } else {
                return [...prev, peerUser];
            }
        });
    }

    return (
        <Wrapper>
            <Header>
                <Title>Your Crew</Title>
                <Subtitle>Tap to select (you can pick multiple)</Subtitle>
            </Header>

            <ScrollArea>
                <Grid>
                    {displayed.map((peerData) => {
                        const peer = peerData.user;
                        const isSelected = !!selected.find((u) => u.id === peer.id);
                        return (
                            <Card
                                key={peer.id}
                                $selected={isSelected}
                                onClick={() => toggleUser(peer)}
                            >
                                <Avatar
                                    $hasAvatar={!!peer.avatar}
                                    src={peer.avatar || SmallTriangle}
                                    alt={peer.name}
                                />
                                <Info>
                                    <PeerName>{peer.name}</PeerName>
                                    <Since>{peer.email}</Since>
                                    <Since>Since {formatSince(peer.created_at)}</Since>
                                </Info>
                            </Card>
                        );
                    })}
                </Grid>
            </ScrollArea>

            {community.length > 5 && (
                <Toggle onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show Less" : "View All"}
                </Toggle>
            )}
        </Wrapper>
    );
}

// ================ Styled Components (Compact) =================

const Wrapper = styled.div`
  text-align: left;
  margin: 0.5rem 0;
`;

const Header = styled.div`
  padding: 0.5rem 1rem 0;
`;

const Title = styled.span`
  font-family: "Montserrat", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
`;

const Subtitle = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: ${colors.textSecondary};
  margin: 0.25rem 0 0.75rem;
`;

const ScrollArea = styled.div`
  max-height: 160px;
  overflow-y: auto;
  padding-right: 0.5rem;
  padding-top: 0.5rem;

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
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
  padding: 0 0.5rem 0.5rem;
`;

const Card = styled.div`
  background: ${colors.backgroundTwo};
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s, 
    border 0.15s, background-color 0.15s;
  border: ${(props) =>
        props.$selected
            ? `2px solid ${colors.primaryButton}`
            : "2px solid transparent"};
  box-shadow: ${(props) =>
        props.$selected
            ? `0 0 0 2px ${colors.primaryButton}`
            : "0 1px 4px rgba(0, 0, 0, 0.15)"};

  &:hover {
    transform: translateY(-1px);
    background-color: rgba(255, 255, 255, 0.05);
    box-shadow: ${(props) =>
        props.$selected
            ? `0 0 0 2px ${colors.primaryButton}`
            : "0 0 0 2px rgba(255,255,255,0.2)"};
  }
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 50%;
  border: ${(props) =>
        props.$hasAvatar ? "1.5px solid white" : "2px solid #cc31e8"};
  background-color: #fff;
  margin-right: 0.5rem;
`;

const Info = styled.div`
  flex: 1;
  text-align: left;
`;

const PeerName = styled.p`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${colors.textPrimary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Since = styled.p`
  font-size: 0.7rem;
  color: ${colors.textSecondary};
  margin: 0.15rem 0 0;
  font-style: italic;
`;

const Toggle = styled.button`
  margin: 0.25rem 0.5rem 0.75rem;
  background: none;
  border: none;
  color: ${colors.primaryButton};
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;