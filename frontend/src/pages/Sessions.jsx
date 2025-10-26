import { useEffect, useState } from 'react';
import { sessionAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, Clock, Video, DollarSign, CheckCircle, Users, AlertCircle, XCircle } from 'lucide-react';
import { formatDate, formatTime, getInitials } from '../lib/utils';

export default function Sessions() {
    const [sessions, setSessions] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    useEffect(() => {
        loadSessions();
        loadPendingRequests();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await sessionAPI.getSessions();
            setSessions(response.data);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const loadPendingRequests = async () => {
        try {
            const response = await sessionAPI.getPendingRequests();
            setPendingRequests(response.data);
        } catch (error) {
            console.error('Failed to load pending requests:', error);
        }
    };

    const handleJoinMeeting = (meetingLink) => {
        window.open(meetingLink, '_blank');
    };

    const handleProcessPayment = async (sessionId) => {
        try {
            const response = await sessionAPI.processPayment(sessionId);
            alert(response.data.message);
            loadSessions();
        } catch (error) {
            console.error('Payment failed:', error);
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (!confirm('Cancel this session request?')) return;
        
        try {
            await sessionAPI.cancelRequest(requestId);
            loadPendingRequests();
            alert('Request cancelled successfully');
        } catch (error) {
            console.error('Failed to cancel request:', error);
            alert('Failed to cancel request');
        }
    };

    const handleFindTrainers = () => {
        // Navigate to find trainers page
        window.location.href = '/trainers';
    };

    const filterSessions = (status) => {
        if (status === 'all') return sessions;
        return sessions.filter(s => s.status === status);
    };

    const SessionCard = ({ session }) => (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={session.trainer?.avatar} />
                            <AvatarFallback>{getInitials(session.trainer?.name || 'Trainer')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{session.title}</CardTitle>
                            <CardDescription>
                                {session.type === 'group' ? (
                                    <>with {session.hosts?.map(h => h.name).join(', ')}</>
                                ) : (
                                    <>with {session.trainer?.name}</>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {session.type === 'group' && (
                            <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                Group
                            </Badge>
                        )}
                        <Badge variant={
                            session.status === 'scheduled' ? 'default' :
                            session.status === 'completed' ? 'secondary' :
                            'outline'
                        }>
                            {session.status}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{session.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(session.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(session.scheduledAt)} ({session.duration} min)</span>
                    </div>
                    {session.price && (
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>${session.price}</span>
                        </div>
                    )}
                    {session.type === 'group' && (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{session.participants?.length || 0}/{session.maxParticipants} enrolled</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    {session.status === 'scheduled' && session.paymentStatus !== 'paid' && session.price && (
                        <Button
                            variant="outline"
                            onClick={() => handleProcessPayment(session._id)}
                            className="flex-1"
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pay Now (Mock)
                        </Button>
                    )}
                    {session.status === 'scheduled' && session.meetingLink && (
                        <Button
                            onClick={() => handleJoinMeeting(session.meetingLink)}
                            className="flex-1"
                        >
                            <Video className="mr-2 h-4 w-4" />
                            Join on Zoom
                        </Button>
                    )}
                    {session.status === 'completed' && (
                        <Badge variant="secondary" className="flex-1 justify-center py-2">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Completed
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    const PendingRequestCard = ({ request }) => (
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={request.trainer?.avatar} />
                            <AvatarFallback>{getInitials(request.trainer?.name || 'Trainer')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <CardDescription>Request to {request.trainer?.name}</CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Pending Approval
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{request.description}</p>

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

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-900">Waiting for trainer approval</p>
                            <p className="text-yellow-700 text-xs mt-1">
                                Submitted {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = `/trainers/${request.trainer._id}`}
                        className="flex-1"
                    >
                        View Trainer
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => handleCancelRequest(request._id)}
                        className="flex-1"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Request
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">My Sessions</h1>
                <p className="text-muted-foreground">Manage your upcoming and past learning sessions</p>
            </div>

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="all">
                        All Sessions
                        {sessions.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{sessions.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending Requests
                        {pendingRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {filterSessions('all').map(session => (
                        <SessionCard key={session._id} session={session} />
                    ))}
                    {filterSessions('all').length === 0 && (
                        <Card>
                            <CardContent className="text-center py-16">
                                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-2xl font-semibold mb-2">No sessions yet</h3>
                                <p className="text-muted-foreground mb-4">Book your first session with a trainer</p>
                                <Button onClick={handleFindTrainers}>
                                    Find Trainers
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    {pendingRequests.map(request => (
                        <PendingRequestCard key={request._id} request={request} />
                    ))}
                    {pendingRequests.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-16">
                                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-2xl font-semibold mb-2">No pending requests</h3>
                                <p className="text-muted-foreground mb-4">
                                    Your session requests will appear here while waiting for trainer approval
                                </p>
                                <Button onClick={handleFindTrainers}>
                                    Find Trainers
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="scheduled" className="space-y-4">
                    {filterSessions('scheduled').map(session => (
                        <SessionCard key={session._id} session={session} />
                    ))}
                    {filterSessions('scheduled').length === 0 && (
                        <Card>
                            <CardContent className="text-center py-16 text-muted-foreground">
                                No scheduled sessions
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {filterSessions('completed').map(session => (
                        <SessionCard key={session._id} session={session} />
                    ))}
                    {filterSessions('completed').length === 0 && (
                        <Card>
                            <CardContent className="text-center py-16 text-muted-foreground">
                                No completed sessions
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                    {filterSessions('cancelled').map(session => (
                        <SessionCard key={session._id} session={session} />
                    ))}
                    {filterSessions('cancelled').length === 0 && (
                        <Card>
                            <CardContent className="text-center py-16 text-muted-foreground">
                                No cancelled sessions
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
