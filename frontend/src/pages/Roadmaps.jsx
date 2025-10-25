import { useState, useEffect } from 'react';
import { roadmapAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BookOpen, Award, Users, Clock, CheckCircle2, Target } from 'lucide-react';

const Roadmaps = () => {
    const navigate = useNavigate();
    const [approvedRoadmaps, setApprovedRoadmaps] = useState([]);
    const [myRoadmaps, setMyRoadmaps] = useState({ created: [], adopted: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const [newRoadmap, setNewRoadmap] = useState({
        title: '',
        description: '',
        category: '',
        difficulty: 'beginner',
        estimatedDuration: '',
        tags: '',
        milestones: [{ title: '', description: '', tasks: [{ title: '', description: '' }] }]
    });

    const categories = ['Web Development', 'Data Science', 'Mobile Development', 'Cloud Computing', 'AI/ML', 'DevOps'];

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            setLoading(true);
            const [approved, my] = await Promise.all([
                roadmapAPI.getApprovedRoadmaps(),
                roadmapAPI.getMyRoadmaps()
            ]);
            setApprovedRoadmaps(approved.data);
            setMyRoadmaps(my.data);
        } catch (error) {
            console.error('Error fetching roadmaps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdoptRoadmap = async (roadmapId) => {
        try {
            await roadmapAPI.adoptRoadmap(roadmapId, {});
            alert('Roadmap adopted successfully!');
            fetchRoadmaps();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to adopt roadmap');
        }
    };

    const handleCreateRoadmap = async (e) => {
        e.preventDefault();
        try {
            const roadmapData = {
                ...newRoadmap,
                tags: newRoadmap.tags.split(',').map(t => t.trim()).filter(t => t)
            };
            await roadmapAPI.createRoadmap(roadmapData);
            alert('Roadmap created successfully!');
            setCreateDialogOpen(false);
            fetchRoadmaps();
            setNewRoadmap({
                title: '',
                description: '',
                category: '',
                difficulty: 'beginner',
                estimatedDuration: '',
                tags: '',
                milestones: [{ title: '', description: '', tasks: [{ title: '', description: '' }] }]
            });
        } catch (error) {
            alert('Failed to create roadmap');
        }
    };

    const filteredApprovedRoadmaps = approvedRoadmaps.filter(roadmap => {
        const matchesSearch = roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            roadmap.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || roadmap.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-500';
            case 'intermediate': return 'bg-yellow-500';
            case 'advanced': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const RoadmapCard = ({ roadmap, showAdopt = false, showProgress = false }) => (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/roadmaps/${roadmap._id}`)}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{roadmap.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{roadmap.description}</CardDescription>
                    </div>
                    {roadmap.type === 'approved' && (
                        <Badge className="bg-purple-500"><Award className="w-3 h-3 mr-1" />Approved</Badge>
                    )}
                    {roadmap.type === 'trainer' && (
                        <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Trainer</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{roadmap.category}</Badge>
                    <Badge className={getDifficultyColor(roadmap.difficulty)}>{roadmap.difficulty}</Badge>
                    {roadmap.estimatedDuration && (
                        <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />{roadmap.estimatedDuration}
                        </Badge>
                    )}
                </div>

                {roadmap.tags && roadmap.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {roadmap.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {roadmap.milestones?.length || 0} milestones
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {roadmap.usedBy || 0} adopted
                    </span>
                </div>

                {showProgress && roadmap.milestones && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round((roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                                style={{ width: `${(roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {showAdopt && (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAdoptRoadmap(roadmap._id);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Adopt Roadmap
                    </Button>
                )}
                {showProgress && (
                    <Button
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/roadmaps/${roadmap._id}`);
                        }}
                        className="w-full"
                    >
                        Continue Learning
                    </Button>
                )}
            </CardFooter>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Learning Roadmaps
                        </h1>
                        <p className="text-gray-600 mt-2">Structured paths to master any skill</p>
                    </div>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Roadmap
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Custom Roadmap</DialogTitle>
                                <DialogDescription>Design your own learning path</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateRoadmap} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={newRoadmap.title}
                                        onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={newRoadmap.description}
                                        onChange={(e) => setNewRoadmap({ ...newRoadmap, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="category">Category</Label>
                                        <select
                                            id="category"
                                            value={newRoadmap.category}
                                            onChange={(e) => setNewRoadmap({ ...newRoadmap, category: e.target.value })}
                                            className="w-full border rounded-md p-2"
                                            required
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="difficulty">Difficulty</Label>
                                        <select
                                            id="difficulty"
                                            value={newRoadmap.difficulty}
                                            onChange={(e) => setNewRoadmap({ ...newRoadmap, difficulty: e.target.value })}
                                            className="w-full border rounded-md p-2"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="duration">Estimated Duration</Label>
                                    <Input
                                        id="duration"
                                        placeholder="e.g., 3 months, 6 weeks"
                                        value={newRoadmap.estimatedDuration}
                                        onChange={(e) => setNewRoadmap({ ...newRoadmap, estimatedDuration: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                                    <Input
                                        id="tags"
                                        placeholder="React, JavaScript, Frontend"
                                        value={newRoadmap.tags}
                                        onChange={(e) => setNewRoadmap({ ...newRoadmap, tags: e.target.value })}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600">
                                        Create Roadmap
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Tabs defaultValue="explore" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="explore">Explore</TabsTrigger>
                        <TabsTrigger value="my-roadmaps">My Roadmaps</TabsTrigger>
                        <TabsTrigger value="adopted">Adopted</TabsTrigger>
                    </TabsList>

                    <TabsContent value="explore" className="space-y-6">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search roadmaps..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="border rounded-md px-4 py-2"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">Loading roadmaps...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredApprovedRoadmaps.map(roadmap => (
                                    <RoadmapCard key={roadmap._id} roadmap={roadmap} showAdopt={true} />
                                ))}
                            </div>
                        )}

                        {!loading && filteredApprovedRoadmaps.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No roadmaps found. Try adjusting your filters.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="my-roadmaps" className="space-y-6">
                        {myRoadmaps.created.length === 0 ? (
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">You haven't created any roadmaps yet</p>
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    Create Your First Roadmap
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myRoadmaps.created.map(roadmap => (
                                    <RoadmapCard key={roadmap._id} roadmap={roadmap} showProgress={true} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="adopted" className="space-y-6">
                        {myRoadmaps.adopted.length === 0 ? (
                            <div className="text-center py-12">
                                <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">You haven't adopted any roadmaps yet</p>
                                <Button
                                    onClick={() => document.querySelector('[value="explore"]').click()}
                                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    Explore Roadmaps
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myRoadmaps.adopted.map(roadmap => (
                                    <RoadmapCard key={roadmap._id} roadmap={roadmap} showProgress={true} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Roadmaps;
