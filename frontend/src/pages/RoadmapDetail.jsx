import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roadmapAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ArrowLeft, Clock, Users, Target, CheckCircle2, Circle, Award, Calendar, DollarSign } from 'lucide-react';
import { getInitials } from '../lib/utils';

const RoadmapDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoadmap();
    }, [id]);

    const fetchRoadmap = async () => {
        try {
            setLoading(true);
            const response = await roadmapAPI.getRoadmap(id);
            setRoadmap(response.data);
        } catch (error) {
            console.error('Error fetching roadmap:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (milestoneIndex, taskIndex) => {
        try {
            const currentStatus = roadmap.milestones[milestoneIndex].tasks[taskIndex].completed;
            await roadmapAPI.updateProgress(id, {
                milestoneIndex,
                taskIndex,
                completed: !currentStatus
            });
            fetchRoadmap();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const handleToggleMilestone = async (milestoneIndex) => {
        try {
            const currentStatus = roadmap.milestones[milestoneIndex].completed;
            await roadmapAPI.updateProgress(id, {
                milestoneIndex,
                completed: !currentStatus
            });
            fetchRoadmap();
        } catch (error) {
            console.error('Error updating milestone:', error);
        }
    };

    const handleAdoptRoadmap = async () => {
        try {
            await roadmapAPI.adoptRoadmap(id, {});
            alert('Roadmap adopted successfully!');
            navigate('/roadmaps');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to adopt roadmap');
        }
    };

    const calculateProgress = () => {
        if (!roadmap?.milestones) return 0;
        const totalTasks = roadmap.milestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
        const completedTasks = roadmap.milestones.reduce((acc, m) =>
            acc + (m.tasks?.filter(t => t.completed).length || 0), 0
        );
        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-500';
            case 'intermediate': return 'bg-yellow-500';
            case 'advanced': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
                <div className="text-xl">Loading roadmap...</div>
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 mb-4">Roadmap not found</p>
                    <Button onClick={() => navigate('/roadmaps')}>Back to Roadmaps</Button>
                </div>
            </div>
        );
    }

    const progress = calculateProgress();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <Button variant="ghost" onClick={() => navigate('/roadmaps')} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Roadmaps
                </Button>

                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <CardTitle className="text-3xl">{roadmap.title}</CardTitle>
                                    {roadmap.type === 'approved' && (
                                        <Badge className="bg-purple-500">
                                            <Award className="w-3 h-3 mr-1" />Approved
                                        </Badge>
                                    )}
                                    {roadmap.type === 'trainer' && (
                                        <Badge variant="outline">Trainer Roadmap</Badge>
                                    )}
                                </div>
                                <CardDescription className="text-base">{roadmap.description}</CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            <Badge variant="outline">{roadmap.category}</Badge>
                            <Badge className={getDifficultyColor(roadmap.difficulty)}>
                                {roadmap.difficulty}
                            </Badge>
                            {roadmap.estimatedDuration && (
                                <Badge variant="outline">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {roadmap.estimatedDuration}
                                </Badge>
                            )}
                            <Badge variant="outline">
                                <Target className="w-3 h-3 mr-1" />
                                {roadmap.milestones?.length || 0} Milestones
                            </Badge>
                            <Badge variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                {roadmap.usedBy || 0} Adopted
                            </Badge>
                        </div>

                        {roadmap.tags && roadmap.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {roadmap.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Creator Info */}
                        {roadmap.createdBy && (
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Avatar>
                                    <AvatarImage src={roadmap.createdBy.avatar} />
                                    <AvatarFallback>{getInitials(roadmap.createdBy.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">Created by {roadmap.createdBy.name}</p>
                                    {roadmap.createdBy.trainerProfile && (
                                        <p className="text-sm text-gray-600">{roadmap.createdBy.bio}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Trainer Schedule Info */}
                        {roadmap.type === 'trainer' && roadmap.schedule && (
                            <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                                <h3 className="font-semibold text-purple-900">Trainer-Led Program</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {roadmap.schedule.startDate && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-purple-600" />
                                            <span>Starts: {new Date(roadmap.schedule.startDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {roadmap.schedule.sessionsPerWeek && (
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-purple-600" />
                                            <span>{roadmap.schedule.sessionsPerWeek} sessions/week</span>
                                        </div>
                                    )}
                                    {roadmap.schedule.price && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-purple-600" />
                                            <span>${roadmap.schedule.price}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        {roadmap.type === 'custom' && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Overall Progress</span>
                                    <span className="text-purple-600 font-bold">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {roadmap.isTemplate && roadmap.type !== 'custom' && (
                            <Button
                                onClick={handleAdoptRoadmap}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <Award className="w-4 h-4 mr-2" />
                                Adopt This Roadmap
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Milestones */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Learning Path</h2>
                    {roadmap.milestones?.map((milestone, mIndex) => (
                        <Card key={mIndex} className="border-l-4 border-l-purple-500">
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => handleToggleMilestone(mIndex)}
                                        className="mt-1"
                                    >
                                        {milestone.completed ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-gray-400" />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">
                                            Milestone {mIndex + 1}: {milestone.title}
                                        </CardTitle>
                                        {milestone.description && (
                                            <CardDescription className="mt-2">
                                                {milestone.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {milestone.tasks && milestone.tasks.length > 0 && (
                                    <div className="space-y-3 ml-9">
                                        {milestone.tasks.map((task, tIndex) => (
                                            <div key={tIndex} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                                <button
                                                    onClick={() => handleToggleTask(mIndex, tIndex)}
                                                    className="mt-0.5"
                                                >
                                                    {task.completed ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                                        {task.title}
                                                    </p>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    {task.resources && task.resources.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {task.resources.map((resource, rIndex) => (
                                                                <a
                                                                    key={rIndex}
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-purple-600 hover:underline block"
                                                                >
                                                                    📚 {resource.title}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Adopted By Section */}
                {roadmap.adoptedBy && roadmap.adoptedBy.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Learners Following This Path</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {roadmap.adoptedBy.slice(0, 10).map((adoption, index) => (
                                    <Avatar key={index}>
                                        <AvatarImage src={adoption.user?.avatar} />
                                        <AvatarFallback>
                                            {getInitials(adoption.user?.name || 'User')}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {roadmap.adoptedBy.length > 10 && (
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">
                                        +{roadmap.adoptedBy.length - 10}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default RoadmapDetail;
