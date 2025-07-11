// LetsMeetFormModal.js
import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserContext } from '../context/user';
import mixpanel from 'mixpanel-browser';
import { Calendar, MessageSquare, Edit3, ChevronLeft, ChevronRight, X } from 'lucide-react';

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
`;

const ProgressBarContainer = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  width: 100%;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const StepLabel = styled.div`
  padding: 1rem 2rem 0.5rem;
  font-size: 0.85rem;
  color: #cc31e8;
  text-align: center;
  font-weight: 600;
`;

const ModalHeader = styled.div`
  padding: 0 2rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
`;

const Subtitle = styled.p`
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const StepContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  
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

  @media (max-width: 420px) {
    padding: 0.5rem;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
  
  &:focus { 
    border-color: #cc31e8; 
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &:-webkit-autofill { 
    box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.05) inset !important; 
    -webkit-text-fill-color: #fff !important; 
  }
  
  &::-webkit-calendar-picker-indicator, 
  &::-moz-color-swatch-button { 
    filter: invert(1) brightness(2); 
    cursor: pointer; 
  }
  
  &::placeholder { 
    color: #aaa; 
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:focus { 
    border-color: #cc31e8; 
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder { 
    color: #aaa; 
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 480px) {
    gap: 0.125rem;
    padding: 0.125rem;
  }
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
      : 'transparent'
  };
  color: ${({ $active }) => ($active ? 'white' : '#ccc')};
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  @media (max-width: 480px) {
    padding: 0.4rem 0.5rem;
    font-size: 0.75rem;
  }
  
  &:hover:not(:disabled) {
    background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
      : 'rgba(255, 255, 255, 0.08)'
  };
    transform: translateY(-1px);
    box-shadow: ${({ $active }) =>
    $active
      ? '0 4px 12px rgba(204, 49, 232, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)'
  };
  }
`;

const CalendarContainer = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CalendarNav = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #fff;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MonthYear = styled.div`
  font-weight: 600;
  color: #fff;
  font-size: 1rem;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const DayHeader = styled.div`
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #aaa;
  padding: 0.5rem 0;
`;

const DayCell = styled.button`
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  background: ${({ $isSelected, $isInRange, $isToday, $isDisabled, $isRangeStart, $isRangeEnd }) => {
    if ($isDisabled) return 'rgba(255, 255, 255, 0.02)';
    if ($isSelected || $isRangeStart || $isRangeEnd) return 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)';
    if ($isInRange) return 'rgba(204, 49, 232, 0.3)';
    if ($isToday) return 'rgba(255, 255, 255, 0.1)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  color: ${({ $isSelected, $isDisabled, $isRangeStart, $isRangeEnd }) => {
    if ($isDisabled) return '#555';
    if ($isSelected || $isRangeStart || $isRangeEnd) return '#fff';
    return '#ccc';
  }};
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
  font-size: 0.85rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  
  &:hover:not(:disabled) {
    background: ${({ $isSelected, $isDisabled, $isRangeStart, $isRangeEnd }) => {
    if ($isDisabled) return 'rgba(255, 255, 255, 0.02)';
    if ($isSelected || $isRangeStart || $isRangeEnd) return 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
    transform: ${({ $isDisabled }) => ($isDisabled ? 'none' : 'scale(1.05)')};
  }
`;

const SelectedDatesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const SelectedDate = styled.div`
  background: rgba(204, 49, 232, 0.2);
  border: 1px solid rgba(204, 49, 232, 0.4);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: #fff;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RemoveDateButton = styled.button`
  background: none;
  border: none;
  color: #cc31e8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(204, 49, 232, 0.3);
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 99, 132, 0.1);
  border: 1px solid rgba(255, 99, 132, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: #ff6384;
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
`;

const Button = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 100px;
  
  background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, #cc31e8 0%, #9051e1 100%)'
      : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $primary }) => ($primary ? 'white' : '#cc31e8')};
  border: ${({ $primary }) => ($primary ? 'none' : '2px solid rgba(204, 49, 232, 0.3)')};
  
  &:hover:not(:disabled) { 
    transform: translateY(-2px);
    box-shadow: ${({ $primary }) =>
    $primary
      ? '0 8px 20px rgba(204, 49, 232, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)'};
    background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, #bb2fd0 0%, #8040d0 100%)'
      : 'rgba(255, 255, 255, 0.08)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export default function LetsMeetFormModal({ onClose }) {
  const { user, setUser } = useContext(UserContext);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const [step, setStep] = useState(1);
  const [activityName, setActivityName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [tab, setTab] = useState('single');
  const [singleDate, setSingleDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [multipleDates, setMultipleDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [rangeStartTemp, setRangeStartTemp] = useState('');

  const totalSteps = 2;
  const percent = (step / totalSteps) * 100;

  const today = new Date().toISOString().split('T')[0];

  const headers = [
    { title: "Tell us about your meeting", subtitle: "Basic information to help coordinate with your group." },
    { title: "Choose your preferred dates", subtitle: "Select when you'd like to meet with your group." },
  ];
  const { title, subtitle } = headers[step - 1];

  // Validation functions
  const isDateValid = (dateStr) => {
    if (!dateStr) return false;
    return dateStr >= today;
  };

  const isDateRangeValid = (start, end) => {
    if (!start || !end) return false;
    if (start < today || end < today) return false;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 1;
  };

  // Calendar functions
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isSameDate = (date1, date2) => {
    return formatDate(date1) === formatDate(date2);
  };

  const isDateInPast = (dateStr) => {
    return dateStr < today;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleCalendarDateClick = (date) => {
    const dateStr = formatDate(date);

    if (isDateInPast(dateStr)) return;

    setError('');

    if (tab === 'single') {
      setSingleDate(dateStr);
    } else if (tab === 'range') {
      if (!rangeStartTemp) {
        // First click - set start date
        setRangeStartTemp(dateStr);
        setRangeStart('');
        setRangeEnd('');
      } else if (dateStr === rangeStartTemp) {
        // Clicking same date - clear selection
        setRangeStartTemp('');
        setRangeStart('');
        setRangeEnd('');
      } else {
        // Second click - set range
        const start = rangeStartTemp < dateStr ? rangeStartTemp : dateStr;
        const end = rangeStartTemp < dateStr ? dateStr : rangeStartTemp;

        if (isDateRangeValid(start, end)) {
          setRangeStart(start);
          setRangeEnd(end);
          setRangeStartTemp('');
        } else {
          setError('Date range must be at least one day apart');
        }
      }
    } else if (tab === 'multiple') {
      const newDates = multipleDates.includes(dateStr)
        ? multipleDates.filter(d => d !== dateStr)
        : [...multipleDates, dateStr].sort();
      setMultipleDates(newDates);
    }
  };

  const removeMultipleDate = (dateToRemove) => {
    setMultipleDates(multipleDates.filter(date => date !== dateToRemove));
  };

  const dateNotes = () => {
    if (tab === 'single') return singleDate;
    if (tab === 'range') return `${rangeStart} to ${rangeEnd}`;
    if (tab === 'multiple') return multipleDates.join(', ');
    return '';
  };

  const handleNext = () => {
    setError('');

    if (step === 2) {
      // Validate dates before submitting
      if (tab === 'single' && !isDateValid(singleDate)) {
        setError('Please select a valid date (today or in the future)');
        return;
      }
      if (tab === 'range' && !isDateRangeValid(rangeStart, rangeEnd)) {
        setError('Please select a valid date range (at least one day apart, not in the past)');
        return;
      }
      if (tab === 'multiple' && multipleDates.length === 0) {
        setError('Please select at least one date');
        return;
      }
      if (tab === 'multiple' && multipleDates.some(date => isDateInPast(date))) {
        setError('All selected dates must be today or in the future');
        return;
      }

      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const basePayload = {
      activity_type: 'Meeting',
      activity_location: 'TBD',
      activity_name: activityName,
      welcome_message: welcomeMessage,
      date_notes: dateNotes(),
      participants: [],
      group_size: 1,
      emoji: '👥',
      collecting: true
    };

    const payload = {
      ...basePayload,
      ...(tab === 'single' && { date_day: singleDate }),
    };

    try {
      const res = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activity: payload }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      mixpanel.track('Lets Meet Form Completed', { user: user.id });
      setUser(prev => ({
        ...prev,
        activities: [...(prev.activities || []), { ...data, user: prev, responses: [] }]
      }));
      onClose(data.id);
    } catch (err) {
      console.error(err);
      setError('Oops, something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setError('');
    // Reset temporary range selection when switching tabs
    setRangeStartTemp('');
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(calendarDate);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const isDateSelected = (date) => {
      if (!date) return false;
      const dateStr = formatDate(date);

      if (tab === 'single') {
        return dateStr === singleDate;
      } else if (tab === 'range') {
        return dateStr === rangeStart || dateStr === rangeEnd || dateStr === rangeStartTemp;
      } else if (tab === 'multiple') {
        return multipleDates.includes(dateStr);
      }
      return false;
    };

    const isDateInRange = (date) => {
      if (!date || tab !== 'range') return false;
      const dateStr = formatDate(date);

      if (!rangeStart || !rangeEnd) return false;
      return dateStr > rangeStart && dateStr < rangeEnd;
    };

    const isRangeStart = (date) => {
      if (!date || tab !== 'range') return false;
      const dateStr = formatDate(date);
      return dateStr === rangeStart || dateStr === rangeStartTemp;
    };

    const isRangeEnd = (date) => {
      if (!date || tab !== 'range') return false;
      const dateStr = formatDate(date);
      return dateStr === rangeEnd;
    };

    return (
      <CalendarContainer>
        <CalendarHeader>
          <CalendarNav
            onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
          >
            <ChevronLeft size={16} />
          </CalendarNav>
          <MonthYear>
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </MonthYear>
          <CalendarNav
            onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
          >
            <ChevronRight size={16} />
          </CalendarNav>
        </CalendarHeader>

        <CalendarGrid>
          {dayNames.map(day => (
            <DayHeader key={day}>{day}</DayHeader>
          ))}
          {days.map((date, index) => (
            <DayCell
              key={index}
              onClick={() => date && handleCalendarDateClick(date)}
              $isSelected={isDateSelected(date)}
              $isInRange={isDateInRange(date)}
              $isRangeStart={isRangeStart(date)}
              $isRangeEnd={isRangeEnd(date)}
              $isToday={date && isSameDate(date, new Date())}
              $isDisabled={!date || isDateInPast(formatDate(date))}
              disabled={!date || isDateInPast(formatDate(date))}
            >
              {date ? date.getDate() : ''}
            </DayCell>
          ))}
        </CalendarGrid>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </CalendarContainer>
    );
  };

  return (
    <Overlay onClick={() => onClose(null)}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ProgressBarContainer>
          <ProgressBar $percent={percent} />
        </ProgressBarContainer>

        <StepLabel>
          Step {step} of {totalSteps}
        </StepLabel>

        <ModalHeader>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </ModalHeader>

        <StepContent>
          {step === 1 && (
            <>
              <Section>
                <Label htmlFor="name">
                  <Edit3 size={16} />
                  Meeting Name
                </Label>
                <Input
                  id="name"
                  value={activityName}
                  onChange={e => setActivityName(e.target.value)}
                  placeholder="e.g. Team Sync"
                />
              </Section>

              <Section>
                <Label htmlFor="purpose">
                  <MessageSquare size={16} />
                  Purpose / Description
                </Label>
                <Textarea
                  id="purpose"
                  rows={3}
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  placeholder="A quick blurb so everyone knows why we're meeting..."
                />
              </Section>
            </>
          )}

          {step === 2 && (
            <Section>
              <Tabs>
                <Tab $active={tab === 'single'} onClick={() => handleTabChange('single')}>
                  Single Date
                </Tab>
                <Tab $active={tab === 'range'} onClick={() => handleTabChange('range')}>
                  Date Range
                </Tab>
                <Tab $active={tab === 'multiple'} onClick={() => handleTabChange('multiple')}>
                  Multiple Dates
                </Tab>
              </Tabs>

              <FormGroup>
                <Label>
                  <Calendar size={16} />
                  {tab === 'single' && 'Select Date'}
                  {tab === 'range' && 'Select Date Range'}
                  {tab === 'multiple' && 'Select Multiple Dates'}
                </Label>

                {tab === 'range' && rangeStart && rangeEnd && (
                  <SelectedDatesList>
                    <SelectedDate>
                      {new Date(rangeStart).toLocaleDateString()} - {new Date(rangeEnd).toLocaleDateString()}
                    </SelectedDate>
                  </SelectedDatesList>
                )}

                {tab === 'multiple' && multipleDates.length > 0 && (
                  <SelectedDatesList>
                    {multipleDates.map((date) => (
                      <SelectedDate key={date}>
                        {new Date(date).toLocaleDateString()}
                        <RemoveDateButton onClick={() => removeMultipleDate(date)}>
                          <X size={12} />
                        </RemoveDateButton>
                      </SelectedDate>
                    ))}
                  </SelectedDatesList>
                )}
              </FormGroup>

              {renderCalendar()}
            </Section>
          )}
        </StepContent>

        <ButtonRow>
          {step > 1 ? (
            <Button onClick={() => setStep(step - 1)} disabled={submitting}>
              Back
            </Button>
          ) : <div />}

          <Button
            $primary
            onClick={handleNext}
            disabled={
              submitting ||
              (step === 1 && (!activityName.trim() || !welcomeMessage.trim())) ||
              (step === 2 && tab === 'single' && !singleDate) ||
              (step === 2 && tab === 'range' && (!rangeStart || !rangeEnd)) ||
              (step === 2 && tab === 'multiple' && multipleDates.length === 0)
            }
          >
            {step < 2 ? 'Next' : (submitting ? 'Saving...' : 'Finish')}
          </Button>
        </ButtonRow>
      </ModalContainer>
    </Overlay>
  );
}