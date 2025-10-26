import { useEffect, useState } from 'react';
import { trainerAPI, learnerHubAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Search, Star, Calendar, Users, BookOpen } from 'lucide-react';
import { getInitials } from '../lib/utils';

export default function FindTrainers() {
    const [trainers, setTrainers] = useState([]);
    const [myHubs, setMyHubs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Get user's hubs
            const hubsResponse = await learnerHubAPI.getHubs({ member: true });
            setMyHubs(hubsResponse.data);
            
            // Get all trainers from user's hubs
            const trainersResponse = await trainerAPI.getTrainers({ myHubs: true });
            setTrainers(trainersResponse.data);
        } catch (error) {
            console.error('Failed to load trainers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTrainers = trainers.filter(trainer => 
        trainer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.expertise?.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleViewTrainer = (trainerId) => {
        window.location.href = `/trainers/${trainerId}`;
    };

    const TrainerCard = ({ trainer }) => (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewTrainer(trainer._id)}>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={trainer.avatar} />
                        <AvatarFallback className="text-lg">{getInitials(trainer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{trainer.name}</CardTitle>
                        <CardDescription className="mb-2">{trainer.bio?.substring(0, 100)}...</CardDescription>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{trainer.averageRating?.toFixed(1) || 'N/A'}</span>
                                <span>({trainer.totalRatings || 0})</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{trainer.totalSessions || 0} sessions</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-2">
                        {trainer.expertise?.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                                {skill}
                            </Badge>
                        ))}
                        {trainer.expertise?.length > 4 && (
                            <Badge variant="outline">+{trainer.expertise.length - 4} more</Badge>
                        )}
                    </div>
                    
                    {/* Common Hubs */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Member of {trainer.hubs?.length || 0} hub(s)</span>
                    </div>
                    
                    <Button className="w-full" variant="default">
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Profile & Book Session
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-16">
                    <p className="text-muted-foreground">Loading trainers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Find Trainers</h1>
                <p className="text-muted-foreground">
                    Browse trainers from your learner hubs
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or expertise..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Trainers List */}
            {filteredTrainers.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-2xl font-semibold mb-2">No trainers found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery ? 'Try different search terms' : 'Join learner hubs to see trainers'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => window.location.href = '/hubs'}>
                                Explore Learner Hubs
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTrainers.map(trainer => (
                        <TrainerCard key={trainer._id} trainer={trainer} />
                    ))}
                </div>
            )}
        </div>
    );
}
