import React, { useState, useContext, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse, parseISO } from "date-fns";
import styled, { keyframes } from "styled-components";
import mixpanel from "mixpanel-browser";
import { UserContext } from "../context/user";
import { Calendar, Clock, X, CheckCircle2, Globe } from 'lucide-react';

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

const ModalOverlay = styled.div`
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
  z-index: 1000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  border-radius: 1.5rem 1.5rem 0 0;
  z-index: 10;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem 2rem 2rem;
`;

const AvailabilityInfo = styled.div`
  background: rgba(204, 49, 232, 0.1);
  border: 1px solid rgba(204, 49, 232, 0.3);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: #cc31e8;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WhiteDayPicker = styled(DayPicker)`
  margin: 1.5rem auto;
  display: flex;
  justify-content: center;
  width: 100%;
  
  .rdp-month {
    background: transparent;
    margin: 0 auto;
  }
  .rdp-caption_label,
  .rdp-nav_button,
  .rdp-month table thead th,
  .rdp-day {
    color: #fff !important;
  }
  --rdp-accent-color: #cc31e8;
  --rdp-accent-color-hover: #9051e1;
  --rdp-day-selected-background: #cc31e8;
  --rdp-day-selected-color: #fff;
  --rdp-background-color: transparent;
`;

const OpenAvailabilitySection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #cc31e8;
    cursor: pointer;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxIcon = styled.div`
  color: #cc31e8;
`;

const TimeSlotSection = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h4`
  color: #fff;
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DateGroup = styled.div`
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DateTitle = styled.div`
  font-weight: 600;
  color: #cc31e8;
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const TimeSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 0.4rem;
  }
