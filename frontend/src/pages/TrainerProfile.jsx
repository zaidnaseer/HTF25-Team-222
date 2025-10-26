// frontend/src/pages/TrainerProfile.jsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trainerAPI, sessionAPI, learnerHubAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Star, DollarSign, Calendar, Users, Clock, CheckCircle2, AlertCircle, BookOpen, Info, Sparkles } from 'lucide-react';
import { getInitials, formatTime } from '../lib/utils';
// --- NEW IMPORTS ---
import TrainerAvailabilityCalendar from '../components/TrainerAvailabilityCalendar';

// --- NEW SUB-COMPONENT ---
// This component renders the slots for the *selected day*
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
                                                    ? 'opacity-60 bg-red-50 border-red-200 hover:bg-red-100' 
                                                    : 'hover:bg-primary hover:text-primary-foreground hover:border-primary'
                                            }`}
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

// Helper function (already in your file)
const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours}h ${mins}m`;
};


export default function TrainerProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const [trainer, setTrainer] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [showCustomDialog, setShowCustomDialog] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [customDuration, setCustomDuration] = useState(45);
    const [conflictingSuggestions, setConflictingSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- NEW STATE for Calendar ---
    const [selectedDate, setSelectedDate] = useState(null); // Start with null
    
    const [requestData, setRequestData] = useState({
        title: '',
        description: '',
        duration: 60
    });

    useEffect(() => {
        loadTrainerProfile();
        loadAvailability();
        if (user) {
            checkMembership();
        }
    }, [id, user]);

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

    const loadAvailability = async () => {
        try {
            const response = await trainerAPI.getAvailableSlots(id, {
                startDate: new Date().toISOString(),
                days: 14 // You might want to fetch more days for a calendar view, e.g., 30 or 60
            });
            setAvailability(response.data || []);
        } catch (error) {
            console.error('Failed to load availability:', error);
            setError('Failed to load availability slots.');
        }
    };

    const checkMembership = async () => {
        try {
            const hubsRes = await learnerHubAPI.getHubs({ member: true });
            const myHubIds = hubsRes.data.map(h => h._id);
            
            const trainerData = trainer || (await trainerAPI.getTrainer(id)).data.trainer;
            const trainerHubIds = trainerData.learnerHubs?.map(h => h._id) || [];
            
            const hasCommonHub = myHubIds.some(hubId => trainerHubIds.includes(hubId));
            setIsMember(hasCommonHub);
        } catch (error) {
            console.error('Failed to check membership:', error);
            setIsMember(false);
            setError('Failed to check hub membership.');
        }
    };

    // --- (This function is moved up to be used by SelectedDateSlots) ---
    // const formatDuration = (minutes) => { ... };

    const isSlotUnavailable = (slotStartTime, slotDuration) => {
        const slotStart = new Date(slotStartTime);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

        // Check against *only* booked slots
        // This logic is correct based on your request: "only after getting approving then
        // only the availbility should show booked(blocked)"
        // We assume `isBooked: true` means it's approved and booked.
        return availability.some(bookedSlot => {
            if (!bookedSlot.isBooked) return false;
            
            const bookedStart = new Date(bookedSlot.startTime);
            const bookedEnd = new Date(bookedStart.getTime() + bookedSlot.duration * 60000);

            // Standard overlap check
            return slotStart < bookedEnd && slotEnd > bookedStart;
        });
    };

    const findAlternativeSlots = (blockedStartTime, requestedDuration) => {
        const blockedStart = new Date(blockedStartTime);
        const suggestions = [];

        const blockingSlots = availability.filter(slot => {
            if (!slot.isBooked) return false;
            const slotStart = new Date(slot.startTime);
            const slotEnd = new Date(slotStart.getTime() + slot.duration * 60000);
            const requestedEnd = new Date(blockedStart.getTime() + requestedDuration * 60000);
            return blockedStart < slotEnd && requestedEnd > slotStart;
        });

        if (blockingSlots.length > 0) {
            const latestEndTime = Math.max(...blockingSlots.map(s => 
                new Date(s.startTime).getTime() + s.duration * 60000
            ));
            
            const suggestedStartTime = new Date(latestEndTime);
            
            if (!isSlotUnavailable(suggestedStartTime.toISOString(), requestedDuration)) {
                suggestions.push({
                    startTime: suggestedStartTime,
                    duration: requestedDuration,
                    reason: `Available after ${formatTime(new Date(latestEndTime - 60000).toISOString())} session ends`
                });
            }
        }

        return suggestions;
    };

    const groupSlotsByDateAndDuration = () => {
        const grouped = {};
        
        availability.forEach(slot => {
            const date = new Date(slot.startTime).toDateString();
            if (!grouped[date]) {
                grouped[date] = {
                    30: [],
                    60: []
                    // You might want to make this dynamic if other durations are possible
                };
            }
        });

        availability.forEach(slot => {
            const date = new Date(slot.startTime).toDateString();
            const duration = slot.duration;
            
            // Ensure the duration key exists before pushing
            if (grouped[date]) {
                 if (!grouped[date][duration]) {
                    grouped[date][duration] = [];
                 }
                 grouped[date][duration].push(slot);
            }
        });

        Object.keys(grouped).forEach(date => {
            Object.keys(grouped[date]).forEach(duration => {
                grouped[date][duration].sort((a, b) => 
                    new Date(a.startTime) - new Date(b.startTime)
                );
            });
        });

        return grouped;
    };

    const handleSlotClick = (slot) => {
        if (!isMember) {
            alert('You must be a member of a common learner hub to book sessions');
            return;
        }
        
        const unavailable = isSlotUnavailable(slot.startTime, slot.duration);
        
        if (unavailable) {
            const suggestions = findAlternativeSlots(slot.startTime, slot.duration);
            setConflictingSuggestions(suggestions);
            setSelectedSlot(slot);
            setCustomDuration(slot.duration);
            setShowCustomDialog(true);
            return;
        }
        
        setSelectedSlot(slot);
        setRequestData({ ...requestData, duration: slot.duration });
        setShowRequestDialog(true);
    };

    const handleCustomBooking = () => {
        if (!selectedSlot) return;
        
        if (isSlotUnavailable(selectedSlot.startTime, customDuration)) {
            alert(`This ${customDuration}-minute slot is not available. Please try a different duration or time.`);
            return;
        }

        setRequestData({ ...requestData, duration: customDuration });
        setShowCustomDialog(false);
        setShowRequestDialog(true);
    };

    const handleSuggestionClick = (suggestion) => {
        setSelectedSlot({
            startTime: suggestion.startTime.toISOString(),
            duration: suggestion.duration,
            isBooked: false
        });
        setRequestData({ ...requestData, duration: suggestion.duration });
        setShowCustomDialog(false);
        setShowRequestDialog(true);
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        
        if (!requestData.title.trim() || !requestData.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (isSlotUnavailable(selectedSlot.startTime, requestData.duration)) {
            alert('This time slot is no longer available. Please choose another time.');
            setShowRequestDialog(false);
            loadAvailability();
            return;
        }

        try {
            await sessionAPI.createRequest({
                trainerId: id,
                requestedSlot: selectedSlot.startTime,
                duration: requestData.duration,
                title: requestData.title,
                description: requestData.description
            });

            alert('Session request sent! The trainer will review and respond soon.');
            setShowRequestDialog(false);
            setRequestData({ title: '', description: '', duration: 60 });
            setSelectedSlot(null);
            // Reload availability to show the slot as "booked" *if* the backend
            // now marks it (or if it's pending, the status will update on next load)
            // Based on your logic, it will only show "Blocked" when isBooked=true
            loadAvailability(); 
        } catch (error) {
            console.error('Failed to create request:', error);
            alert(error.response?.data?.message || 'Failed to send request');
        }
    };

    if (loading) return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
                <p className="text-muted-foreground">Loading trainer profile...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16 text-red-500">
                <p>{error}</p>
            </div>
        </div>
    );

    if (!trainer) return null;

    // --- We still need this to pass to the SelectedDateSlots component ---
    const slotsByDateAndDuration = groupSlotsByDateAndDuration();
    const hasAnyAvailability = availability.length > 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <Avatar className="h-32 w-32 mx-auto mb-4">
                                    <AvatarImage src={trainer.avatar} />
                                    <AvatarFallback className="text-3xl">{getInitials(trainer.name)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-bold">{trainer.name}</h2>
                                <p className="text-muted-foreground mt-2">{trainer.bio}</p>
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
                                            <DollarSign />
                                            <span>{trainer.trainerProfile.pricing.hourlyRate}</span>
                                            <span className="text-base font-normal">/hour</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isMember ? (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-green-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="font-medium">Hub member - can book sessions</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2 text-sm text-amber-700">
                                        <AlertCircle className="h-4 w-4 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Not a hub member</p>
                                            <p className="text-xs mt-1">Join a common learner hub to book sessions</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isMember && (
                                <Button className="w-full" size="lg" onClick={() => {
                                    document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    View Available Slots
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="availability" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="availability">Availability</TabsTrigger>
                            <TabsTrigger value="expertise">Expertise</TabsTrigger>
                            <TabsTrigger value="programs">Programs</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        </TabsList>

                        {/* --- MODIFIED AVAILABILITY TAB --- */}
                        <TabsContent value="availability" id="availability-section" className="space-y-6">
                            {!isMember ? (
                                <Card>
                                    <CardContent className="text-center py-16">
                                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                                        <h3 className="text-2xl font-semibold mb-2">Join a Hub to View Availability</h3>
                                        <p className="text-muted-foreground mb-4">
                                            You must be a member of at least one common learner hub to book sessions
                                        </p>
                                        <Button onClick={() => window.location.href = '/hubs'}>
                                            Explore Learner Hubs
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : !hasAnyAvailability ? (
                                <Card>
                                    <CardContent className="text-center py-16">
                                        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                        <h3 className="text-2xl font-semibold mb-2">No Available Slots</h3>
                                        <p className="text-muted-foreground">
                                            This trainer hasn't set up availability yet. Check back later!
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
                                                        Select a date on the calendar. Green days are fully available, yellow are
                                                        partially booked, and red are full.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* --- RENDER THE CALENDAR --- */}
                                    <Card>
                                        <CardContent className="p-0 flex justify-center">
                                            <TrainerAvailabilityCalendar
                                                availability={availability}
                                                onDateSelect={(date) => setSelectedDate(date || new Date())}
                                            />
                                        </CardContent>
                                    </Card>
                                    
                                    {/* --- RENDER SLOTS FOR SELECTED DATE --- */}
                                    <SelectedDateSlots
                                        date={selectedDate}
                                        slotsByDate={slotsByDateAndDuration}
                                        isSlotUnavailable={isSlotUnavailable}
                                        handleSlotClick={handleSlotClick}
                                    />
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="expertise">
                            {/* ... (your existing code for expertise) ... */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Expertise & Experience</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-3">Domains</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {trainer.trainerProfile?.domain?.map((domain, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                                                    {domain}
                                                </Badge>
                                            )) || <p className="text-muted-foreground">No domains listed</p>}
                                        </div>
                                    </div>
                                    
                                    {trainer.trainerProfile?.experience && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Experience</h3>
                                            <p className="text-muted-foreground">
                                                {trainer.trainerProfile.experience} years of professional experience
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="font-semibold mb-2">Member of Hubs</h3>
                                        <div className="space-y-2">
                                            {trainer.learnerHubs && trainer.learnerHubs.length > 0 ? (
                                                trainer.learnerHubs.map((hub, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span>{hub.name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Not a member of any hubs yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="programs">
                             {/* ... (your existing code for programs) ... */}
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
                                                        <Badge>{program.type}</Badge>
                                                    </div>
                                                    <p className="text-muted-foreground text-sm mb-3">{program.description}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-muted-foreground">{program.duration}</span>
                                                        <span className="text-lg font-bold text-primary">${program.price}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="text-center py-16 text-muted-foreground">
                                        No training programs available yet
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="reviews">
                             {/* ... (your existing code for reviews) ... */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reviews ({ratings.length})</CardTitle>
                                    <CardDescription>What learners say about {trainer.name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {ratings.map((rating) => (
                                            <div key={rating._id} className="p-4 border rounded-lg">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={rating.learner?.avatar} />
                                                        <AvatarFallback>{getInitials(rating.learner?.name || 'User')}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{rating.learner?.name || 'Anonymous'}</p>
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
                                                <p className="text-sm text-muted-foreground">{rating.review}</p>
                                            </div>
                                        ))}
                                        {ratings.length === 0 && (
                                            <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* --- DIALOGS (Unchanged) --- */}
            
            {/* Custom Duration Dialog */}
            <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
                {/* ... (your existing dialog code) ... */}
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Time Slot Options
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {selectedSlot && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-amber-900">This time slot is blocked</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            {formatTime(selectedSlot.startTime)} for {formatDuration(selectedSlot.duration)} is unavailable.
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
                                        className="w-full justify-start h-auto py-3 border-green-200 hover:bg-green-50"
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
                            <Label className="text-sm font-semibold mb-3 block">Or Request Custom Duration:</Label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        min="15"
                                        max="180"
                                        step="15"
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm text-muted-foreground">minutes</span>
                                </div>
                                
                                <div className="flex gap-2">
                                    {[30, 45, 60, 90].map(dur => (
                                        <Button
                                            key={dur}
                                            type="button"
                                            size="sm"
                                            variant={customDuration === dur ? "default" : "outline"}
                                            onClick={() => setCustomDuration(dur)}
                                        >
                                            {dur}m
                                        </Button>
                                    ))}
                                </div>

                                {trainer.trainerProfile?.pricing?.hourlyRate && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
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
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Request Session Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                {/* ... (your existing dialog code) ... */}
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Request a Session</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Session Title</Label>
                            <Input
                                id="title"
                                value={requestData.title}
                                onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                                placeholder="Enter session title"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={requestData.description}
                                onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                                placeholder="Describe what you want to learn or focus on"
                                required
                            />
                        </div>
                        <div>
                            <Label>Selected Time</Label>
                            <p className="text-sm text-muted-foreground">
                                {selectedSlot ? `${formatTime(selectedSlot.startTime)} - ${formatDuration(requestData.duration)}` : 'Not selected'}
                            </p>
                        </div>
                        {trainer.trainerProfile?.pricing?.hourlyRate && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Estimated Cost:</span>
                                    <span className="font-bold text-primary text-lg">
                                        ${((trainer.trainerProfile.pricing.hourlyRate * requestData.duration) / 60).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Send Request
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
