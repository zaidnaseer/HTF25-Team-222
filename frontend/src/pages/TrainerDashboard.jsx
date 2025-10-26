import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { sessionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, MessageSquare, Settings } from 'lucide-react'; // Import Settings
import { formatDate, formatTime, getInitials } from '../lib/utils';


export default function TrainerDashboard() {
    const { user } = useAuth(); // Get user info
    const [pendingRequests, setPendingRequests] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAlternativeModal, setShowAlternativeModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [suggestedSlots, setSuggestedSlots] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [requestsRes, sessionsRes] = await Promise.all([
                sessionAPI.getTrainerRequests(),
                sessionAPI.getSessions({ status: 'scheduled', role: 'trainer' })
            ]);

            setPendingRequests(requestsRes.data);
            setUpcomingSessions(sessionsRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        if (!confirm('Approve this session request?')) return;

        try {
            await sessionAPI.approveRequest(requestId, {
                autoGenerateZoom: true // Assuming your API supports this
            });

            alert('Session approved! Zoom link generated and learner notified.');
            loadData();
        } catch (error) {
            console.error('Failed to approve request:', error);
            alert(error.response?.data?.message || 'Failed to approve request');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await sessionAPI.rejectRequest(selectedRequest._id, {
                reason: rejectionReason
            });

            alert('Request rejected. Learner has been notified.');
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedRequest(null);
            loadData();
        } catch (error) {
            console.error('Failed to reject request:', error);
            alert('Failed to reject request');
        }
    };

    const handleSuggestAlternative = async (alternativeSlot) => {
        // Ensure alternativeSlot is in the correct format (e.g., ISO string) if needed by API
        const formattedSlot = typeof alternativeSlot === 'object' ? alternativeSlot.toISOString() : alternativeSlot;

        try {
            await sessionAPI.suggestAlternative(selectedRequest._id, {
                suggestedSlots: [formattedSlot] // API expects an array
            });

            alert('Alternative time suggested! Learner will be notified.');
            setShowAlternativeModal(false);
            setSelectedRequest(null);
            loadData();
        } catch (error) {
            console.error('Failed to suggest alternative:', error);
            alert('Failed to suggest alternative');
        }
    };


    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
    };

    const openAlternativeModal = async (request) => {
        setSelectedRequest(request);
        // --- Fetch actual available slots ---
        try {
            // Adjust API call as needed (getAvailableSlots might need startDate, days)
            const slotsRes = await sessionAPI.getAvailableSlots(user._id, { days: 7 });
             // Limit suggestions for simplicity
            setSuggestedSlots(slotsRes.data.slice(0, 5).map(slot => new Date(slot.startTime)));
        } catch (error) {
            console.error("Failed to fetch suggested slots:", error);
            // Fallback to mock slots on error
            const mockSlots = [
                new Date(Date.now() + 86400000 * 1), // Tomorrow
                new Date(Date.now() + 86400000 * 2), // Day after
                new Date(Date.now() + 86400000 * 3)  // 3 days later
            ];
            setSuggestedSlots(mockSlots);
        }
        setShowAlternativeModal(true);
    };


    const RequestCard = ({ request }) => (
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={request.learner?.avatar} />
                            <AvatarFallback>{getInitials(request.learner?.name || 'L')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <CardDescription>from {request.learner?.name || 'Unknown Learner'}</CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300">
                        <AlertCircle className="h-3 w-3" />
                        Pending
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm font-medium mb-1">What they want to learn:</p>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(request.requestedSlot)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(request.requestedSlot)} ({request.duration} min)</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={() => handleApprove(request._id)}
                        className="flex-1"
                        variant="default"
                        size="sm" // Make buttons smaller
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                    </Button>
                    <Button
                        onClick={() => openAlternativeModal(request)}
                        className="flex-1"
                        variant="outline"
                        size="sm"
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        Suggest
                    </Button>
                    <Button
                        onClick={() => openRejectModal(request)}
                        className="flex-1"
                        variant="destructive"
                        size="sm"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const UpcomingSessionCard = ({ session }) => (
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={session.learner?.avatar} />
                            <AvatarFallback>{getInitials(session.learner?.name || 'L')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{session.title}</CardTitle>
                            <CardDescription>with {session.learner?.name || 'Unknown Learner'}</CardDescription>
                        </div>
                    </div>
                    <Badge variant="default" className="gap-1 bg-green-600">
                         <CheckCircle className="h-3 w-3" /> Scheduled
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {session.description && <p className="text-sm text-muted-foreground">{session.description}</p>}

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(session.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(session.scheduledAt)} ({session.duration} min)</span>
                    </div>
                </div>

                {session.meetingLink && (
                    <Button
                        onClick={() => window.open(session.meetingLink, '_blank')}
                        className="w-full"
                        variant="outline"
                    >
                        Join Meeting
                    </Button>
                )}
            </CardContent>
        </Card>
    );


    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-16">
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
             {/* --- MODIFIED HEADER --- */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                 <div>
                    <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
                </div>
                {/* --- ADDED EDIT AVAILABILITY BUTTON --- */}
                <Link to="/availability-settings">
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Availability
                    </Button>
                </Link>
            </div>


            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingRequests.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting your response
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingSessions.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Next 7 days
                        </p>
                    </CardContent>
                </Card>

                 {/* Removed Quick Actions card as button is now in header */}
            </div>

            <Tabs defaultValue="requests" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2"> {/* Changed grid-cols-3 to grid-cols-2 */}
                    <TabsTrigger value="requests">
                        Pending Requests
                        {pendingRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming">
                        Upcoming Sessions
                        {upcomingSessions.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{upcomingSessions.length}</Badge>
                        )}
                    </TabsTrigger>
                    {/* Removed Past Sessions tab for brevity, add back if needed */}
                </TabsList>

                <TabsContent value="requests" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingRequests.length === 0 ? (
                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardContent className="text-center py-16">
                                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-2xl font-semibold mb-2">All caught up!</h3>
                                <p className="text-muted-foreground">
                                    No pending session requests at the moment
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingRequests.map(request => (
                            <RequestCard key={request._id} request={request} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingSessions.length === 0 ? (
                         <Card className="md:col-span-2 lg:col-span-3">
                            <CardContent className="text-center py-16">
                                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-2xl font-semibold mb-2">No upcoming sessions</h3>
                                <p className="text-muted-foreground">
                                    Your approved sessions will appear here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        upcomingSessions.map(session => (
                            <UpcomingSessionCard key={session._id} session={session} />
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Reject Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Session Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this request. The learner will be notified.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="reason" className="sr-only">Reason for Rejection</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Topic is outside my expertise, Need more details, This time doesn't work..."
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                className="flex-1"
                                disabled={!rejectionReason.trim()} // Disable if no reason
                            >
                                Reject Request
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Suggest Alternative Modal */}
            <Dialog open={showAlternativeModal} onOpenChange={setShowAlternativeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suggest Alternative Times</DialogTitle>
                        <DialogDescription>
                            Select one of your available time slots that works better for you.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                        <div className="space-y-2">
                             {suggestedSlots.length > 0 ? (
                                suggestedSlots.map((slot, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleSuggestAlternative(slot)}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {formatDate(slot)} at {formatTime(slot)}
                                    </Button>
                                ))
                             ) : (
                                <p className="text-center text-muted-foreground text-sm py-4">
                                    No available slots found in the next 7 days. Adjust your availability settings.
                                </p>
                             )}
                        </div>
                    </div>
                     <Button
                        variant="outline"
                        onClick={() => setShowAlternativeModal(false)}
                        className="w-full mt-4"
                    >
                        Cancel
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
