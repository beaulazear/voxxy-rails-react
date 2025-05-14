import React, { useState, useContext, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse, parseISO } from "date-fns";
import styled from "styled-components";
import mixpanel from "mixpanel-browser";
import { UserContext } from "../context/user";

const SchedulerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: auto;
`;

const WhiteDayPicker = styled(DayPicker)`
  .rdp-month {
    background: transparent;
  }
  .rdp-caption_label,
  .rdp-nav_button,
  .rdp-month table thead th,
  .rdp-day {
    color: #fff !important;
  }
  --rdp-accent-color: #7b298d;
  --rdp-accent-color-hover: #7b298d;
  --rdp-day-selected-background: #7b298d;
  --rdp-day-selected-color: #fff;
`;

const SlotButton = styled.button`
  margin: 0.25rem;
  padding: 0.4rem 0.8rem;
  border: ${({ $selected }) =>
        $selected ? "2px solid #7b298d" : "1px solid #444"};
  background: ${({ $selected }) =>
        $selected ? "#7b298d20" : "#2a2a2a"};
  color: #fff;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  &:hover {
    background: #7b298d10;
    border-color: #7b298d;
  }
`;

const SubmitButton = styled.button`
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background: #7b298d;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  &:hover {
    background: #5c216d;
  }
`;

export default function LetsMeetScheduler({ activityId, currentActivity, responseSubmitted, onClose }) {
    const { user, setUser } = useContext(UserContext);

    const [selectedDates, setSelectedDates] = useState([]);
    const [slotsByDate, setSlotsByDate] = useState({});
    const [openAll, setOpenAll] = useState(false);

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
            const newResponse = await res.json();
            setUser((prev) => {
                const updActs = prev.activities.map((act) =>
                    act.id === activityId
                        ? { ...act, responses: [...(act.responses || []), newResponse] }
                        : act
                );
                const updPart = prev.participant_activities.map((part) =>
                    part.activity.id === activityId
                        ? {
                            ...part,
                            activity: {
                                ...part.activity,
                                responses: [...(part.activity.responses || []), newResponse],
                            },
                        }
                        : part
                );
                return { ...prev, activities: updActs, participant_activities: updPart };
            });
            onClose()
        } catch (err) {
            console.error("❌ Error saving availability:", err);
        }
    };

    if (responseSubmitted) {
        return (
            <p style={{ color: '#fff', margin: '1.5rem'}}>Thank you for submitting your availability! 🎉 Pin your top available times so users can vote on them.</p>
        );
    }

    return (
        <SchedulerWrapper>
            <h3 style={{ color: "#fff" }}>Submit Your Availability</h3>
            <p style={{ color: "#ddd", fontStyle: "italic" }}>{availableLabel}</p>

            <WhiteDayPicker
                mode="multiple"
                selected={selectedDates}
                onSelect={handleSelect}
                disabled={disabledDays}
            />

            <label style={{ color: "#fff", margin: "1rem 0" }}>
                <input
                    type="checkbox"
                    checked={openAll}
                    disabled={selectedDates.length > 0}
                    onChange={(e) => setOpenAll(e.target.checked)}
                />{" "}
                Open availability (any time)
            </label>

            {!openAll && selectedDates.length > 0 && (
                <>
                    <h4 style={{ color: "#fff" }}>Pick time slots</h4>
                    {selectedDates.map((dateObj) => {
                        const key = format(dateObj, "yyyy-MM-dd");
                        return (
                            <div
                                key={key}
                                style={{ marginBottom: "1rem", width: "100%" }}
                            >
                                <strong style={{ color: "#fff" }}>
                                    {format(dateObj, "MMMM d, yyyy")}
                                </strong>
                                <div style={{ display: "flex", flexWrap: "wrap" }}>
                                    {timeSlots.map((time) => (
                                        <SlotButton
                                            key={time}
                                            $selected={slotsByDate[key]?.includes(time)}
                                            onClick={() => toggleSlot(key, time)}
                                        >
                                            {formatDisplay(time)}
                                        </SlotButton>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            <SubmitButton onClick={handleSubmit}>
                Submit Availability
            </SubmitButton>
        </SchedulerWrapper>
    );
}