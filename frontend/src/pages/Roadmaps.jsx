// frontend/src/pages/Roadmaps.jsx

import { useState, useEffect } from 'react';
import { roadmapAPI } from '../services/api'; // Ensure correct path
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea'; // Import Textarea
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
// --- Import required icons ---
import { Search, Plus, BookOpen, Award, Users, Clock, CheckCircle2, Target, Sparkles, Loader2, X } from 'lucide-react';

const Roadmaps = () => {
    const navigate = useNavigate();
    const [approvedRoadmaps, setApprovedRoadmaps] = useState([]);
    const [myRoadmaps, setMyRoadmaps] = useState({ created: [], adopted: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    // --- State for Manual Creation Dialog ---
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

    // --- NEW: State for AI Generation Dialog ---
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiFormData, setAiFormData] = useState({
        topic: '',
        goal: '',
        difficulty: 'beginner',
        // duration: '', // Optional: Add if needed
    });
    // --- End NEW State ---

    // Updated categories list
    const categories = ['Web Development', 'Data Science', 'Mobile Development', 'Cloud Computing', 'AI/ML', 'DevOps', 'Cybersecurity', 'Game Development', 'UI/UX Design', 'Project Management', 'Other'];

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            setLoading(true);
            const [approvedRes, myRes] = await Promise.all([
                roadmapAPI.getApprovedRoadmaps(),
                roadmapAPI.getMyRoadmaps()
            ]);
            setApprovedRoadmaps(approvedRes.data || []);
            setMyRoadmaps({
                created: myRes.data?.created || [],
                adopted: myRes.data?.adopted || []
            });
        } catch (error) {
            console.error('Error fetching roadmaps:', error);
            // Consider adding user-facing error feedback
        } finally {
            setLoading(false);
        }
    };

    const handleAdoptRoadmap = async (roadmapId) => {
        try {
            await roadmapAPI.adoptRoadmap(roadmapId, {});
            alert('Roadmap adopted successfully! Find it under "My Adopted".');
            fetchRoadmaps(); // Refresh the lists
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to adopt roadmap. You might have already adopted it.');
        }
    };

    // --- Manual Roadmap Creation Handlers (Ensure these are correct) ---

    const handleManualInputChange = (e, field) => {
        setNewRoadmap(prev => ({ ...prev, [field]: e.target.value }));
    };
    const handleMilestoneChange = (index, field, value) => {
        const updatedMilestones = [...newRoadmap.milestones];
        updatedMilestones[index][field] = value;
        setNewRoadmap(prev => ({ ...prev, milestones: updatedMilestones }));
    };
    const handleTaskChange = (mIndex, tIndex, field, value) => {
        const updatedMilestones = [...newRoadmap.milestones];
        updatedMilestones[mIndex].tasks[tIndex][field] = value;
        setNewRoadmap(prev => ({ ...prev, milestones: updatedMilestones }));
    };
    const addMilestone = () => {
        setNewRoadmap(prev => ({
            ...prev,
            milestones: [...prev.milestones, { title: '', description: '', tasks: [{ title: '', description: '' }] }]
        }));
    };
    const removeMilestone = (index) => {
        if (newRoadmap.milestones.length <= 1) return alert("Must have at least one milestone.");
        setNewRoadmap(prev => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }));
    };
    const addTask = (mIndex) => {
        const updatedMilestones = [...newRoadmap.milestones];
        updatedMilestones[mIndex].tasks.push({ title: '', description: '' });
        setNewRoadmap(prev => ({ ...prev, milestones: updatedMilestones }));
    };
    const removeTask = (mIndex, tIndex) => {
        if (newRoadmap.milestones[mIndex].tasks.length <= 1) return alert("Must have at least one task per milestone.");
        const updatedMilestones = [...newRoadmap.milestones];
        updatedMilestones[mIndex].tasks = updatedMilestones[mIndex].tasks.filter((_, i) => i !== tIndex);
        setNewRoadmap(prev => ({ ...prev, milestones: updatedMilestones }));
    };

    // Handles submission of the MANUAL creation form
    const handleCreateRoadmap = async (e) => {
        e.preventDefault();
        try {
            if (!newRoadmap.title.trim()) return alert('Title is required');
            if (!newRoadmap.category) return alert('Category is required');

            const validMilestones = newRoadmap.milestones
                .filter(m => m.title.trim())
                .map((m, mIdx) => ({
                    ...m,
                    order: mIdx + 1,
                    tasks: m.tasks.filter(t => t.title.trim()).map(t => ({ // Filter empty tasks and map
                        title: t.title.trim(),
                        description: t.description?.trim() || ''
                    }))
                }));

            if (validMilestones.length === 0) return alert('At least one milestone with a title is required');
            if (validMilestones.some(m => m.tasks.length === 0)) return alert('Each milestone must have at least one task with a title');

            const roadmapData = {
                title: newRoadmap.title.trim(),
                description: newRoadmap.description.trim(),
                category: newRoadmap.category,
                difficulty: newRoadmap.difficulty,
                estimatedDuration: newRoadmap.estimatedDuration.trim(),
                tags: newRoadmap.tags.split(',').map(t => t.trim()).filter(t => t),
                milestones: validMilestones.map(m => ({ // Send cleaned data
                    title: m.title,
                    description: m.description,
                    order: m.order,
                    tasks: m.tasks // Already cleaned
                }))
            };

            await roadmapAPI.createRoadmap(roadmapData);
            alert('Roadmap created successfully!');
            setCreateDialogOpen(false);
            fetchRoadmaps(); // Refresh lists
            setNewRoadmap({ // Reset form
                title: '', description: '', category: '', difficulty: 'beginner', estimatedDuration: '', tags: '',
                milestones: [{ title: '', description: '', tasks: [{ title: '', description: '' }] }]
            });
        } catch (error) {
            console.error('Failed to create roadmap:', error);
            alert(error.response?.data?.message || 'Failed to create roadmap');
        }
    };

    // --- NEW: AI Roadmap Generation Handlers ---

    const handleAiInputChange = (e) => {
        const { name, value } = e.target;
        setAiFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateWithAI = async (e) => {
        e.preventDefault();
        if (!aiFormData.topic.trim()) {
            alert('Please enter a topic for the AI.');
            return;
        }
        setAiGenerating(true);
        try {
            const response = await roadmapAPI.generateRoadmap({
                topic: aiFormData.topic,
                goal: aiFormData.goal,
                difficulty: aiFormData.difficulty,
            });
            alert('AI Roadmap generated successfully! You have automatically adopted it.');
            setAiDialogOpen(false);
            setAiFormData({ topic: '', goal: '', difficulty: 'beginner' });
            fetchRoadmaps(); // Refresh the lists
            navigate(`/roadmaps/${response.data._id}`); // Navigate to the new detail page
        } catch (error) {
            console.error('Failed to generate roadmap with AI:', error);
            alert(error.response?.data?.message || 'An error occurred during AI generation.');
        } finally {
            setAiGenerating(false);
        }
    };
    // --- End NEW AI Handlers ---


    // --- Filtering and Display Logic ---

    const filteredApprovedRoadmaps = approvedRoadmaps.filter(roadmap => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = roadmap.title.toLowerCase().includes(lowerSearchTerm) ||
            (roadmap.description && roadmap.description.toLowerCase().includes(lowerSearchTerm)) ||
            (roadmap.tags && roadmap.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))); // Search tags too
        const matchesCategory = selectedCategory === 'all' || roadmap.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getDifficultyBadgeClass = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner': return 'bg-green-100 text-green-800 border border-green-200';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'advanced': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const RoadmapCard = ({ roadmap, showAdopt = false, showProgress = false }) => (
        // Added flex flex-col h-full to make cards equal height in a grid row
        <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={() => navigate(`/roadmaps/${roadmap._id}`)}>
             <CardHeader className="pb-3"> {/* Reduced padding */}
                <div className="flex justify-between items-start mb-2 gap-2">
                    <CardTitle className="text-lg font-semibold line-clamp-2">{roadmap.title}</CardTitle>
                    {roadmap.type === 'approved' && (
                        <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-xs shrink-0"><Award className="w-3 h-3 mr-1" />Approved</Badge>
                    )}
                </div>
                <CardDescription className="text-xs line-clamp-2">{roadmap.description || 'No description.'}</CardDescription>
            </CardHeader>
             <CardContent className="space-y-2 text-xs flex-grow pb-3"> {/* Added flex-grow, reduced padding */}
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">{roadmap.category || 'General'}</Badge>
                    <Badge className={`text-xs font-medium ${getDifficultyBadgeClass(roadmap.difficulty)}`}>{roadmap.difficulty || 'N/A'}</Badge>
                    {roadmap.estimatedDuration && (
                        <Badge variant="outline" className="flex items-center text-xs">
                            <Clock className="w-3 h-3 mr-1" />{roadmap.estimatedDuration}
                        </Badge>
                    )}
                </div>

                {roadmap.tags && roadmap.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        {roadmap.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                        ))}
                        {roadmap.tags.length > 3 && <Badge variant="secondary" className="text-xs font-normal">...</Badge>}
                    </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-600 pt-1.5">
                    <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {roadmap.milestones?.length || 0} milestones
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {roadmap.usedBy || 0} adopted
                    </span>
                </div>

                {/* Simplified Progress Calculation for Card View (using Milestones) */}
                {showProgress && roadmap.milestones?.length > 0 && (
                     <div className="space-y-1 pt-1.5">
                        <div className="flex justify-between text-xs font-medium text-gray-700">
                             <span>Progress</span>
                             <span>{Math.round((roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${(roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-3"> {/* Reduced padding */}
                {showAdopt && (
                    <Button onClick={(e) => { e.stopPropagation(); handleAdoptRoadmap(roadmap._id); }} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90" size="sm">
                        <BookOpen className="w-4 h-4 mr-2" /> Adopt
                    </Button>
                )}
                {showProgress && (
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/roadmaps/${roadmap._id}`); }} className="w-full" size="sm">
                        Continue
                    </Button>
                )}
                {/* Fallback View Button */}
                 {!showAdopt && !showProgress && (
                      <Button variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/roadmaps/${roadmap._id}`); }} className="w-full" size="sm">
                         View Details
                     </Button>
                 )}
            </CardFooter>
        </Card>
    );

    // --- Main Return JSX ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Learning Roadmaps
                        </h1>
                        <p className="text-gray-600 mt-1 md:mt-2">Structured paths to master any skill</p>
                    </div>

                    {/* Buttons Section */}
                    <div className="flex flex-wrap gap-2">

                        {/* Manual Create Button & Dialog */}
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Manually
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl">Create Custom Roadmap</DialogTitle>
                                    <DialogDescription>Design your own learning path step-by-step.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateRoadmap} className="space-y-6 pt-4">
                                     {/* General Info */}
                                     <div className="space-y-4 border-b pb-6">
                                         {/* ... (Title, Category, Description, Difficulty, Duration, Tags Inputs as before) ... */}
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="manual-title" className="font-semibold">Title *</Label>
                                                <Input id="manual-title" value={newRoadmap.title} onChange={(e) => handleManualInputChange(e, 'title')} required className="mt-1"/>
                                            </div>
                                             <div>
                                                 <Label htmlFor="manual-category" className="font-semibold">Category *</Label>
                                                 <select id="manual-category" value={newRoadmap.category} onChange={(e) => handleManualInputChange(e, 'category')} className="w-full border rounded-md p-2 mt-1 bg-white" required>
                                                     <option value="">Select category</option>
                                                     {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                                                 </select>
                                             </div>
                                        </div>
                                         <div>
                                             <Label htmlFor="manual-description" className="font-semibold">Description</Label>
                                             <Textarea id="manual-description" value={newRoadmap.description} onChange={(e) => handleManualInputChange(e, 'description')} className="mt-1" rows={2}/>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                             <div>
                                                 <Label htmlFor="manual-difficulty" className="font-semibold">Difficulty</Label>
                                                 <select id="manual-difficulty" value={newRoadmap.difficulty} onChange={(e) => handleManualInputChange(e, 'difficulty')} className="w-full border rounded-md p-2 mt-1 bg-white">
                                                     <option value="beginner">Beginner</option>
                                                     <option value="intermediate">Intermediate</option>
                                                     <option value="advanced">Advanced</option>
                                                 </select>
                                             </div>
                                             <div>
                                                 <Label htmlFor="manual-duration" className="font-semibold">Est. Duration</Label>
                                                 <Input id="manual-duration" placeholder="e.g., 3 months" value={newRoadmap.estimatedDuration} onChange={(e) => handleManualInputChange(e, 'estimatedDuration')} className="mt-1"/>
                                             </div>
                                             <div>
                                                 <Label htmlFor="manual-tags" className="font-semibold">Tags (comma-separated)</Label>
                                                 <Input id="manual-tags" placeholder="e.g., React, Hooks" value={newRoadmap.tags} onChange={(e) => handleManualInputChange(e, 'tags')} className="mt-1"/>
                                             </div>
                                         </div>
                                    </div>

                                    {/* Milestones Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-semibold">Milestones</h3>
                                            <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                                                <Plus className="w-3 h-3 mr-1" /> Add Milestone
                                            </Button>
                                        </div>
                                        {newRoadmap.milestones.map((milestone, mIndex) => (
                                            <div key={mIndex} className="border rounded-lg p-4 bg-gray-50 space-y-3 relative">
                                                 <Button type="button" variant="ghost" size="icon" onClick={() => removeMilestone(mIndex)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 h-6 w-6"> <X className="h-4 w-4" /> </Button>
                                                 <p className="font-medium text-sm text-gray-600">Milestone {mIndex + 1}</p>
                                                 <div>
                                                     <Label htmlFor={`m-title-${mIndex}`} className="text-xs font-semibold">Title *</Label>
                                                     <Input id={`m-title-${mIndex}`} placeholder="Milestone title" value={milestone.title} onChange={(e) => handleMilestoneChange(mIndex, 'title', e.target.value)} required className="mt-1 h-8 text-sm"/>
                                                 </div>
                                                 <div>
                                                     <Label htmlFor={`m-desc-${mIndex}`} className="text-xs font-semibold">Description</Label>
                                                     <Input id={`m-desc-${mIndex}`} placeholder="Milestone objective" value={milestone.description} onChange={(e) => handleMilestoneChange(mIndex, 'description', e.target.value)} className="mt-1 h-8 text-sm"/>
                                                 </div>

                                                 {/* Tasks */}
                                                 <div className="border-t pt-3 mt-3 space-y-2 ml-4">
                                                      <div className="flex justify-between items-center mb-2">
                                                         <Label className="text-xs font-semibold">Tasks</Label>
                                                         <Button type="button" variant="outline" size="sm" onClick={() => addTask(mIndex)} className="text-xs h-6 px-2"> <Plus className="w-2 h-2 mr-1"/> Add Task </Button>
                                                      </div>
                                                      {milestone.tasks.map((task, tIndex) => (
                                                         <div key={tIndex} className="flex gap-2 items-start bg-white p-2 rounded border">
                                                              <div className="flex-1 space-y-1">
                                                                 <Input placeholder="Task title *" value={task.title} onChange={(e) => handleTaskChange(mIndex, tIndex, 'title', e.target.value)} required className="text-xs h-7"/>
                                                                 <Input placeholder="Task description" value={task.description} onChange={(e) => handleTaskChange(mIndex, tIndex, 'description', e.target.value)} className="text-xs h-7"/>
                                                              </div>
                                                              <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(mIndex, tIndex)} className="text-red-500 hover:bg-red-100 h-7 w-7"> <X className="h-3 w-3" /> </Button>
                                                         </div>
                                                      ))}
                                                  </div>
                                             </div>
                                        ))}
                                    </div>

                                    <DialogFooter className="pt-6">
                                        <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600"> Create Roadmap </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* AI Generate Button & Dialog */}
                        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 hover:text-purple-700">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate with AI
                                </Button>
                            </DialogTrigger>
                             <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl">Generate Roadmap with AI</DialogTitle>
                                    <DialogDescription>Describe the topic or skill you want a roadmap for.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleGenerateWithAI} className="space-y-4 py-4">
                                     <div>
                                         <Label htmlFor="ai-topic" className="font-semibold">Main Topic/Skill *</Label>
                                         <Input id="ai-topic" name="topic" value={aiFormData.topic} onChange={handleAiInputChange} placeholder="e.g., React Native, Advanced SQL" required className="mt-1"/>
                                     </div>
                                     <div>
                                         <Label htmlFor="ai-goal" className="font-semibold">Learning Goal (Optional)</Label>
                                         <Textarea id="ai-goal" name="goal" value={aiFormData.goal} onChange={handleAiInputChange} placeholder="e.g., Build cross-platform apps" rows={2} className="mt-1"/>
                                     </div>
                                     <div>
                                         <Label htmlFor="ai-difficulty" className="font-semibold">Target Difficulty</Label>
                                         <select id="ai-difficulty" name="difficulty" value={aiFormData.difficulty} onChange={handleAiInputChange} className="w-full border rounded-md p-2 mt-1 bg-white">
                                             <option value="beginner">Beginner</option>
                                             <option value="intermediate">Intermediate</option>
                                             <option value="advanced">Advanced</option>
                                         </select>
                                     </div>
                                    <DialogFooter className="pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setAiDialogOpen(false)} disabled={aiGenerating}>Cancel</Button>
                                        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600" disabled={aiGenerating}>
                                            {aiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                            {aiGenerating ? 'Generating...' : 'Generate Roadmap'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="explore" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto md:mx-0">
                        <TabsTrigger value="explore">Explore</TabsTrigger>
                        <TabsTrigger value="my-roadmaps">My Created</TabsTrigger>
                        <TabsTrigger value="adopted">My Adopted</TabsTrigger>
                    </TabsList>

                    {/* Explore Tab Content */}
                    <TabsContent value="explore" className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Search approved roadmaps..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                            </div>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border rounded-md px-4 py-2 bg-white">
                                <option value="all">All Categories</option>
                                {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                        </div>
                        {loading ? ( <div className="text-center py-16 text-gray-500">Loading...</div> )
                         : filteredApprovedRoadmaps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredApprovedRoadmaps.map(roadmap => (
                                    <RoadmapCard key={roadmap._id} roadmap={roadmap} showAdopt={true} />
                                ))}
                            </div>
                         ) : (
                            <div className="text-center py-16 text-gray-500">
                                <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                No approved roadmaps match your search.
                            </div>
                         )}
                    </TabsContent>

                    {/* My Created Tab Content */}
                     <TabsContent value="my-roadmaps">
                         {loading ? ( <div className="text-center py-16 text-gray-500">Loading...</div> )
                         : myRoadmaps.created.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {myRoadmaps.created.map(roadmap => (
                                     <RoadmapCard key={roadmap._id} roadmap={roadmap} showProgress={false} />
                                 ))}
                             </div>
                         ) : (
                             <div className="text-center py-16 text-gray-500">
                                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                You haven't created any roadmaps yet.
                                <div className="mt-4 flex justify-center gap-2">
                                     <Button onClick={() => setCreateDialogOpen(true)}>Create Manually</Button>
                                     <Button variant="outline" onClick={() => setAiDialogOpen(true)}>Generate with AI</Button>
                                </div>
                             </div>
                         )}
                     </TabsContent>

                    {/* Adopted Tab Content */}
                    <TabsContent value="adopted">
                         {loading ? ( <div className="text-center py-16 text-gray-500">Loading...</div> )
                         : myRoadmaps.adopted.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {myRoadmaps.adopted.map(roadmap => (
                                     <RoadmapCard key={roadmap._id} roadmap={roadmap} showProgress={true} />
                                 ))}
                             </div>
                         ) : (
                            <div className="text-center py-16 text-gray-500">
                                <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                You haven't adopted any roadmaps yet.
                                {/* Button to switch tab - find the button element and click it */}
                                <Button
                                     onClick={() => {
                                         const exploreTrigger = document.querySelector('button[role="tab"][value="explore"]');
                                         exploreTrigger?.click();
                                     }}
                                     className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                     Explore Roadmaps
                                 </Button>
                            </div>
                         )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Roadmaps;