`;

const SlotButton = styled.button`
  padding: 0.6rem 0.5rem;
  border: 2px solid ${({ $selected }) =>
        $selected ? "#cc31e8" : "rgba(255, 255, 255, 0.2)"};
  background: ${({ $selected }) =>
        $selected ? "rgba(204, 49, 232, 0.2)" : "rgba(255, 255, 255, 0.05)"};
  color: ${({ $selected }) => ($selected ? "#cc31e8" : "#fff")};
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: ${({ $selected }) => ($selected ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(204, 49, 232, 0.1);
    border-color: #cc31e8;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #cc31e8 0%, #9051e1 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(204, 49, 232, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ResponseCard = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  color: #28a745;
`;

const ResponseIcon = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const ResponseTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  color: #28a745;
`;

const ResponseText = styled.p`
  margin: 0;
  color: #ccc;
  line-height: 1.5;
`;

export default function LetsMeetScheduler({ activityId, currentActivity, responseSubmitted, onClose, isUpdate = false, onAvailabilityUpdate }) {
    const { user, setUser } = useContext(UserContext);

    // Initialize state with existing response data if updating
    const existingResponse = currentActivity.responses?.find(r =>
        r.notes === "LetsMeetAvailabilityResponse" && r.user_id === user.id
    );

    const [selectedDates, setSelectedDates] = useState(() => {
        if (!isUpdate || !existingResponse?.availability) return [];

        if (existingResponse.availability.open) return [];

        return Object.keys(existingResponse.availability)
            .map(dateStr => parseISO(dateStr))
            .filter(date => !isNaN(date));
    });

    const [slotsByDate, setSlotsByDate] = useState(() => {
        if (!isUpdate || !existingResponse?.availability) return {};

        if (existingResponse.availability.open) return {};

        return existingResponse.availability;
    });

    const [openAll, setOpenAll] = useState(() => {
        if (!isUpdate || !existingResponse?.availability) return false;
        return existingResponse.availability.open === true;
    });

    const { disabledDays, availableLabel } = useMemo(() => {
        const note = currentActivity.date_notes;
        const today = new Date();

        if (note === "open") {
            return {
                disabledDays: { before: today },
                availableLabel: "Any future date",
            };
        }

        const rangeMatch = note.match(
            /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/
        );
        if (rangeMatch) {
            const [, startStr, endStr] = rangeMatch;
            const start = parseISO(startStr);
            const end = parseISO(endStr);
            return {
                disabledDays: [{ before: start }, { after: end }],
                availableLabel: `Between ${format(start, "MMM d, yyyy")} and ${format(
                    end,
                    "MMM d, yyyy"
                )}`,
            };
        }

        const singleMatch = note.match(/^\d{4}-\d{2}-\d{2}$/);
        if (singleMatch) {
            const only = parseISO(note);
            return {
                disabledDays: [{ before: only }, { after: only }],
                availableLabel: `Only ${format(only, "MMMM d, yyyy")}`,
            };
        }

        return { disabledDays: [], availableLabel: "" };
    }, [currentActivity.date_notes]);

    const timeSlots = Array.from({ length: 13 }, (_, i) => {
        const hour24 = 9 + i;
        return `${String(hour24).padStart(2, "0")}:00`;
    });

    const formatDisplay = (timeStr) => {
        const parsed = parse(timeStr, "HH:mm", new Date());
        return format(parsed, "h:mm a");
    };

    function handleSelect(dates) {
        const arr = dates || [];
        setSelectedDates(arr);
        if (arr.length) setOpenAll(false);

        setSlotsByDate((prev) =>
            arr.reduce((acc, dateObj) => {
                const key = format(dateObj, "yyyy-MM-dd");
                acc[key] = prev[key] || [];
                return acc;
            }, { ...prev })
        );
    }

    function toggleSlot(date, time) {
        setSlotsByDate((prev) => {
            const times = prev[date] || [];
            return {
                ...prev,
                [date]: times.includes(time)
                    ? times.filter((t) => t !== time)
                    : [...times, time],
            };
        });
    }

    const handleSubmit = async () => {
        if (process.env.NODE_ENV === "production") {
            mixpanel.track("Voxxy Chat 2 Completed", { name: user.name });
        }

        const availability = openAll ? { open: true } : slotsByDate;
        const notes = "LetsMeetAvailabilityResponse";

        try {
            // Always create a new response - backend will handle deleting the old one
            const res = await fetch(
                `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/responses`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        response: { activity_id: activityId, availability, notes },
                    }),
                }
            );

            if (!res.ok) {
                console.error("❌ Failed to save availability:", await res.json());
                return;
            }

            const responseData = await res.json();
            const newResponse = responseData.response;
            const newComment = responseData.comment;

            // Update user context - replace old availability response with new one
            setUser((prev) => {
                const updateActivityResponses = (activity) => {
                    if (activity.id !== activityId) return activity;

                    // Remove old availability response and add new one
                    const otherResponses = activity.responses?.filter(r =>
                        !(r.notes === "LetsMeetAvailabilityResponse" && r.user_id === user.id)
                    ) || [];

                    return {
                        ...activity,
                        responses: [...otherResponses, newResponse],
                        comments: [...(activity.comments || []), newComment]
                    };
                };

                const updActs = prev.activities.map(updateActivityResponses);
                const updPart = prev.participant_activities.map((part) => ({
                    ...part,
                    activity: updateActivityResponses(part.activity)
                }));

                return { ...prev, activities: updActs, participant_activities: updPart };
            });

            // Update parent component's currentActivity state
            if (onAvailabilityUpdate) {
                onAvailabilityUpdate(newResponse, newComment);
            }

            onClose();
        } catch (err) {
            console.error("❌ Error saving availability:", err);
        }
    };

    const canSubmit = openAll || (selectedDates.length > 0 && Object.values(slotsByDate).some(times => times.length > 0));

    // Show confirmation only if response was submitted AND this is not an update
    if (responseSubmitted && !isUpdate) {
        return (
            <ModalOverlay>
                <ModalContainer>
                    <ModalHeader>
                        <ModalTitle>
                            <CheckCircle2 size={24} />
                            Availability Submitted
                        </ModalTitle>
                        <CloseButton onClick={onClose}>
                            <X size={20} />
                        </CloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <ResponseCard>
                            <ResponseIcon>
                                <CheckCircle2 size={48} />
                            </ResponseIcon>
                            <ResponseTitle>Thank you for submitting your availability!</ResponseTitle>
                            <ResponseText>
                                Your time preferences have been saved. The organizer will use this information to find the best meeting times for everyone.
                            </ResponseText>
                        </ResponseCard>
                    </ModalBody>
                </ModalContainer>
            </ModalOverlay>
        );
    }

    return (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        <Calendar size={24} />
                        Submit Your Availability
                    </ModalTitle>
                    <CloseButton onClick={onClose}>
                        <X size={20} />
                    </CloseButton>
                </ModalHeader>

                <ModalBody>
                    <AvailabilityInfo>
                        <Calendar size={16} />
                        <span>{availableLabel}</span>
                    </AvailabilityInfo>

                    <WhiteDayPicker
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={handleSelect}
                        disabled={disabledDays}
                    />

                    <OpenAvailabilitySection>
                        <CheckboxLabel>
                            <input
                                type="checkbox"
                                checked={openAll}
                                disabled={selectedDates.length > 0}
                                onChange={(e) => setOpenAll(e.target.checked)}
                            />
                            <CheckboxIcon>
                                <Globe size={18} />
                            </CheckboxIcon>
                            <span>Open availability (any time works for me)</span>
                        </CheckboxLabel>
                    </OpenAvailabilitySection>

                    {!openAll && selectedDates.length > 0 && (
                        <TimeSlotSection>
                            <SectionTitle>
                                <Clock size={20} />
                                Select Your Available Times
                            </SectionTitle>
                            {selectedDates.map((dateObj) => {
                                const key = format(dateObj, "yyyy-MM-dd");
                                return (
                                    <DateGroup key={key}>
                                        <DateTitle>
                                            {format(dateObj, "EEEE, MMMM d, yyyy")}
                                        </DateTitle>
                                        <TimeSlotGrid>
                                            {timeSlots.map((time) => (
                                                <SlotButton
                                                    key={time}
                                                    $selected={slotsByDate[key]?.includes(time)}
                                                    onClick={() => toggleSlot(key, time)}
                                                >
                                                    {formatDisplay(time)}
                                                </SlotButton>
                                            ))}
                                        </TimeSlotGrid>
                                    </DateGroup>
                                );
                            })}
                        </TimeSlotSection>
                    )}

                    <SubmitButton onClick={handleSubmit} disabled={!canSubmit}>
                        <CheckCircle2 size={20} />
                        {isUpdate ? 'Update Availability' : 'Submit Availability'}
                    </SubmitButton>
                </ModalBody>
            </ModalContainer>
        </ModalOverlay>
    );
}