import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';
import { Users, Heart, HeartPulse, Tag, Clock } from 'lucide-react';
import LetsMeetScheduler from './LetsMeetScheduler';
import { UserContext } from "../context/user";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const Card = styled.div`
  background: #2C1E33;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
  text-align: left;
  margin: 1rem auto;
  max-width: 600px;
  width: 100%;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.3rem;
  color: #fff;
  margin-bottom: 0;
  font-weight: bold;
  text-align: left;
  margin-top: 0;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #444;
`;

const TabButton = styled.button`
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.75rem;
  color: ${({ $active }) => ($active ? '#fff' : '#888')};
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  &:hover { color: #fff; }
`;

const TimeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const TimeItem = styled.div`
  color: #fff;
  padding: 0.75rem 1rem;
  border: 3px black;
  border-radius: 20px;
  border-style: solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${({ active }) => (active ? '#f55' : '#555')};
  &:hover { transform: scale(1.1); }
`;

const CountWrapper = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8rem;
  gap: 4px;
`;

export default function TimeSlots({ currentActivity }) {
    const { user } = useContext(UserContext);

    const responseSubmitted = currentActivity.responses.some(
        (res) =>
            res.notes === "LetsMeetAvailabilityResponse" && res.user_id === user.id
    );

    const [pinned, setPinned] = useState([]);
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [activeTab, setActiveTab] = useState(responseSubmitted ? 'available' : 'yours');

    const activityId = currentActivity.id;

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activityId}/time_slots`, {
            method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(data => setPinned(data));

        const availResponses = currentActivity.responses.filter(
            res => res.notes === 'LetsMeetAvailabilityResponse' && res.availability
        );
        const countMap = {};
        availResponses.forEach(({ availability }) => {
            Object.entries(availability).forEach(([date, times]) => {
                if (!countMap[date]) countMap[date] = {};
                times.forEach(time => {
                    countMap[date][time] = (countMap[date][time] || 0) + 1;
                });
            });
        });
        setAvailabilityMap(countMap);
    }, [activityId, currentActivity.responses]);

    const handlePin = (date, time) => {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activityId}/time_slots`, {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, time })
        })
            .then(res => res.json())
            .then(newSlot => setPinned(prev => [newSlot, ...prev]));
    };

    const toggleVote = slot => {
        const endpoint = slot.votes_count && slot.user_voted ? 'unvote' : 'vote';
        fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activityId}/time_slots/${slot.id}/${endpoint}`,
            { method: 'POST', credentials: 'include' }
        )
            .then(res => res.json())
            .then(({ votes_count }) => {
                setPinned(prev => prev
                    .map(s => s.id === slot.id
                        ? { ...s, votes_count, user_voted: endpoint === 'vote' }
                        : s
                    )
                    .sort((a, b) => b.votes_count - a.votes_count)
                );
            });
    };

    const pinnedMap = pinned.reduce((map, slot) => {
        const t = slot.time.slice(11, 16);
        if (!map[slot.date]) map[slot.date] = new Set();
        map[slot.date].add(t);
        return map;
    }, {});

    return (
        <Container>
            <Card>
                <CardHeader>
                    <Title>Pinned Time Slots</Title>
                    <Tag size={20} color="#888" />
                </CardHeader>
                {pinned.length === 0 && (
                    <p style={{ color: '#fff', margin: '1.5rem' }}>No pinned time slots yet. Submit your availability and pin the time slots you want most!</p>
                )}
                <TimeList>
                    {pinned.map(slot => {
                        const dateObj = parseISO(slot.date);
                        const formattedDate = format(dateObj, 'MMM do');
                        const [h, m] = slot.time.slice(11, 16).split(':');
                        const timeObj = new Date(); timeObj.setHours(+h, +m);
                        const formattedTime = format(timeObj, 'h:mm a');

                        return (
                            <TimeItem key={slot.id}>
                                <div>
                                    <strong>{formattedDate}</strong> @ {formattedTime}
                                </div>
                                <ActionButton $active={slot.user_voted} onClick={() => toggleVote(slot)}>
                                    {slot.user_voted ? <HeartPulse color={'red'} size={16} /> : <Heart size={16} />}
                                    <span>{slot.votes_count}</span>
                                </ActionButton>
                            </TimeItem>
                        );
                    })}
                </TimeList>
            </Card>

            <Card>
                <CardHeader>
                    <Title>Available Time Slots</Title>
                    <Clock size={20} color="#888" />
                </CardHeader>
                <Tabs>
                    <TabButton
                        $active={activeTab === 'available'}
                        onClick={() => setActiveTab('available')}
                    >Available Times</TabButton>
                    <TabButton
                        $active={activeTab === 'yours'}
                        onClick={() => setActiveTab('yours')}
                    >Your Availability</TabButton>
                </Tabs>

                {currentActivity.responses.length === 0 & activeTab === 'available' && (
                    <p style={{ color: '#fff', margin: '1.5rem' }}>No available times yet! Submit your availability to pin and vote on times to meet.</p>
                )}

                {activeTab === 'available' ? (
                    Object.entries(availabilityMap).map(([dateStr, timesObj]) => {
                        const times = Object.entries(timesObj)
                            .filter(([time]) => !(pinnedMap[dateStr]?.has(time)));
                        if (!times.length) return null;

                        const dateObj = parseISO(dateStr);
                        const formattedDate = format(dateObj, 'MMMM do, yyyy');

                        return (
                            <div key={dateStr} style={{ marginTop: '1rem', textAlign: 'left' }}>
                                <strong style={{ color: '#ddd', padding: '1rem' }}>{formattedDate}</strong>
                                <TimeList>
                                    {times.sort(([, a], [, b]) => b - a).map(([time, count]) => {
                                        const [h, m] = time.split(':');
                                        const tobj = new Date(); tobj.setHours(+h, +m);
                                        const formattedTime = format(tobj, 'h:mm a');

                                        return (
                                            <TimeItem key={time}>
                                                {formattedTime}
                                                <CountWrapper>
                                                    <Users size={12} /> {count}
                                                </CountWrapper>
                                                <ActionButton onClick={() => handlePin(dateStr, time)}>
                                                    <Tag size={16} color="#888" />
                                                </ActionButton>
                                            </TimeItem>
                                        );
                                    })}
                                </TimeList>
                            </div>
                        );
                    })
                ) : (
                    <LetsMeetScheduler onClose={() => setActiveTab('available')} responseSubmitted={responseSubmitted} currentActivity={currentActivity} activityId={currentActivity.id} />
                )}
            </Card>
        </Container>
    );
}
