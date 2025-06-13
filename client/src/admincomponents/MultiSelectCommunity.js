// src/components/MultiSelectCommunity.js
import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import SmallTriangle from "../assets/SmallTriangle.png";
import NoCommunityMembers from "./NoCommunityMembers";
import { Users, Mail, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

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
                <HeaderIcon>
                    <Users size={20} />
                </HeaderIcon>
                <HeaderContent>
                    <Title>Your Crew</Title>
                    <Subtitle>Tap to select (you can pick multiple)</Subtitle>
                </HeaderContent>
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
                                <CardContent>
                                    <Avatar
                                        $hasAvatar={!!peer.avatar}
                                        src={peer.avatar || SmallTriangle}
                                        alt={peer.name}
                                    />
                                    <Info>
                                        <PeerName>{peer.name}</PeerName>
                                        <InfoRow>
                                            <Mail size={12} />
                                            <Since>{peer.email}</Since>
                                        </InfoRow>
                                        <InfoRow>
                                            <Calendar size={12} />
                                            <Since>Since {formatSince(peer.created_at)}</Since>
                                        </InfoRow>
                                    </Info>
                                </CardContent>
                                {isSelected && (
                                    <SelectionIndicator>
                                        <span>✓</span>
                                    </SelectionIndicator>
                                )}
                            </Card>
                        );
                    })}
                </Grid>
            </ScrollArea>

            {community.length > 5 && (
                <Toggle onClick={() => setShowAll((v) => !v)}>
                    {showAll ? (
                        <>
                            <ChevronUp size={16} />
                            Show Less
                        </>
                    ) : (
                        <>
                            <ChevronDown size={16} />
                            View All ({community.length})
                        </>
                    )}
                </Toggle>
            )}

            {selected.length > 0 && (
                <SelectedSummary>
                    <SummaryIcon>
                        <Users size={16} />
                    </SummaryIcon>
                    <SummaryText>
                        {selected.length} member{selected.length > 1 ? 's' : ''} selected
                    </SummaryText>
                </SelectedSummary>
            )}
        </Wrapper>
    );
}

const Wrapper = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const HeaderIcon = styled.div`
  color: #cc31e8;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  font-family: "Montserrat", sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  text-align: left;
`;

const Subtitle = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: #ccc;
  margin: 0.25rem 0 0 0;
  text-align: left;
`;

const ScrollArea = styled.div`
  max-height: 360px;
  overflow-y: auto;
  margin-bottom: 1rem;

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.75rem;
  padding-top: 0.5rem;
`;

const Card = styled.div`
  position: relative;
  background: ${props =>
        props.$selected
            ? 'linear-gradient(135deg, rgba(204, 49, 232, 0.2) 0%, rgba(144, 81, 225, 0.2) 100%)'
            : 'rgba(255, 255, 255, 0.05)'
    };
  border: ${props =>
        props.$selected
            ? '2px solid #cc31e8'
            : '2px solid rgba(255, 255, 255, 0.1)'
    };
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    background: ${props =>
        props.$selected
            ? 'linear-gradient(135deg, rgba(204, 49, 232, 0.3) 0%, rgba(144, 81, 225, 0.3) 100%)'
            : 'rgba(255, 255, 255, 0.08)'
    };
    border-color: ${props => props.$selected ? '#bb2fd0' : '#cc31e8'};
    box-shadow: ${props =>
        props.$selected
            ? '0 8px 20px rgba(204, 49, 232, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.2)'
    };
  }
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.75rem;
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 50%;
  border: ${props =>
        props.$hasAvatar
            ? "2px solid rgba(255, 255, 255, 0.3)"
            : "2px solid #cc31e8"
    };
  background-color: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const Info = styled.div`
  flex: 1;
  text-align: left;
  min-width: 0;
`;

const PeerName = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Since = styled.span`
  font-size: 0.8rem;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SelectionIndicator = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: #cc31e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.8rem;
`;

const Toggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(204, 49, 232, 0.3);
  color: #cc31e8;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    background: rgba(204, 49, 232, 0.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(204, 49, 232, 0.2);
  }
`;

const SelectedSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  margin-top: 0.5rem;
`;

const SummaryIcon = styled.div`
  color: #28a745;
  display: flex;
  align-items: center;
`;

const SummaryText = styled.span`
  color: #28a745;
  font-weight: 600;
  font-size: 0.9rem;
`;