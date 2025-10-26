// frontend/src/pages/TrainerProfile.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Merged imports
import { trainerAPI, sessionAPI, ratingAPI, roadmapAPI, learnerHubAPI } from '../services/api'; // Merged imports, added learnerHubAPI
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'; // Kept from develop/HEAD
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'; // Kept Dialog components from develop/HEAD
// Merged icons from both branches
import { Star, DollarSign, Calendar, Users, Clock, CheckCircle2, AlertCircle, BookOpen, Info, Sparkles, Award, Target } from 'lucide-react';
import { getInitials, formatTime } from '../lib/utils'; // Kept formatTime from develop/HEAD
import TrainerAvailabilityCalendar from '../components/TrainerAvailabilityCalendar'; // Kept from develop/HEAD

// Kept the SelectedDateSlots component from develop/HEAD
const SelectedDateSlots = ({ date, slotsByDate, isSlotUnavailable, handleSlotClick }) => {
    if (!date) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">Select a date on the calendar to see available slots.</p>
                </CardContent>
            </Card>
        );
    }

    const dateKey = date.toDateString();
    const durationsForDate = slotsByDate[dateKey];

    const availableDurations = durationsForDate
        ? Object.keys(durationsForDate)
            .filter(duration => durationsForDate[duration].length > 0)
            .sort((a, b) => parseInt(a) - parseInt(b))
        : [];

    if (availableDurations.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <h4 className="font-semibold">{dateKey}</h4>
                    <p className="text-muted-foreground mt-2">No slots offered for this day.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-xl">{dateKey}</CardTitle>
                <CardDescription>Click any time slot to book or request custom duration</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {availableDurations.map(duration => {
                    const slots = durationsForDate[duration];
                    if (slots.length === 0) return null;

                    return (
                        <div key={duration} className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-primary/20">
                                <Clock className="h-5 w-5 text-primary" />
                                <h4 className="font-bold text-lg">
                                    {formatDuration(parseInt(duration))} Sessions
                                </h4>
                                <Badge variant="secondary" className="ml-auto">
                                    {slots.filter(s => !isSlotUnavailable(s.startTime, s.duration)).length} available
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {slots.map((slot, idx) => {
                                    const unavailable = isSlotUnavailable(slot.startTime, slot.duration);
                                    return (
                                        <Button
                                            key={`${slot.startTime}-${idx}`}
                                            variant={unavailable ? "secondary" : "outline"}
                                            onClick={() => handleSlotClick(slot)}
                                            className={`h-auto py-3 flex flex-col items-center ${
                                                unavailable
                                                    ? 'opacity-60 bg-red-50 border-red-200 hover:bg-red-100 cursor-not-allowed' // Added cursor-not-allowed
                                                    : 'hover:bg-primary hover:text-primary-foreground hover:border-primary'
                                            }`}
                                            disabled={unavailable} // Disable button if unavailable
                                        >
                                            <Clock className="h-4 w-4 mb-1" />
                                            <span className="text-sm font-medium">
                                                {formatTime(slot.startTime)}
                                            </span>
                                            {unavailable && (
                                                <span className="text-xs mt-1 text-red-600 font-medium">Blocked</span>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

// Kept formatDuration helper function from develop/HEAD
const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours}h ${mins}m`;
};

export default function TrainerProfile() {
    const { id } = useParams();
    const navigate = useNavigate(); // Kept from main
    const { user } = useAuth();
    const [trainer, setTrainer] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [availability, setAvailability] = useState([]); // Kept from develop/HEAD
    const [selectedSlot, setSelectedSlot] = useState(null); // Kept from develop/HEAD
    const [showRequestDialog, setShowRequestDialog] = useState(false); // Kept from develop/HEAD
    const [showCustomDialog, setShowCustomDialog] = useState(false); // Kept from develop/HEAD
    const [isMember, setIsMember] = useState(false); // Kept from develop/HEAD
    const [customDuration, setCustomDuration] = useState(45); // Kept from develop/HEAD
    const [conflictingSuggestions, setConflictingSuggestions] = useState([]); // Kept from develop/HEAD
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null); // Kept from develop/HEAD
    const [roadmaps, setRoadmaps] = useState([]); // Added from main

    // Kept requestData state from develop/HEAD (used for slot booking)
    const [requestData, setRequestData] = useState({
        title: '',
        description: '',
        duration: 60
    });
    // Removed bookingData state from main as it conflicts with current booking flow

    // Merged useEffect hook
    useEffect(() => {
        loadTrainerProfile();
        loadAvailability(); // Kept from develop/HEAD
        loadTrainerRoadmaps(); // Added from main
        if (user) {
            checkMembership(); // Kept from develop/HEAD
        }
    }, [id, user]); // Kept dependencies from develop/HEAD

    // Kept loadTrainerProfile (identical in both branches)
    const loadTrainerProfile = async () => {
        try {
            setLoading(true);
            const response = await trainerAPI.getTrainer(id);
            setTrainer(response.data.trainer);
            setRatings(response.data.ratings || []);
            setError(null);
        } catch (error) {
            console.error('Failed to load trainer:', error);
            setError('Failed to load trainer profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Added loadTrainerRoadmaps from main
    const loadTrainerRoadmaps = async () => {
        try {
            const response = await roadmapAPI.getTrainerRoadmaps(id);
            setRoadmaps(response.data);
        } catch (error) {
            console.error('Failed to load trainer roadmaps:', error);
            // Optionally, set an error state here if needed for roadmaps specifically
            // setError('Failed to load learning roadmaps.');
        }
    };

    // Kept loadAvailability from develop/HEAD
    const loadAvailability = async () => {
        try {
            const response = await trainerAPI.getAvailableSlots(id, {
                startDate: new Date().toISOString(),
                days: 14 // Fetch 2 weeks of slots
            });
            setAvailability(response.data || []);
        } catch (error) {
            console.error('Failed to load availability:', error);
            // Avoid overwriting a potentially more critical profile loading error
            if (!error) setError('Failed to load availability slots.');
        }
    };

    // Kept checkMembership from develop/HEAD (Ensured learnerHubAPI is used)
    const checkMembership = async () => {
        try {
            // Use the correct learnerHubAPI and endpoint name if it changed
            const hubsRes = await learnerHubAPI.getHubs({ member: true });
            const myHubIds = hubsRes.data.map(h => h._id);

            // Fetch trainer data if not already loaded to get their hubs
            const trainerData = trainer || (await trainerAPI.getTrainer(id)).data.trainer;
            const trainerHubIds = trainerData.learnerHubs?.map(h => h._id) || [];

            const hasCommonHub = myHubIds.some(hubId => trainerHubIds.includes(hubId));
            setIsMember(hasCommonHub);
        } catch (error) {
            console.error('Failed to check membership:', error);
            setIsMember(false);
            // Avoid overwriting a potentially more critical profile loading error
            if (!error) setError('Failed to check hub membership status.');
        }
    };

    // Kept isSlotUnavailable from develop/HEAD
    const isSlotUnavailable = (slotStartTime, slotDuration) => {
        const slotStart = new Date(slotStartTime);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

        // Check against confirmed booked slots
        return availability.some(bookedSlot => {
            // Important: Use the isBooked flag from the API response
            if (!bookedSlot.isBooked) return false;

            const bookedStart = new Date(bookedSlot.startTime);
            const bookedEnd = new Date(bookedStart.getTime() + bookedSlot.duration * 60000);

            // Standard overlap check
            return slotStart < bookedEnd && slotEnd > bookedStart;
        });
    };

    // Kept findAlternativeSlots from develop/HEAD
    const findAlternativeSlots = (blockedStartTime, requestedDuration) => {
        const blockedStart = new Date(blockedStartTime);
        const suggestions = [];

        const blockingSlots = availability.filter(slot => {
            if (!slot.isBooked) return false; // Only consider booked slots
            const slotStart = new Date(slot.startTime);
            const slotEnd = new Date(slotStart.getTime() + slot.duration * 60000);
            const requestedEnd = new Date(blockedStart.getTime() + requestedDuration * 60000);
            // Check for overlap
            return blockedStart < slotEnd && requestedEnd > slotStart;
        });

        if (blockingSlots.length > 0) {
            // Find the latest end time among all conflicting booked slots
            const latestEndTime = Math.max(...blockingSlots.map(s =>
                new Date(s.startTime).getTime() + s.duration * 60000
            ));

            const suggestedStartTime = new Date(latestEndTime);

            // Check if the suggested slot itself is available
            if (!isSlotUnavailable(suggestedStartTime.toISOString(), requestedDuration)) {
                suggestions.push({
                    startTime: suggestedStartTime,
                    duration: requestedDuration,
                    reason: `Available immediately after the booked slot ends` // Simplified reason
                });
            }
            // You could add logic here to find the *next* available slot of the requested duration
            // if the immediately following one is also booked.
        }

        return suggestions;
    };


    // Kept groupSlotsByDateAndDuration from develop/HEAD
    const groupSlotsByDateAndDuration = () => {
        const grouped = {};

        availability.forEach(slot => {
            const date = new Date(slot.startTime).toDateString();
            if (!grouped[date]) {
                grouped[date] = {}; // Initialize as an empty object first
            }
            // Dynamically add duration keys if they don't exist
            if (!grouped[date][slot.duration]) {
                 grouped[date][slot.duration] = [];
            }
            grouped[date][slot.duration].push(slot);
        });

        // Sort slots within each duration group by start time
        Object.keys(grouped).forEach(date => {
            Object.keys(grouped[date]).forEach(duration => {
                grouped[date][duration].sort((a, b) =>
                    new Date(a.startTime) - new Date(b.startTime)
                );
            });
        });

        return grouped;
    };


    // Kept handleSlotClick from develop/HEAD
    const handleSlotClick = (slot) => {
        if (!user) {
            alert('Please log in to book a session.');
            navigate('/login'); // Redirect to login if not logged in
            return;
        }
        if (!isMember) {
            alert('You must be a member of a common learner hub to book sessions.');
            // Optionally, you could redirect them to the hubs page or show a modal
            return;
        }

        const unavailable = isSlotUnavailable(slot.startTime, slot.duration);

        if (unavailable) {
            const suggestions = findAlternativeSlots(slot.startTime, slot.duration);
            setConflictingSuggestions(suggestions);
            setSelectedSlot(slot); // Keep track of the originally clicked slot
            setCustomDuration(slot.duration); // Default custom duration to the clicked one
            setShowCustomDialog(true); // Show the dialog with suggestions/custom options
            return; // Stop further processing
        }

        // If the slot is available, proceed to the standard request dialog
        setSelectedSlot(slot);
        setRequestData({ ...requestData, duration: slot.duration }); // Pre-fill duration
        setShowRequestDialog(true);
    };

    // Kept handleCustomBooking from develop/HEAD
    const handleCustomBooking = () => {
        if (!selectedSlot) return; // Should have the originally clicked slot

        // Validate the *custom* duration at the *original* start time
        if (isSlotUnavailable(selectedSlot.startTime, customDuration)) {
            alert(`The requested ${formatDuration(customDuration)} slot starting at ${formatTime(selectedSlot.startTime)} conflicts with another booking. Please try a different duration or time.`);
            // Keep the custom dialog open for the user to adjust
            return;
        }

        // If the custom slot is available, update the selected slot details and open the request form
        const customSlotData = {
            ...selectedSlot, // Keep original startTime
            duration: customDuration // Use the new duration
        };
        setSelectedSlot(customSlotData); // Update state to reflect the chosen custom slot
        setRequestData({ ...requestData, duration: customDuration }); // Update request data duration
        setShowCustomDialog(false); // Close custom dialog
        setShowRequestDialog(true); // Open the main request dialog
    };

    // Kept handleSuggestionClick from develop/HEAD
    const handleSuggestionClick = (suggestion) => {
        // Create a slot object based on the suggestion
        const suggestedSlot = {
            startTime: suggestion.startTime.toISOString(),
            duration: suggestion.duration,
            isBooked: false // It's available by definition if it's a suggestion
        };
        setSelectedSlot(suggestedSlot);
        setRequestData({ ...requestData, duration: suggestion.duration });
        setShowCustomDialog(false); // Close custom/suggestion dialog
        setShowRequestDialog(true); // Open the main request dialog
    };


    // Kept handleSubmitRequest from develop/HEAD
    const handleSubmitRequest = async (e) => {
        e.preventDefault();

        if (!selectedSlot) {
            alert('Error: No time slot selected.');
            return;
        }

        if (!requestData.title.trim() || !requestData.description.trim()) {
            alert('Please provide a title and description for your session request.');
            return;
        }

        // Final check just before submitting
        if (isSlotUnavailable(selectedSlot.startTime, requestData.duration)) {
            alert('Sorry, this time slot became unavailable just now. Please choose another time.');
            setShowRequestDialog(false);
            setSelectedSlot(null); // Clear selection
            loadAvailability(); // Refresh slots
            return;
        }

        try {
            await sessionAPI.createRequest({
                trainerId: id,
                requestedSlot: selectedSlot.startTime, // Send ISO string
                duration: requestData.duration,
                title: requestData.title,
                description: requestData.description
            });

            alert('Session request sent successfully! The trainer will review and respond.');
            setShowRequestDialog(false);
            // Reset form and selection
            setRequestData({ title: '', description: '', duration: 60 });
            setSelectedSlot(null);
            setSelectedDate(null); // Deselect date on calendar
            // Refresh availability data to reflect the pending request (though it won't show as blocked yet)
            loadAvailability();
        } catch (error) {
            console.error('Failed to create session request:', error);
            alert(error.response?.data?.message || 'An error occurred while sending the request.');
        }
    };


    if (loading) return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
                <p className="text-muted-foreground">Loading trainer profile...</p>
                 {/* Consider adding a spinner here */}
            </div>
        </div>
    );

    if (error) return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16 text-red-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-xl font-semibold">Error Loading Profile</p>
                <p>{error}</p>
                <Button onClick={loadTrainerProfile} className="mt-4">Try Again</Button>
            </div>
        </div>
    );

    if (!trainer) return null; // Should be handled by loading/error states

    // --- Kept calculations from develop/HEAD ---
    const slotsByDateAndDuration = groupSlotsByDateAndDuration();
    const hasAnyAvailability = availability.length > 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Sidebar - Kept structure from develop/HEAD */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <Avatar className="h-32 w-32 mx-auto mb-4">
                                    <AvatarImage src={trainer.avatar} alt={trainer.name} />
                                    <AvatarFallback className="text-3xl">{getInitials(trainer.name)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-bold">{trainer.name}</h2>
                                <p className="text-muted-foreground mt-2">{trainer.bio || "No bio provided."}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-center gap-2">
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-2xl font-bold">{trainer.averageRating?.toFixed(1) || 'N/A'}</span>
                                    <span className="text-muted-foreground">({trainer.totalRatings || 0} reviews)</span>
                                </div>

                                <div className="flex items-center justify-center gap-6 text-sm">
                                    <div className="text-center">
                                        <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                        <p className="font-semibold">{trainer.trainerProfile?.totalStudents || 0}</p>
                                        <p className="text-muted-foreground">Students</p>
                                    </div>
                                    <div className="text-center">
                                        <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                        <p className="font-semibold">{trainer.trainerProfile?.totalSessions || 0}</p>
                                        <p className="text-muted-foreground">Sessions</p>
                                    </div>
                                </div>

                                {trainer.trainerProfile?.pricing?.hourlyRate && (
                                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                                            <DollarSign className="h-5 w-5" />
                                            <span>{trainer.trainerProfile.pricing.hourlyRate}</span>
                                            <span className="text-base font-normal">/hour</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                             {/* Membership Check UI from develop/HEAD */}
                            {user && ( // Only show membership status if user is logged in
                             isMember ? (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-green-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="font-medium">Hub member - can book sessions</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2 text-sm text-amber-700">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Not a hub member</p>
                                            <p className="text-xs mt-1">Join a common learner hub to book sessions with this trainer.</p>
                                             {/* Optionally add a link/button to explore hubs */}
                                             <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => navigate('/hubs')}>Explore Hubs</Button>
                                        </div>
                                    </div>
                                </div>
                            )
                            )}
                             {!user && ( // Prompt to log in if not logged in
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-2 text-sm text-blue-700">
                                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Log in to book sessions</p>
                                            <p className="text-xs mt-1">You need to be logged in and a member of a common hub.</p>
                                            <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => navigate('/login')}>Log In / Sign Up</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* View Slots Button from develop/HEAD */}
                            {user && isMember && (
                                <Button className="w-full" size="lg" onClick={() => {
                                    document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    View Available Slots
                                </Button>
                            )}
                             {/* Removed the DialogTrigger/Booking Button from main */}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content - Tabs structure from develop/HEAD */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Added a 5th tab for Roadmaps */}
                    <Tabs defaultValue="availability" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="availability">Availability</TabsTrigger>
                            <TabsTrigger value="expertise">Expertise</TabsTrigger>
                            <TabsTrigger value="programs">Programs</TabsTrigger>
                            <TabsTrigger value="roadmaps">Roadmaps</TabsTrigger> {/* New Tab */}
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        </TabsList>

                        {/* Availability Tab - Kept from develop/HEAD */}
                        <TabsContent value="availability" id="availability-section" className="space-y-6">
                             {/* Logic to show different states based on login and membership */}
                            {!user ? (
                                 <Card>
                                    <CardContent className="text-center py-16">
                                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                                        <h3 className="text-2xl font-semibold mb-2">Log In Required</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Please log in or sign up to view availability and book sessions.
                                        </p>
                                        <Button onClick={() => navigate('/login')}>Log In / Sign Up</Button>
                                    </CardContent>
                                </Card>
                            ) : !isMember ? (
                                <Card>
                                    <CardContent className="text-center py-16">
                                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                                        <h3 className="text-2xl font-semibold mb-2">Join a Hub to View Availability</h3>
                                        <p className="text-muted-foreground mb-4">
                                            You must be a member of a common learner hub to book sessions.
                                        </p>
                                        <Button onClick={() => navigate('/hubs')}>Explore Learner Hubs</Button>
                                    </CardContent>
                                </Card>
                            ) : !hasAnyAvailability ? (
                                <Card>
                                    <CardContent className="text-center py-16">
                                        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                        <h3 className="text-2xl font-semibold mb-2">No Available Slots</h3>
                                        <p className="text-muted-foreground">
                                            This trainer hasn't set up their availability or has no upcoming slots. Check back later!
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    <Card className="bg-blue-50 border-blue-200">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-2">
                                                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-blue-900">How it works</p>
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        Select a date on the calendar. Dots indicate availability:
                                                        <span className="inline-block h-2 w-2 rounded-full bg-green-500 mx-1"></span>Green = Fully available,
                                                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mx-1"></span>Yellow = Partially booked,
                                                        <span className="inline-block h-2 w-2 rounded-full bg-red-500 mx-1"></span>Red = Fully booked.
                                                        Click a time slot below to request a session.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-0 flex justify-center">
                                            <TrainerAvailabilityCalendar
                                                availability={availability}
                                                // Ensure a default date is selected if none is chosen
                                                onDateSelect={(date) => setSelectedDate(date || null)}
                                            />
                                        </CardContent>
                                    </Card>

                                    <SelectedDateSlots
                                        date={selectedDate}
                                        slotsByDate={slotsByDateAndDuration}
                                        isSlotUnavailable={isSlotUnavailable}
                                        handleSlotClick={handleSlotClick}
                                    />
                                </>
                            )}
                        </TabsContent>

                        {/* Expertise Tab - Kept from develop/HEAD */}
                        <TabsContent value="expertise">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Expertise & Experience</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-3 text-lg">Domains</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {trainer.trainerProfile?.domain?.length > 0 ? (
                                                trainer.trainerProfile.domain.map((domain, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                                                        {domain}
                                                    </Badge>
                                                ))
                                             ) : (
                                                <p className="text-muted-foreground text-sm">No domains listed.</p>
                                             )}
                                        </div>
                                    </div>

                                    {trainer.trainerProfile?.experience && (
                                        <div>
                                            <h3 className="font-semibold mb-2 text-lg">Experience</h3>
                                            <p className="text-muted-foreground">
                                                {trainer.trainerProfile.experience} years of professional experience
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="font-semibold mb-2 text-lg">Associated Learner Hubs</h3>
                                        <div className="space-y-2">
                                            {trainer.learnerHubs && trainer.learnerHubs.length > 0 ? (
                                                trainer.learnerHubs.map((hub) => ( // Use hub._id for key
                                                    <div key={hub._id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {/* Make hub name clickable */}
                                                        <span className="font-medium hover:underline cursor-pointer" onClick={() => navigate(`/hubs/${hub._id}`)}>
                                                            {hub.name}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Not currently associated with any hubs.</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Programs Tab - Kept from develop/HEAD */}
                        <TabsContent value="programs">
                             {trainer.trainerProfile?.pricing?.programs?.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Training Programs</CardTitle>
                                        <CardDescription>Structured learning programs offered by this trainer</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {trainer.trainerProfile.pricing.programs.map((program, idx) => (
                                                <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-lg">{program.title}</h4>
                                                        <Badge>{program.type || 'Standard'}</Badge> {/* Added default type */}
                                                    </div>
                                                    <p className="text-muted-foreground text-sm mb-3">{program.description}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-muted-foreground">{program.duration}</span>
                                                        <span className="text-lg font-bold text-primary">${program.price}</span>
                                                    </div>
                                                    {/* Consider adding a 'Learn More' or 'Enroll' button if applicable */}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="text-center py-16 text-muted-foreground">
                                         <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>This trainer hasn't added any specific programs yet.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Roadmaps Tab - Added logic from main */}
                         <TabsContent value="roadmaps">
                            {roadmaps.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />
                                            Learning Roadmaps by {trainer.name}
                                        </CardTitle>
                                        <CardDescription>Structured learning paths created by this trainer</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {roadmaps.map((roadmap) => (
                                                <div
                                                    key={roadmap._id}
                                                    className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-white"
                                                    onClick={() => navigate(`/roadmaps/${roadmap._id}`)} // Navigate on click
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-lg text-primary">{roadmap.title}</h4>
                                                        {/* Add appropriate badge, maybe based on status if available */}
                                                        {/* <Badge variant="outline">Trainer Roadmap</Badge> */}
                                                    </div>
                                                    <p className="text-muted-foreground text-sm mb-3">{roadmap.description}</p>

                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <Badge variant="secondary">{roadmap.category || 'General'}</Badge>
                                                        <Badge variant={
                                                            roadmap.difficulty === 'Beginner' ? 'default' :
                                                            roadmap.difficulty === 'Intermediate' ? 'secondary' : 'destructive'
                                                        }>{roadmap.difficulty}</Badge>
                                                        {roadmap.estimatedDuration && (
                                                            <Badge variant="outline" className="flex items-center">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {roadmap.estimatedDuration}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                     {/* Removed schedule details as they might not be relevant for public view */}

                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3 mt-3">
                                                        <span className="flex items-center gap-1">
                                                            <Target className="w-4 h-4 text-blue-500" />
                                                            {roadmap.milestones?.length || 0} milestones
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4 text-green-500" />
                                                            {roadmap.usedBy || 0} learners adopted
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                             ) : (
                                <Card>
                                    <CardContent className="text-center py-16 text-muted-foreground">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>This trainer hasn't published any learning roadmaps yet.</p>
                                    </CardContent>
                                </Card>
                             )}
                        </TabsContent>


                        {/* Reviews Tab - Kept from develop/HEAD */}
                        <TabsContent value="reviews">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reviews ({ratings.length})</CardTitle>
                                    <CardDescription>What learners say about {trainer.name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {ratings.length > 0 ? (
                                            ratings.map((rating) => (
                                                <div key={rating._id} className="p-4 border rounded-lg bg-white shadow-sm">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={rating.learner?.avatar} alt={rating.learner?.name || 'User'}/>
                                                            <AvatarFallback>{getInitials(rating.learner?.name || 'U')}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{rating.learner?.name || 'Anonymous Learner'}</p>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`h-4 w-4 ${
                                                                            i < rating.rating
                                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                                : 'text-gray-300'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(rating.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{rating.review || "No comment provided."}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">No reviews yet for this trainer.</p>
                                        )}
                                    </div>
                                    {/* Consider adding pagination or a 'Load More' button if there can be many reviews */}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* --- DIALOGS (Kept from develop/HEAD) --- */}

             {/* Custom Duration / Suggestion Dialog */}
            <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Time Slot Options
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedSlot && ( // Ensure selectedSlot is not null
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-amber-900">Selected time slot is unavailable</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            {formatTime(selectedSlot.startTime)} for {formatDuration(selectedSlot.duration)} is currently booked.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {conflictingSuggestions.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Suggested Alternative Times:</Label>
                                {conflictingSuggestions.map((suggestion, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="w-full justify-start h-auto py-3 border-green-300 hover:bg-green-50 text-green-800"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                            <div className="text-left flex-1">
                                                <p className="font-medium">
                                                    {formatTime(suggestion.startTime.toISOString())} - {formatDuration(suggestion.duration)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="border-t pt-4">
                            <Label className="text-sm font-semibold mb-3 block">Or Request Custom Duration at {selectedSlot ? formatTime(selectedSlot.startTime) : 'selected time'}:</Label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        min="15" // Minimum duration
                                        max="180" // Maximum duration
                                        step="15" // Increment steps
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(Math.max(15, parseInt(e.target.value) || 15))} // Ensure valid number
                                        className="flex-1"
                                    />
                                    <span className="text-sm text-muted-foreground">minutes</span>
                                </div>

                                <div className="flex gap-2 flex-wrap"> {/* Added flex-wrap */}
                                    {[30, 45, 60, 90, 120].map(dur => ( // Added 120min option
                                        <Button
                                            key={dur}
                                            type="button"
                                            size="sm"
                                            variant={customDuration === dur ? "default" : "outline"}
                                            onClick={() => setCustomDuration(dur)}
                                        >
                                            {formatDuration(dur)} {/* Show formatted duration */}
                                        </Button>
                                    ))}
                                </div>

                                {trainer.trainerProfile?.pricing?.hourlyRate && customDuration > 0 && ( // Check customDuration > 0
                                    <div className="p-3 bg-gray-100 rounded-lg border">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Estimated Cost:</span>
                                            <span className="font-bold text-primary text-lg">
                                                ${((trainer.trainerProfile.pricing.hourlyRate * customDuration) / 60).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCustomDialog(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleCustomBooking}
                                        className="flex-1"
                                        disabled={!selectedSlot} // Disable if no slot selected
                                    >
                                        Request Custom Slot
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Request Session Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                 <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Request Session Details</DialogTitle>
                         <CardDescription>
                            Confirm details for your session request at {selectedSlot ? formatTime(selectedSlot.startTime) : ''} for {formatDuration(requestData.duration)}.
                        </CardDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitRequest} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="title">Session Goal / Title *</Label>
                            <Input
                                id="title"
                                value={requestData.title}
                                onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                                placeholder="e.g., React Hooks basics, Debugging session"
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">What you want to learn/cover *</Label>
                            <Textarea
                                id="description"
                                value={requestData.description}
                                onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                                placeholder="Briefly describe the topics or specific questions you have."
                                required
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        {trainer.trainerProfile?.pricing?.hourlyRate && requestData.duration > 0 && (
                            <div className="p-3 bg-gray-100 rounded-lg border">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Estimated Session Cost:</span>
                                    <span className="font-bold text-primary text-lg">
                                        ${((trainer.trainerProfile.pricing.hourlyRate * requestData.duration) / 60).toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Payment will be processed upon session completion.</p>
                            </div>
                        )}
                        <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={!selectedSlot}> {/* Disable if no slot */}
                                Send Request
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
