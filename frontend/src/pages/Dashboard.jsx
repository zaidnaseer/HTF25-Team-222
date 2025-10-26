import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { learnerHubAPI, sessionAPI, activityAPI } from '../services/api';
import { Users, Calendar, Trophy, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { formatDate, getInitials } from '../lib/utils';

export default function Dashboard() {
    const { user } = useAuth();
    const [hubs, setHubs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [hubsRes, sessionsRes, activitiesRes] = await Promise.all([
                learnerHubAPI.getHubs({ limit: 3 }),
                sessionAPI.getSessions({ status: 'scheduled', limit: 5 }),
                activityAPI.getActivities({ status: 'upcoming' })
            ]);
            setHubs(hubsRes.data);
            setSessions(sessionsRes.data);
            setActivities(activitiesRes.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { icon: Users, label: 'My Hubs', value: user?.learnerHubs?.length || 0, color: 'text-blue-500' },
        { icon: Trophy, label: 'Points', value: user?.points || 0, color: 'text-yellow-500' },
        { icon: TrendingUp, label: 'Level', value: user?.level || 1, color: 'text-green-500' },
        { icon: Calendar, label: 'Upcoming Sessions', value: sessions.length, color: 'text-purple-500' },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-muted-foreground text-lg">
                    Here's what's happening with your learning journey
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                </div>
                                <stat.icon className={`h-12 w-12 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Upcoming Activities */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Activities</CardTitle>
                            <CardDescription>Quizzes, contests, and events</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {activities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No upcoming activities</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <Link key={activity._id} to={`/hubs/${activity.learnerHub._id}`}>
                                        <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{activity.title}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(activity.startDate)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {activity.learnerHub?.name}
                                                </p>
                                            </div>
                                            <Badge>{activity.type}</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Sessions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Sessions</CardTitle>
                            <CardDescription>Your scheduled learning sessions</CardDescription>
                        </div>
                        <Link to="/sessions">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No upcoming sessions</p>
                                <Link to="/trainers">
                                    <Button variant="outline" className="mt-4">
                                        Book a Session
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div key={session._id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                                        <Avatar>
                                            <AvatarImage src={session.trainer?.avatar} />
                                            <AvatarFallback>{getInitials(session.trainer?.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{session.title}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(session.scheduledAt)}
                                            </div>
                                        </div>
                                        <Badge>{session.type}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Learner Hubs */}
            <Card className="mt-8">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Learner Hubs</CardTitle>
                        <CardDescription>Communities you're part of</CardDescription>
                    </div>
                    <Link to="/hubs">
                        <Button variant="ghost" size="sm">
                            Explore <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {hubs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>You haven't joined any hubs yet</p>
                            <Link to="/hubs">
                                <Button variant="outline" className="mt-4">
                                    Browse Hubs
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-4">
                            {hubs.map((hub) => (
                                <Link key={hub._id} to={`/hubs/${hub._id}`}>
                                    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                                        <img
                                            src={hub.coverImage}
                                            alt={hub.name}
                                            className="h-16 w-16 rounded-lg object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{hub.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                {hub.totalMembers} members
                                            </div>
                                        </div>
                                        <Badge variant="outline">{hub.category}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Get started with your learning goals</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Link to="/hubs">
                            <Button variant="outline" className="w-full h-auto flex-col py-6 gap-2">
                                <Users className="h-8 w-8 mb-2" />
                                <span className="font-semibold">Join a Hub</span>
                                <span className="text-xs text-muted-foreground">Find your learning community</span>
                            </Button>
                        </Link>
                        <Link to="/trainers">
                            <Button variant="outline" className="w-full h-auto flex-col py-6 gap-2">
                                <Calendar className="h-8 w-8 mb-2" />
                                <span className="font-semibold">Book a Session</span>
                                <span className="text-xs text-muted-foreground">Learn from experts</span>
                            </Button>
                        </Link>
                        <Link to="/profile">
                            <Button variant="outline" className="w-full h-auto flex-col py-6 gap-2">
                                <Trophy className="h-8 w-8 mb-2" />
                                <span className="font-semibold">View Profile</span>
                                <span className="text-xs text-muted-foreground">Track your progress</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
