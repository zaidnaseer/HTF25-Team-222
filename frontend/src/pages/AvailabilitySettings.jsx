import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';

// Mock API - replace with your actual API
const trainerAPI = {
    getAvailability: async () => ({
        data: {
            availability: {
                recurring: [
                    { dayOfWeek: 1, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
                    { dayOfWeek: 2, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
                    { dayOfWeek: 3, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
                    { dayOfWeek: 4, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
                    { dayOfWeek: 5, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
                    { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', sessionDurations: [30, 60], enabled: false },
                    { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', sessionDurations: [30, 60], enabled: false }
                ],
                exceptions: [],
                timezone: 'Asia/Kolkata'
            }
        }
    }),
    updateAvailability: async (data) => ({ success: true })
};

export default function AvailabilitySettings() {
    const [availability, setAvailability] = useState({
        recurring: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
            { dayOfWeek: 2, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
            { dayOfWeek: 3, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
            { dayOfWeek: 4, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
            { dayOfWeek: 5, startTime: '18:00', endTime: '21:00', sessionDurations: [30, 60], enabled: false },
            { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', sessionDurations: [30, 60], enabled: false },
            { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', sessionDurations: [30, 60], enabled: false }
        ],
        exceptions: [],
        timezone: 'Asia/Kolkata'
    });

    const [blockedDates, setBlockedDates] = useState([]);
    const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            const response = await trainerAPI.getAvailability('me');
            if (response.data && response.data.availability) {
                setAvailability(response.data.availability);
                setBlockedDates(response.data.availability.exceptions?.filter(e => e.type === 'blocked') || []);
            }
        } catch (error) {
            console.error('Failed to load availability:', error);
        }
    };

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Format duration with proper labels
    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} mins`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        return `${hours}h ${mins}m`;
    };

    // Validate time slots for overlaps and conflicts
    const validateTimeSlots = (dayIndex) => {
        const day = availability.recurring[dayIndex];
        const errors = [];

        if (!day.enabled) return errors;

        const startMins = timeToMinutes(day.startTime);
        const endMins = timeToMinutes(day.endTime);

        // Check if end time is after start time
        if (endMins <= startMins) {
            errors.push('End time must be after start time');
        }

        // Check if duration can fit in the time slot
        const duration = endMins - startMins;
        const minDuration = Math.min(...day.sessionDurations);
        
        if (day.sessionDurations.length > 0 && duration < minDuration) {
            errors.push(`Time slot (${duration} mins) is too short for the selected session durations`);
        }

        // Check for potential overlapping slots with different durations
        if (day.sessionDurations.length > 1) {
            const hasPotentialOverlap = checkDurationOverlaps(day.sessionDurations, duration);
            if (hasPotentialOverlap) {
                errors.push('Warning: Different session durations may create overlapping time slots');
            }
        }

        return errors;
    };

    // Check if different durations might cause overlaps
    const checkDurationOverlaps = (durations, totalDuration) => {
        // This is a simplified check - you might want more sophisticated logic
        const sortedDurations = [...durations].sort((a, b) => a - b);
        
        // Check if any combination of durations could overlap
        for (let i = 0; i < sortedDurations.length - 1; i++) {
            const smallerDuration = sortedDurations[i];
            const largerDuration = sortedDurations[i + 1];
            
            // If the difference between durations is less than the smaller duration,
            // they might create overlapping slots
            if (largerDuration - smallerDuration < smallerDuration) {
                return true;
            }
        }
        
        return false;
    };

    const toggleDay = (dayIndex) => {
        const updated = [...availability.recurring];
        updated[dayIndex].enabled = !updated[dayIndex].enabled;
        setAvailability({ ...availability, recurring: updated });
        
        // Validate after toggling
        if (updated[dayIndex].enabled) {
            const errors = validateTimeSlots(dayIndex);
            setValidationErrors({ ...validationErrors, [dayIndex]: errors });
        } else {
            const newErrors = { ...validationErrors };
            delete newErrors[dayIndex];
            setValidationErrors(newErrors);
        }
    };

    const updateTimeSlot = (dayIndex, field, value) => {
        const updated = [...availability.recurring];
        updated[dayIndex][field] = value;
        setAvailability({ ...availability, recurring: updated });
        
        // Validate after time change
        const errors = validateTimeSlots(dayIndex);
        setValidationErrors({ ...validationErrors, [dayIndex]: errors });
    };

    const toggleDuration = (dayIndex, duration) => {
        const updated = [...availability.recurring];
        const durations = updated[dayIndex].sessionDurations;
        
        if (durations.includes(duration)) {
            updated[dayIndex].sessionDurations = durations.filter(d => d !== duration);
        } else {
            updated[dayIndex].sessionDurations = [...durations, duration].sort((a, b) => a - b);
        }
        
        setAvailability({ ...availability, recurring: updated });
        
        // Validate after duration change
        const errors = validateTimeSlots(dayIndex);
        setValidationErrors({ ...validationErrors, [dayIndex]: errors });
    };

    const addBlockedDate = () => {
        if (!newBlockedDate.date) {
            alert('Please select a date');
            return;
        }

        // Check if date is already blocked
        if (blockedDates.some(d => d.date === newBlockedDate.date)) {
            alert('This date is already blocked');
            return;
        }

        const newException = {
            date: newBlockedDate.date,
            type: 'blocked',
            reason: newBlockedDate.reason || 'Not available'
        };

        setBlockedDates([...blockedDates, newException].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        ));
        setNewBlockedDate({ date: '', reason: '' });
    };

    const removeBlockedDate = (index) => {
        setBlockedDates(blockedDates.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        // Final validation before saving
        const hasErrors = Object.values(validationErrors).some(errors => errors.length > 0);
        const hasEnabledDays = availability.recurring.some(d => d.enabled);
        
        if (!hasEnabledDays) {
            alert('Please enable at least one day of the week');
            return;
        }

        if (hasErrors) {
            alert('Please fix all validation errors before saving');
            return;
        }

        // Check if any enabled day has no session durations selected
        const hasInvalidDurations = availability.recurring.some(
            d => d.enabled && d.sessionDurations.length === 0
        );
        
        if (hasInvalidDurations) {
            alert('Please select at least one session duration for each active day');
            return;
        }

        try {
            setSaving(true);
            const dataToSave = {
                ...availability,
                exceptions: blockedDates
            };

            await trainerAPI.updateAvailability(dataToSave);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save availability:', error);
            alert(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const getTotalWeeklyHours = () => {
        return availability.recurring
            .filter(d => d.enabled)
            .reduce((total, day) => {
                const startMins = timeToMinutes(day.startTime);
                const endMins = timeToMinutes(day.endTime);
                return total + (endMins - startMins) / 60;
            }, 0)
            .toFixed(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 pt-4">
                    <h1 className="text-4xl font-bold mb-2 text-gray-900">Availability Settings</h1>
                    <p className="text-gray-600">
                        Set your recurring availability and block off specific dates
                    </p>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-800 font-medium">Availability settings saved successfully!</span>
                    </div>
                )}

                {/* Weekly Availability */}
                <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-500">
                        <h2 className="text-2xl font-bold text-white">Weekly Availability</h2>
                        <p className="text-blue-100 mt-1">
                            Set your regular weekly schedule. Learners will only see these time slots when booking.
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        {availability.recurring.map((day, index) => (
                            <div key={day.dayOfWeek} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={day.enabled}
                                            onChange={() => toggleDay(index)}
                                            className="h-5 w-5 rounded border-gray-300 cursor-pointer text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="font-semibold text-lg text-gray-900">{dayNames[day.dayOfWeek]}</span>
                                    </div>
                                    {day.enabled && (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                            Active
                                        </span>
                                    )}
                                </div>

                                {day.enabled && (
                                    <div className="space-y-4 ml-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-2">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={day.startTime}
                                                    onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-2">End Time</label>
                                                <input
                                                    type="time"
                                                    value={day.endTime}
                                                    onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                                Session Durations
                                                <span className="text-gray-500 font-normal ml-2">(Select one or more)</span>
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {[30, 60, 90].map(duration => (
                                                    <button
                                                        key={duration}
                                                        type="button"
                                                        onClick={() => toggleDuration(index, duration)}
                                                        className={`px-4 py-2 rounded-md font-medium transition-all ${
                                                            day.sessionDurations.includes(duration)
                                                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                                                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        <Clock className="inline h-4 w-4 mr-1" />
                                                        {formatDuration(duration)}
                                                    </button>
                                                ))}
                                            </div>
                                            {day.sessionDurations.length === 0 && (
                                                <p className="text-amber-600 text-sm mt-2 flex items-center gap-1">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Please select at least one session duration
                                                </p>
                                            )}
                                        </div>

                                        {/* Time slot summary */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                            <p className="text-sm text-blue-900">
                                                <Clock className="inline h-4 w-4 mr-1" />
                                                Available for <strong>{((timeToMinutes(day.endTime) - timeToMinutes(day.startTime)) / 60).toFixed(1)} hours</strong>
                                                {day.sessionDurations.length > 0 && (
                                                    <span className="ml-2">
                                                        with sessions of {day.sessionDurations.map(formatDuration).join(', ')}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Validation Errors */}
                                        {validationErrors[index] && validationErrors[index].length > 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
                                                {validationErrors[index].map((error, i) => (
                                                    <p key={i} className="text-sm text-red-800 flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        {error}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Blocked Dates */}
                <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-pink-500">
                        <h2 className="text-2xl font-bold text-white">Block Specific Dates</h2>
                        <p className="text-red-100 mt-1">
                            Add dates when you'll be unavailable (holidays, vacations, etc.)
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Date</label>
                                <input
                                    type="date"
                                    value={newBlockedDate.date}
                                    onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Reason (Optional)</label>
                                <input
                                    placeholder="e.g., Holiday, Vacation"
                                    value={newBlockedDate.reason}
                                    onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <button 
                                    onClick={addBlockedDate}
                                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Date
                                </button>
                            </div>
                        </div>

                        {blockedDates.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <label className="text-sm font-medium text-gray-700 block">Blocked Dates:</label>
                                {blockedDates.map((blocked, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-red-600" />
                                            <span className="font-medium text-gray-900">
                                                {new Date(blocked.date + 'T00:00:00').toLocaleDateString('en-US', { 
                                                    weekday: 'short',
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </span>
                                            {blocked.reason && (
                                                <span className="text-sm text-gray-600">• {blocked.reason}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removeBlockedDate(index)}
                                            className="p-2 hover:bg-red-100 rounded-md transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg mb-6 p-6 text-white">
                    <h3 className="text-xl font-bold mb-4">Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <p className="text-blue-100 text-sm mb-1">Active Days</p>
                            <p className="text-3xl font-bold">
                                {availability.recurring.filter(d => d.enabled).length}
                            </p>
                            <p className="text-blue-100 text-xs mt-1">days per week</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <p className="text-blue-100 text-sm mb-1">Weekly Hours</p>
                            <p className="text-3xl font-bold">{getTotalWeeklyHours()}</p>
                            <p className="text-blue-100 text-xs mt-1">hours available</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <p className="text-blue-100 text-sm mb-1">Blocked Dates</p>
                            <p className="text-3xl font-bold">{blockedDates.length}</p>
                            <p className="text-blue-100 text-xs mt-1">dates unavailable</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm text-blue-100">
                            <strong>Timezone:</strong> {availability.timezone}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pb-8">
                    <button 
                        onClick={handleSave} 
                        disabled={saving || Object.values(validationErrors).some(errors => errors.length > 0)}
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save className="h-5 w-5" />
                        {saving ? 'Saving...' : 'Save Availability Settings'}
                    </button>
                    <button 
                        onClick={() => window.location.href = '/trainer/dashboard'}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
