import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Trophy, Star, Award, TrendingUp, Edit } from 'lucide-react';
import { getInitials } from '../lib/utils';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        skillsToTeach: user?.skillsToTeach || [],
        skillsToLearn: user?.skillsToLearn || [],
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await userAPI.updateProfile(formData);
            updateUser(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const handleBecomeTrainer = async () => {
        try {
            const response = await userAPI.becomeTrainer({
                trainerProfile: {
                    domain: [],
                    experience: 0,
                    pricing: { hourlyRate: 0, programs: [] }
                }
            });
            updateUser(response.data);
            alert('You are now a trainer! Update your trainer profile to start receiving bookings.');
        } catch (error) {
            console.error('Failed to become trainer:', error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <Avatar className="h-32 w-32 mx-auto mb-4">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback className="text-3xl">{getInitials(user?.name || 'User')}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
                                <p className="text-muted-foreground mb-2">{user?.email}</p>
                                <Badge variant={user?.isTrainer ? 'default' : 'secondary'}>
                                    {user?.isTrainer ? 'Trainer' : 'Learner'}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" />
                                        <span className="font-medium">Points</span>
                                    </div>
                                    <span className="text-lg font-bold">{user?.points || 0}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                        <span className="font-medium">Level</span>
                                    </div>
                                    <span className="text-lg font-bold">{user?.level || 1}</span>
                                </div>

                                {user?.isTrainer && (
                                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Star className="h-5 w-5 text-yellow-600" />
                                            <span className="font-medium">Rating</span>
                                        </div>
                                        <span className="text-lg font-bold">{user?.averageRating?.toFixed(1) || '0.0'}</span>
                                    </div>
                                )}
                            </div>

                            {!user?.isTrainer && (
                                <Button
                                    className="w-full mt-6"
                                    variant="outline"
                                    onClick={handleBecomeTrainer}
                                >
                                    Become a Trainer
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Tabs defaultValue="profile" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="skills">Skills</TabsTrigger>
                            <TabsTrigger value="badges">Badges</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Profile Information</CardTitle>
                                        <CardDescription>Manage your personal details</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(!isEditing)}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        {isEditing ? 'Cancel' : 'Edit'}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {isEditing ? (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <Label>Name</Label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Bio</Label>
                                                <Input
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                    placeholder="Tell us about yourself..."
                                                />
                                            </div>
                                            <Button type="submit" className="w-full">Save Changes</Button>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-muted-foreground">Name</Label>
                                                <p className="text-lg font-medium">{user?.name}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Email</Label>
                                                <p className="text-lg font-medium">{user?.email}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Bio</Label>
                                                <p className="text-lg font-medium">{user?.bio || 'No bio yet'}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="skills">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Skills I Can Teach</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {user?.skillsToTeach && user.skillsToTeach.length > 0 ? (
                                                user.skillsToTeach.map((skill, idx) => (
                                                    <Badge key={idx} variant="default">{skill.skill} ({skill.level})</Badge>
                                                ))
                                            ) : (
                                                <p className="text-muted-foreground">No skills added yet</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Skills I Want to Learn</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {user?.skillsToLearn && user.skillsToLearn.length > 0 ? (
                                                user.skillsToLearn.map((skill, idx) => (
                                                    <Badge key={idx} variant="outline">{skill}</Badge>
                                                ))
                                            ) : (
                                                <p className="text-muted-foreground">No skills added yet</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="badges">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Achievements & Badges</CardTitle>
                                    <CardDescription>Your earned badges and milestones</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {user?.badges && user.badges.length > 0 ? (
                                        <div className="grid md:grid-cols-3 gap-4">
                                            {user.badges.map((badge, idx) => (
                                                <div key={idx} className="flex flex-col items-center p-4 border rounded-lg">
                                                    <Award className="h-12 w-12 text-yellow-500 mb-2" />
                                                    <p className="font-semibold text-center">{badge.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(badge.earnedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 text-muted-foreground">
                                            <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                            <p>No badges earned yet. Keep learning to unlock achievements!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
