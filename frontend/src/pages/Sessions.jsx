import { useEffect, useState } from 'react';
import { sessionAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, Clock, Video, DollarSign, CheckCircle } from 'lucide-react';
import { formatDate, formatTime, getInitials } from '../lib/utils';

export default function Sessions() {
    const [sessions, setSessions] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await sessionAPI.getSessions();
            setSessions(response.data);
        } catch (error) {
            console.error('Failed to load sessions:', error);
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
                            <CardDescription>with {session.trainer?.name}</CardDescription>
                        </div>
                    </div>
                    <Badge variant={
                        session.status === 'scheduled' ? 'default' :
                            session.status === 'completed' ? 'secondary' :
                                'outline'
                    }>
                        {session.status}
                    </Badge>
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
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${session.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{session.type}</Badge>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    {session.status === 'scheduled' && session.paymentStatus !== 'paid' && (
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">My Sessions</h1>
                <p className="text-muted-foreground">Manage your upcoming and past learning sessions</p>
            </div>

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="all">All Sessions</TabsTrigger>
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
                                <Button>Find Trainers</Button>
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
