import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learnerHubAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Users, Search, Plus, Lock, Globe, UserPlus } from 'lucide-react';

// Default cover images for learner hubs
const DEFAULT_HUB_IMAGES = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop', // Team collaboration
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=400&fit=crop', // Students studying
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=400&fit=crop', // Group meeting
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&h=400&fit=crop', // Learning together
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=400&fit=crop', // Team workspace
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=400&fit=crop', // Collaborative work
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=400&fit=crop', // Workshop setting
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop', // Tech learning
];

// Get a consistent random image based on hub ID
const getDefaultHubImage = (hubId) => {
    if (!hubId) return DEFAULT_HUB_IMAGES[0];
    // Use hub ID to generate a consistent index
    const hash = hubId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return DEFAULT_HUB_IMAGES[hash % DEFAULT_HUB_IMAGES.length];
};

export default function LearnerHubs() {
    const [hubs, setHubs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newHub, setNewHub] = useState({
        name: '',
        description: '',
        category: '',
        privacyType: 'public',
        coverImage: ''
    });

    useEffect(() => {
        loadHubs();
    }, [search]);

    const loadHubs = async () => {
        try {
            const response = await learnerHubAPI.getHubs({ search });
            setHubs(response.data);
        } catch (error) {
            console.error('Failed to load hubs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHub = async (e) => {
        e.preventDefault();
        try {
            await learnerHubAPI.createHub(newHub);
            setShowCreateDialog(false);
            setNewHub({ name: '', description: '', category: '', privacyType: 'public', coverImage: '' });
            loadHubs();
        } catch (error) {
            console.error('Failed to create hub:', error);
        }
    };

    const getPrivacyIcon = (type) => {
        switch (type) {
            case 'public': return <Globe className="h-4 w-4" />;
            case 'request-to-join': return <UserPlus className="h-4 w-4" />;
            case 'closed': return <Lock className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Learner Hubs</h1>
                    <p className="text-muted-foreground">Join communities and learn together</p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button size="lg">
                            <Plus className="mr-2 h-5 w-5" /> Create Hub
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Learner Hub</DialogTitle>
                            <DialogDescription>Start your own learning community</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateHub} className="space-y-4">
                            <div>
                                <Label>Hub Name</Label>
                                <Input value={newHub.name} onChange={(e) => setNewHub({ ...newHub, name: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input value={newHub.description} onChange={(e) => setNewHub({ ...newHub, description: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Category</Label>
                                <Input value={newHub.category} onChange={(e) => setNewHub({ ...newHub, category: e.target.value })} placeholder="e.g., Web Development" required />
                            </div>
                            <div>
                                <Label>Privacy Type</Label>
                                <select className="w-full h-10 rounded-md border px-3" value={newHub.privacyType} onChange={(e) => setNewHub({ ...newHub, privacyType: e.target.value })}>
                                    <option value="public">Public - Anyone can join</option>
                                    <option value="request-to-join">Request to Join</option>
                                    <option value="closed">Closed - Invite only</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full">Create Hub</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search hubs..."
                        className="pl-10 h-12 text-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hubs.map((hub) => (
                    <Card key={hub._id} className="overflow-hidden hover:shadow-xl transition-all group">
                        <div className="h-48 overflow-hidden">
                            <img
                                src={hub.coverImage || getDefaultHubImage(hub._id)}
                                alt={hub.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-xl mb-2">{hub.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{hub.description}</CardDescription>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    {getPrivacyIcon(hub.privacyType)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{hub.totalMembers} members</span>
                                </div>
                                <Badge>{hub.category}</Badge>
                            </div>
                            <Link to={`/hubs/${hub._id}`}>
                                <Button className="w-full">View Hub</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {hubs.length === 0 && !loading && (
                <div className="text-center py-16">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-2xl font-semibold mb-2">No hubs found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search or create a new hub</p>
                </div>
            )}
        </div>
    );
}
