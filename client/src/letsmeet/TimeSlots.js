import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';
import { Users, Heart, HeartPulse, PlusSquare } from 'lucide-react';

const Container = styled.div`
  padding: 2rem;
  border-radius: 8px;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const Header = styled.h2`
  color: #ffffff;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DateGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const DateTitle = styled.h3`
  color: #ffffff;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
`;

const TimeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const TimeItem = styled.div`
  position: relative;
  background: #1f1f1f;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${({ $active }) => $active ? '#f55' : '#555'};

  &:hover {
    transform: scale(1.1);
  }
`;

const CountWrapper = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8rem;
  gap: 4px;
`;

export default function TimeSlots({ currentActivity }) {
    const [pinned, setPinned] = useState([]);
    const [availabilityMap, setAvailabilityMap] = useState({});

    const activityId = currentActivity.id;

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/activities/${activityId}/time_slots`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ date, time }),
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
                setPinned(prev =>
                    prev
                        .map(s =>
                            s.id === slot.id
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
            {pinned.length > 0 && (
                <Section>
                    <Header>Pinned Time Slots</Header>
                    <TimeList>
                        {pinned.map(slot => {
                            const dateObj = parseISO(slot.date);
                            const formattedDate = format(dateObj, 'MMM do');
                            const [h, m] = slot.time.slice(11, 16).split(':');
                            const timeObj = new Date();
                            timeObj.setHours(Number(h), Number(m));
                            const formattedTime = format(timeObj, 'h:mm a');

                            return (
                                <TimeItem key={slot.id}>
                                    <div>
                                        <strong>{formattedDate}</strong> @ {formattedTime}
                                    </div>
                                    <ActionButton
                                        $active={slot.user_voted}
                                        onClick={() => toggleVote(slot)}
                                    >
                                        {slot.user_voted ? <HeartPulse size={16} /> : <Heart size={16} />}
                                        <span>{slot.votes_count}</span>
                                    </ActionButton>
                                </TimeItem>
                            );
                        })}
                    </TimeList>
                </Section>
            )}

            <Section>
                <Header>Available Time Slots</Header>
                {Object.entries(availabilityMap).map(([dateStr, timesObj]) => {
                    const times = Object.entries(timesObj)
                        .filter(([time, count]) =>
                            !(pinnedMap[dateStr] && pinnedMap[dateStr].has(time))
                        );
                    if (times.length === 0) return null;

                    const dateObj = parseISO(dateStr);
                    const formattedDate = format(dateObj, 'MMMM do, yyyy');

                    return (
                        <DateGroup key={dateStr}>
                            <DateTitle>{formattedDate}</DateTitle>
                            <TimeList>
                                {times
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([time, count]) => {
                                        const [h, m] = time.split(':');
                                        const timeObj = new Date();
                                        timeObj.setHours(Number(h), Number(m));
                                        const formattedTime = format(timeObj, 'h:mm a');

                                        return (
                                            <TimeItem key={time}>
                                                {formattedTime}
                                                <CountWrapper>
                                                    <Users size={12} /> {count}
                                                </CountWrapper>
                                                <ActionButton onClick={() => handlePin(dateStr, time)}>
                                                    <PlusSquare size={16} />
                                                </ActionButton>
                                            </TimeItem>
                                        );
                                    })}
                            </TimeList>
                        </DateGroup>
                    );
                })}
            </Section>
        </Container>
    );
}
