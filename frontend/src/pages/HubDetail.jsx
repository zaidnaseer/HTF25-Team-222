import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// CHANGED: Import roadmapAPI
import { learnerHubAPI, messageAPI, activityAPI, roadmapAPI } from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
// CHANGED: Added GitBranch icon for Roadmaps
import { Users, MessageSquare, Trophy, Calendar, Send, FileText, GitBranch, Plus, Trash2, LogOut } from 'lucide-react'; 
import { getInitials, formatDate } from '../lib/utils';

export default function HubDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hub, setHub] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activities, setActivities] = useState([]);
    // NEW: State for roadmaps
    const [roadmaps, setRoadmaps] = useState([]); 
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showOwnerLeaveDialog, setShowOwnerLeaveDialog] = useState(false);
    const [ownerLeaveAction, setOwnerLeaveAction] = useState('transfer'); // 'transfer' or 'delete'
    const [selectedNewOwner, setSelectedNewOwner] = useState('');
    const [showConfirmRandomOwner, setShowConfirmRandomOwner] = useState(false);
    const [activityForm, setActivityForm] = useState({
        title: '',
        description: '',
        type: 'quiz',
        startDate: '',
        endDate: '',
        duration: '',
        maxParticipants: '',
        questions: [],
        quizMode: 'platform', // 'platform' or 'external'
        externalLink: ''
    });

    useEffect(() => {
        loadHub();
        loadActivities();
        // NEW: Load roadmaps
        loadRoadmaps(); 
    }, [id]);

    const loadHub = async () => {
        try {
            const response = await learnerHubAPI.getHub(id);
            setHub(response.data);
            const member = response.data.members.find(m => m.user._id === user._id);
            setIsMember(!!member);
            setIsAdmin(member?.role === 'admin' || member?.role === 'moderator');
            setIsCreator(response.data.creator._id === user._id);
            if (member) {
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

    // NEW: Function to load adopted roadmaps for the hub
    const loadRoadmaps = async () => {
        try {
            // ASSUMPTION: You have an API endpoint to get roadmaps adopted by hub members
            const response = await roadmapAPI.getHubRoadmaps(id);
            setRoadmaps(response.data);
        } catch (error) {
            console.error('Failed to load roadmaps:', error);
            // You can add fallback data here for testing if your API isn't ready
            // Example:
            // setRoadmaps([
            //     { _id: 'r1', title: 'React Developer Roadmap', description: 'Learn React from scratch.', adopters: [{ user: { _id: 'u1', name: 'Alice', avatar: '' } }, { user: { _id: 'u2', name: 'Bob', avatar: '' } }] },
            //     { _id: 'r2', title: 'Node.js Mastery', description: 'Backend with Node.js.', adopters: [{ user: { _id: 'u3', name: 'Charlie', avatar: '' } }] }
            // ]);
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

    const handleLeaveHub = async () => {
        try {
            await learnerHubAPI.leaveHub(id);
            setShowLeaveDialog(false);
            // Redirect to learner hubs page after leaving
            navigate('/hubs');
        } catch (error) {
            console.error('Failed to leave hub:', error);
            alert('Failed to leave hub. Please try again.');
        }
    };

    const handleOwnerLeave = async () => {
        try {
            if (ownerLeaveAction === 'transfer' && !selectedNewOwner) {
                // Show confirmation for random owner assignment
                setShowConfirmRandomOwner(true);
                return;
            }

            const payload = {
                action: ownerLeaveAction,
                newOwnerId: selectedNewOwner || undefined
            };

            const response = await learnerHubAPI.leaveHub(id, payload);
            setShowOwnerLeaveDialog(false);
            setShowConfirmRandomOwner(false);

            // Redirect to learner hubs page after leaving
            navigate('/hubs');

            if (response.data.deleted) {
                alert('Hub has been deleted successfully.');
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error('Failed to leave hub:', error);
            alert('Failed to leave hub. Please try again.');
        }
    };

    const getEligibleMembers = () => {
        if (!hub) return [];
        return hub.members.filter(m => m.user._id !== user._id);
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

    const handleCreateActivity = async (e) => {
        e.preventDefault();
        try {
            const activityData = {
                ...activityForm,
                learnerHub: id,
                duration: activityForm.duration ? parseInt(activityForm.duration) : undefined,
                maxParticipants: activityForm.maxParticipants ? parseInt(activityForm.maxParticipants) : undefined
            };

            // For quiz in external mode or other activity types, use external link
            if (activityForm.type === 'quiz' && activityForm.quizMode === 'external') {
                activityData.meetingLink = activityForm.externalLink;
                activityData.questions = [];
            } else if (activityForm.type !== 'quiz') {
                activityData.meetingLink = activityForm.externalLink;
                activityData.questions = [];
            }

            // Remove quizMode and externalLink from the data
            delete activityData.quizMode;
            delete activityData.externalLink;

            await activityAPI.createActivity(activityData);
            setShowCreateDialog(false);
            setActivityForm({
                title: '',
                description: '',
                type: 'quiz',
                startDate: '',
                endDate: '',
                duration: '',
                maxParticipants: '',
                questions: [],
                quizMode: 'platform',
                externalLink: ''
            });
            loadActivities();
        } catch (error) {
            console.error('Failed to create activity:', error);
        }
    };

    const addQuestion = () => {
        setActivityForm({
            ...activityForm,
            questions: [...activityForm.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]
        });
    };

    const removeQuestion = (index) => {
        const newQuestions = activityForm.questions.filter((_, i) => i !== index);
        setActivityForm({ ...activityForm, questions: newQuestions });
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...activityForm.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setActivityForm({ ...activityForm, questions: newQuestions });
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...activityForm.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setActivityForm({ ...activityForm, questions: newQuestions });
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
                {isMember && isCreator && (
                    <Dialog open={showOwnerLeaveDialog} onOpenChange={setShowOwnerLeaveDialog}>
                        <DialogTrigger asChild>
                            <Button size="lg" variant="outline" className="ml-auto">
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave Hub
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Leave Hub as Owner</DialogTitle>
                                <DialogDescription>
                                    As the owner, you have options when leaving this hub.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">What would you like to do?</Label>

                                    <div className="space-y-2">
                                        <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                            <input
                                                type="radio"
                                                name="ownerAction"
                                                value="transfer"
                                                checked={ownerLeaveAction === 'transfer'}
                                                onChange={(e) => setOwnerLeaveAction(e.target.value)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">Transfer Ownership & Leave</div>
                                                <p className="text-sm text-muted-foreground">
                                                    Assign a new owner and leave as a regular member
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                            <input
                                                type="radio"
                                                name="ownerAction"
                                                value="delete"
                                                checked={ownerLeaveAction === 'delete'}
                                                onChange={(e) => setOwnerLeaveAction(e.target.value)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-destructive">Delete Entire Hub</div>
                                                <p className="text-sm text-muted-foreground">
                                                    Permanently delete this hub and remove all members
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {ownerLeaveAction === 'transfer' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="newOwner">Select New Owner (Optional)</Label>
                                        <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                                            <SelectTrigger id="newOwner">
                                                <SelectValue placeholder="Click to select a member (or leave blank for random assignment)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getEligibleMembers().map((member) => (
                                                    <SelectItem key={member.user._id} value={member.user._id}>
                                                        {member.user.name} ({member.role})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedNewOwner && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedNewOwner('')}
                                                className="text-xs"
                                            >
                                                Clear selection (random assignment)
                                            </Button>
                                        )}
                                        {!selectedNewOwner && (
                                            <p className="text-xs text-amber-600 dark:text-amber-500">
                                                ⚠️ If you don't select anyone, a random member will be assigned as the new owner.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!showConfirmRandomOwner ? (
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setShowOwnerLeaveDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant={ownerLeaveAction === 'delete' ? 'destructive' : 'default'}
                                        onClick={handleOwnerLeave}
                                    >
                                        {ownerLeaveAction === 'delete' ? 'Delete Hub' : 'Proceed'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                            Are you sure you want to proceed without selecting a new owner?
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                            A random member will be automatically assigned as the new owner.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" onClick={() => setShowConfirmRandomOwner(false)}>
                                            Go Back & Select Owner
                                        </Button>
                                        <Button onClick={handleOwnerLeave}>
                                            Confirm Random Assignment
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
                {isMember && !isCreator && (
                    <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                        <DialogTrigger asChild>
                            <Button size="lg" variant="outline" className="ml-auto">
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave Hub
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Leave Learner Hub</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to leave "{hub.name}"? You will lose access to the chat, activities, and resources.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-2 justify-end mt-4">
                                <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleLeaveHub}>
                                    Leave Hub
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Tabs defaultValue="chat" className="space-y-6">
                {/* CHANGED: Updated grid-cols-4 to grid-cols-5 */}
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
                    <TabsTrigger value="members"><Users className="mr-2 h-4 w-4" />Members</TabsTrigger>
                    <TabsTrigger value="activities"><Trophy className="mr-2 h-4 w-4" />Activities</TabsTrigger>
                    {/* NEW: Added Roadmaps tab trigger */}
                    <TabsTrigger value="roadmaps"><GitBranch className="mr-2 h-4 w-4" />Roadmaps</TabsTrigger>
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
                        {isAdmin && (
                            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full sm:w-auto">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Activity
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Create New Activity</DialogTitle>
                                        <DialogDescription>
                                            Schedule a quiz, contest, workshop, or other activity for your hub members.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateActivity} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Activity Title *</Label>
                                                <Input
                                                    id="title"
                                                    required
                                                    value={activityForm.title}
                                                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                                                    placeholder="e.g., JavaScript Quiz 101"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="type">Activity Type *</Label>
                                                <Select
                                                    value={activityForm.type}
                                                    onValueChange={(value) => setActivityForm({ ...activityForm, type: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="quiz">Quiz</SelectItem>
                                                        <SelectItem value="contest">Contest</SelectItem>
                                                        <SelectItem value="challenge">Challenge</SelectItem>
                                                        <SelectItem value="workshop">Workshop</SelectItem>
                                                        <SelectItem value="webinar">Webinar</SelectItem>
                                                        <SelectItem value="meeting">Meeting</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Input
                                                id="description"
                                                value={activityForm.description}
                                                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                                                placeholder="Brief description of the activity"
                                            />
                                        </div>

                                        {/* Quiz Mode Selection - Only for Quiz type */}
                                        {activityForm.type === 'quiz' && (
                                            <div className="space-y-2">
                                                <Label>Quiz Mode</Label>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="quizMode"
                                                            value="platform"
                                                            checked={activityForm.quizMode === 'platform'}
                                                            onChange={(e) => setActivityForm({ ...activityForm, quizMode: e.target.value })}
                                                            className="w-4 h-4"
                                                        />
                                                        <span>Create on Platform</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="quizMode"
                                                            value="external"
                                                            checked={activityForm.quizMode === 'external'}
                                                            onChange={(e) => setActivityForm({ ...activityForm, quizMode: e.target.value })}
                                                            className="w-4 h-4"
                                                        />
                                                        <span>Use External Platform</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* External Link - For non-quiz or external quiz */}
                                        {(activityForm.type !== 'quiz' || activityForm.quizMode === 'external') && (
                                            <div className="space-y-2">
                                                <Label htmlFor="externalLink">
                                                    {activityForm.type === 'quiz' ? 'Quiz Link *' : 'Activity Link *'}
                                                </Label>
                                                <Input
                                                    id="externalLink"
                                                    type="url"
                                                    required
                                                    value={activityForm.externalLink}
                                                    onChange={(e) => setActivityForm({ ...activityForm, externalLink: e.target.value })}
                                                    placeholder={
                                                        activityForm.type === 'quiz'
                                                            ? 'https://forms.google.com/...'
                                                            : activityForm.type === 'contest'
                                                                ? 'https://leetcode.com/contest/...'
                                                                : activityForm.type === 'workshop' || activityForm.type === 'webinar'
                                                                    ? 'https://zoom.us/j/...'
                                                                    : 'https://...'
                                                    }
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    {activityForm.type === 'quiz'
                                                        ? 'Add a link to your Google Form, Kahoot, or other quiz platform'
                                                        : activityForm.type === 'contest'
                                                            ? 'Add a link to LeetCode, HackerRank, CodeChef, or other platform'
                                                            : activityForm.type === 'workshop' || activityForm.type === 'webinar' || activityForm.type === 'meeting'
                                                                ? 'Add a link to Zoom, Google Meet, Teams, or other meeting platform'
                                                                : 'Add a link to the external platform where the activity will take place'}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startDate">Start Date & Time *</Label>
                                                <Input
                                                    id="startDate"
                                                    type="datetime-local"
                                                    required
                                                    value={activityForm.startDate}
                                                    onChange={(e) => setActivityForm({ ...activityForm, startDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endDate">End Date & Time</Label>
                                                <Input
                                                    id="endDate"
                                                    type="datetime-local"
                                                    value={activityForm.endDate}
                                                    onChange={(e) => setActivityForm({ ...activityForm, endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {(activityForm.type === 'workshop' || activityForm.type === 'webinar' || activityForm.type === 'meeting') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                                    <Input
                                                        id="duration"
                                                        type="number"
                                                        value={activityForm.duration}
                                                        onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                                                        placeholder="60"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="maxParticipants">Max Participants</Label>
                                                    <Input
                                                        id="maxParticipants"
                                                        type="number"
                                                        value={activityForm.maxParticipants}
                                                        onChange={(e) => setActivityForm({ ...activityForm, maxParticipants: e.target.value })}
                                                        placeholder="50"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {(activityForm.type === 'quiz' || activityForm.type === 'contest') && activityForm.quizMode === 'platform' && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label>Questions</Label>
                                                    <Button type="button" size="sm" onClick={addQuestion}>
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Question
                                                    </Button>
                                                </div>

                                                {activityForm.questions.map((q, qIndex) => (
                                                    <Card key={qIndex}>
                                                        <CardHeader>
                                                            <div className="flex justify-between items-start">
                                                                <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeQuestion(qIndex)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <Input
                                                                placeholder="Enter question"
                                                                value={q.question}
                                                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                            />
                                                            <div className="space-y-2">
                                                                {q.options.map((option, oIndex) => (
                                                                    <div key={oIndex} className="flex gap-2">
                                                                        <Input
                                                                            placeholder={`Option ${oIndex + 1}`}
                                                                            value={option}
                                                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant={q.correctAnswer === oIndex ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                                                        >
                                                                            {q.correctAnswer === oIndex ? '✓' : ' '}
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2 items-center">
                                                                <Label htmlFor={`points-${qIndex}`} className="text-sm">Points:</Label>
                                                                <Input
                                                                    id={`points-${qIndex}`}
                                                                    type="number"
                                                                    className="w-20"
                                                                    value={q.points}
                                                                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                                                                />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2 justify-end">
                                            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">Create Activity</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}

                        {activities.length > 0 ? (
                            activities.map((activity) => (
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
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(activity.startDate)}
                                            </div>
                                            <Badge variant="outline">{activity.status}</Badge>
                                            {activity.participants && (
                                                <Badge variant="secondary">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {activity.participants.length} participants
                                                </Badge>
                                            )}
                                            <Button size="sm" className="ml-auto">
                                                {activity.type === 'workshop' || activity.type === 'webinar' || activity.type === 'meeting'
                                                    ? 'Join'
                                                    : 'Participate'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="text-center py-16">
                                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-lg mb-2">No activities yet</p>
                                    {isAdmin && <p className="text-sm text-muted-foreground">Create your first activity to get started!</p>}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* NEW: TabsContent for Roadmaps */}
                <TabsContent value="roadmaps">
                    <Card>
                        <CardHeader>
                            <CardTitle>Adopted Roadmaps</CardTitle>
                            <CardDescription>
                                Learning paths adopted by members of this hub.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {roadmaps.length > 0 ? (
                                    roadmaps.map((roadmap) => (
                                        <Card key={roadmap._id}>
                                            <CardHeader>
                                                <CardTitle>{roadmap.title}</CardTitle>
                                                <CardDescription>{roadmap.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center">
                                                    {/* Show adopters */}
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Adopted By:</Label>
                                                        <div className="flex -space-x-2 mt-1">
                                                            {roadmap.adopters.map((adopter) => (
                                                                <Avatar key={adopter.user._id} className="border-2 border-background">
                                                                    <AvatarImage src={adopter.user.avatar} />
                                                                    <AvatarFallback>{getInitials(adopter.user.name)}</AvatarFallback>
                                                                </Avatar>
                                                            ))}
                                                            {/* You could add a "+X more" badge here if the list is long */}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Link to the roadmap */}
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => navigate(`/roadmaps/${roadmap._id}`)} // Assumed route
                                                    >
                                                        View Roadmap
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-16">
                                        <GitBranch className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-lg mb-2">No roadmaps adopted yet</p>
                                        <p className="text-sm text-muted-foreground">
                                            When members adopt roadmaps, they will appear here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
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
