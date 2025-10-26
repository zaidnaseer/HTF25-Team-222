// frontend/src/components/TrainerAvailabilityCalendar.jsx

import { useMemo, useState } from 'react';
import { Calendar } from './ui/calendar'; 
// --- No longer importing from 'react-day-picker' ---

/**
 * Calculates the booking status for each day.
 * @param {Array} availability - The array of availability slots from the API.
 * @returns {Map<string, 'green' | 'yellow' | 'red' | 'none'>} A map where the key is
 * the date string and the value is the status.
 */
const getDayStatuses = (availability) => {
    const dailySlots = new Map();

    // 1. Group slots by day
    availability.forEach(slot => {
        const dateKey = new Date(slot.startTime).toDateString();
        if (!dailySlots.has(dateKey)) {
            dailySlots.set(dateKey, { total: 0, booked: 0 });
        }
        const day = dailySlots.get(dateKey);
        day.total += 1;
        if (slot.isBooked) {
            day.booked += 1;
        }
    });

    // 2. Determine status for each day
    const statuses = new Map();
    dailySlots.forEach((day, dateKey) => {
        if (day.total === 0) {
            statuses.set(dateKey, 'none'); // No slots offered
        } else if (day.booked === 0) {
            statuses.set(dateKey, 'green'); // All available
        } else if (day.booked === day.total) {
            statuses.set(dateKey, 'red'); // Fully booked
        } else {
            statuses.set(dateKey, 'yellow'); // Partially booked
        }
    });
    return statuses;
};

// Custom component to render the day's content (the number) and a status dot
function CustomDayContent(props) {
    // 'props' here are DayContentProps, which include 'date' and 'activeModifiers'
    const { date, activeModifiers, dayStatuses } = props;
    
    if (!date) return <></>; // Should not happen, but good guard

    const dateKey = date.toDateString();
    const status = dayStatuses.get(dateKey);

    return (
        <div className="relative">
            {/* Render the day number */}
            {date.getDate()}
            
            {/* * FIX: Removed '!activeModifiers.disabled' check.
            * This was preventing the dot from showing on the current day,
            * even when it was selected (and thus not truly disabled for interaction).
            */}
            {status && status !== 'none' && (
                <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${
                    status === 'green' ? 'bg-green-500' :
                    status === 'yellow' ? 'bg-yellow-500' :
                    status === 'red' ? 'bg-red-500' : ''
                }`} />
            )}
        </div>
    );
}

export default function TrainerAvailabilityCalendar({ availability, onDateSelect }) {
    const [month, setMonth] = useState(new Date());

    // Memoize statuses to avoid re-calculating on every render
    const dayStatuses = useMemo(() => getDayStatuses(availability), [availability]);

    // FIX: Disable days *before* the start of today (midnight).
    // This prevents the current day from being marked as disabled.
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const disabledDays = { before: startOfToday };

    // This wrapper function lets us pass our 'dayStatuses' map
    // into the props for our custom component.
    const dayContentWithStatus = (props) => {
        return <CustomDayContent {...props} dayStatuses={dayStatuses} />
    }

    return (
        <Calendar
            mode="single"
            onSelect={onDateSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={disabledDays}
            components={{
                // Pass our custom component to the 'DayContent' slot
                // This replaces the default day number renderer
                DayContent: dayContentWithStatus,
            }}
            className="p-4"
        />
    );
}
