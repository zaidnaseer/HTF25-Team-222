import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { learnerHubAPI, messageAPI, activityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Users, MessageSquare, Trophy, Calendar, Send, FileText } from 'lucide-react';
import { getInitials, formatDate } from '../lib/utils';

export default function HubDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [hub, setHub] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activities, setActivities] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        loadHub();
        loadActivities();
    }, [id]);

    const loadHub = async () => {
        try {
            const response = await learnerHubAPI.getHub(id);
            setHub(response.data);
            setIsMember(response.data.members.some(m => m.user._id === user._id));
            if (response.data.members.some(m => m.user._id === user._id)) {
                loadMessages();
            }
        } catch (error) {
            console.error('Failed to load hub:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        try {
            const response = await messageAPI.getMessages(id);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const loadActivities = async () => {
        try {
            const response = await activityAPI.getActivities({ hubId: id });
            setActivities(response.data);
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
    };

    const handleJoinHub = async () => {
        try {
            await learnerHubAPI.joinHub(id);
            loadHub();
        } catch (error) {
            console.error('Failed to join hub:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await messageAPI.sendMessage({ hubId: id, content: newMessage });
            setNewMessage('');
            loadMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    if (loading || !hub) return <div className="container mx-auto px-4 py-8">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hub Header */}
            <div className="relative h-64 -mx-4 mb-8">
                <img src={hub.coverImage} alt={hub.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                    <div className="container mx-auto px-4 pb-6 text-white">
                        <h1 className="text-4xl font-bold mb-2">{hub.name}</h1>
                        <p className="text-lg opacity-90">{hub.description}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <Badge variant="outline" className="text-lg px-4 py-2">
                    <Users className="mr-2 h-4 w-4" />
                    {hub.totalMembers} Members
                </Badge>
                <Badge className="text-lg px-4 py-2">{hub.category}</Badge>
                {!isMember && (
                    <Button size="lg" onClick={handleJoinHub}>Join Hub</Button>
                )}
            </div>

            <Tabs defaultValue="chat" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
                    <TabsTrigger value="members"><Users className="mr-2 h-4 w-4" />Members</TabsTrigger>
                    <TabsTrigger value="activities"><Trophy className="mr-2 h-4 w-4" />Activities</TabsTrigger>
                    <TabsTrigger value="resources"><FileText className="mr-2 h-4 w-4" />Resources</TabsTrigger>
                </TabsList>

                <TabsContent value="chat">
                    {isMember ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Chat Room</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-muted/30 rounded-lg">
                                    {messages.map((msg) => (
                                        <div key={msg._id} className="flex gap-3">
                                            <Avatar>
                                                <AvatarImage src={msg.sender.avatar} />
                                                <AvatarFallback>{getInitials(msg.sender.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{msg.sender.name}</span>
                                                    <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                                                </div>
                                                <p className="text-sm mt-1">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Input
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <Button type="submit"><Send className="h-4 w-4" /></Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-16">
                                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-lg">Join the hub to access the chat room</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="members">
                    <Card>
                        <CardHeader>
                            <CardTitle>Members ({hub.members.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {hub.members.map((member) => (
                                    <div key={member._id} className="flex items-center gap-3 p-4 rounded-lg border">
                                        <Avatar>
                                            <AvatarImage src={member.user.avatar} />
                                            <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium">{member.user.name}</p>
                                            <p className="text-sm text-muted-foreground">Level {member.user.level}</p>
                                        </div>
                                        <Badge>{member.role}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activities">
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <Card key={activity._id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{activity.title}</CardTitle>
                                            <CardDescription>{activity.description}</CardDescription>
                                        </div>
                                        <Badge>{activity.type}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(activity.startDate)}
                                        </div>
                                        <Badge variant="outline">{activity.status}</Badge>
                                        <Button size="sm" className="ml-auto">Participate</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="resources">
                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {hub.resources && hub.resources.length > 0 ? hub.resources.map((resource, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="font-medium">{resource.title}</p>
                                            <p className="text-sm text-muted-foreground">{resource.type}</p>
                                        </div>
                                        <Button variant="outline" size="sm">View</Button>
                                    </div>
                                )) : (
                                    <p className="text-center text-muted-foreground py-8">No resources yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
