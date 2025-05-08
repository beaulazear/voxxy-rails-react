import React from 'react';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';
import { Users } from 'lucide-react';

const Container = styled.div`
  padding: 2rem;
  border-radius: 8px;
`;

const Header = styled.h2`
  color: #ffffff;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
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
  cursor: default;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
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
    const availResponses = currentActivity.responses.filter(
        res => res.notes === 'LetsMeetAvailabilityResponse' && res.availability
    );
    if (availResponses.length === 0) return null;

    const countMap = {};
    availResponses.forEach(({ availability }) => {
        Object.entries(availability).forEach(([date, times]) => {
            if (!countMap[date]) countMap[date] = {};
            times.forEach(time => {
                countMap[date][time] = (countMap[date][time] || 0) + 1;
            });
        });
    });

    const dates = Object.keys(countMap);
    if (dates.length === 0) return null;

    return (
        <Container>
            <Header>Available Time Slots</Header>
            {dates.map(dateStr => {
                const timeCounts = countMap[dateStr];
                const sortedTimes = Object.keys(timeCounts).sort(
                    (a, b) => timeCounts[b] - timeCounts[a]
                );

                if (sortedTimes.length === 0) return null;

                const dateObj = parseISO(dateStr);
                const formattedDate = format(dateObj, 'MMMM do, yyyy');

                return (
                    <DateGroup key={dateStr}>
                        <DateTitle>{formattedDate}</DateTitle>
                        <TimeList>
                            {sortedTimes.map(timeStr => {
                                const [hour, minute] = timeStr.split(':');
                                const timeObj = new Date();
                                timeObj.setHours(Number(hour), Number(minute));
                                const formattedTime = format(timeObj, 'h:mm a');
                                const count = timeCounts[timeStr];

                                return (
                                    <TimeItem key={timeStr}>
                                        {formattedTime}
                                        <CountWrapper>
                                            <Users size={12} />
                                            {count}
                                        </CountWrapper>
                                    </TimeItem>
                                );
                            })}
                        </TimeList>
                    </DateGroup>
                );
            })}
        </Container>
    );
}
