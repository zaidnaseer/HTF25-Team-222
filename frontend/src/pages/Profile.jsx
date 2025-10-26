import { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Trophy, Star, Award, TrendingUp, Edit, LayoutDashboard, Settings, Mail } from 'lucide-react'; // Import icons
import { getInitials } from '../lib/utils';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    // Initialize formData safely even if user is null initially
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        // These might not be directly editable here, adjust if needed
        // skillsToTeach: [],
        // skillsToLearn: [],
    });

    // Update form data when user loads or changes
    useState(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
            });
        }
    }, [user]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await userAPI.updateProfile(formData);
            updateUser(response.data); // Update user context with new data
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    };

    const handleBecomeTrainer = async () => {
        if (!confirm('Are you sure you want to become a trainer? This allows others to book sessions with you.')) return;
        try {
            // Send minimal required trainerProfile data if necessary
            const response = await userAPI.becomeTrainer({}); // API might handle defaults
            updateUser(response.data);
            alert('Congratulations! You are now a trainer. Please update your availability and profile details.');
            // Optionally redirect to trainer settings
            // navigate('/availability-settings');
        } catch (error) {
            console.error('Failed to become trainer:', error);
            alert(error.response?.data?.message || 'Failed to become trainer.');
        }
    };

    // Handle case where user data is not yet loaded
    if (!user) {
        return (
             <div className="container mx-auto px-4 py-8 text-center">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl"> {/* Increased max-width */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: User Info & Stats */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24"> {/* Added sticky */}
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <Avatar className="h-24 w-24 mx-auto mb-4 ring-2 ring-primary/20"> {/* Adjusted size */}
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-3xl">{getInitials(user.name || 'U')}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                                <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                                <Badge variant={user.isTrainer ? 'default' : 'secondary'}>
                                    {user.isTrainer ? 'Trainer' : 'Learner'}
                                </Badge>
                            </div>

                            <div className="space-y-3"> {/* Adjusted spacing */}
                                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-primary" />
                                        <span className="font-medium">Points</span>
                                    </div>
                                    <span className="font-semibold">{user.points || 0}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-purple-600" />
                                        <span className="font-medium">Level</span>
                                    </div>
                                    <span className="font-semibold">{user.level || 1}</span>
                                </div>

                                {user.isTrainer && (
                                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg text-sm">
                                        <div className="flex items-center gap-2">
                                            <Star className="h-4 w-4 text-yellow-600" />
                                            <span className="font-medium">Rating</span>
                                        </div>
                                        <span className="font-semibold">{user.averageRating?.toFixed(1) || '0.0'}</span>
                                    </div>
                                )}
                            </div>

                            {!user.isTrainer && (
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

                {/* Right Column: Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="profile" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="skills">Skills</TabsTrigger>
                            <TabsTrigger value="badges">Badges</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile">
                             {/* --- TRAINER TOOLS CARD (Conditional) --- */}
                            {user.isTrainer && (
                                <Card className="mb-6 bg-blue-50 border-blue-200"> {/* Added background */}
                                    <CardHeader>
                                        <CardTitle className="text-lg text-blue-900">Trainer Tools</CardTitle> {/* Styled title */}
                                        <CardDescription className="text-blue-700">Manage your trainer profile and availability.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col sm:flex-row gap-3"> {/* Adjusted gap */}
                                        <Link to="/trainer-dashboard" className="flex-1">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white"> {/* Styled button */}
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                Trainer Dashboard
                                            </Button>
                                        </Link>
                                        <Link to="/availability-settings" className="flex-1">
                                            <Button variant="outline" className="w-full border-blue-300 text-blue-800 hover:bg-blue-100"> {/* Styled button */}
                                                <Settings className="mr-2 h-4 w-4" />
                                                Edit Availability
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Profile Information Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-4"> {/* Adjusted padding */}
                                    <div>
                                        <CardTitle>Profile Information</CardTitle>
                                        <CardDescription>Manage your personal details</CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost" // Changed variant
                                        size="sm"
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="flex items-center gap-1 text-primary hover:bg-primary/10" // Styled button
                                    >
                                        <Edit className="h-4 w-4" />
                                        {isEditing ? 'Cancel' : 'Edit'}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {isEditing ? (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="bio">Bio</Label>
                                                <Input // Changed to Input for consistency, use Textarea if needed
                                                    id="bio"
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                    placeholder="Tell us a little about yourself..."
                                                />
                                            </div>
                                            <Button type="submit" className="w-full sm:w-auto">Save Changes</Button> {/* Adjusted width */}
                                        </form>
                                    ) : (
                                        <div className="space-y-4 text-sm"> {/* Adjusted text size */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <Label className="text-muted-foreground font-normal">Name</Label>
                                                <p className="col-span-2 font-medium">{user.name}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <Label className="text-muted-foreground font-normal">Email</Label>
                                                <p className="col-span-2 font-medium">{user.email}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <Label className="text-muted-foreground font-normal">Bio</Label>
                                                <p className="col-span-2 font-medium">{user.bio || <span className="italic text-muted-foreground">No bio provided</span>}</p>
                                            </div>
                                             <div className="grid grid-cols-3 gap-4">
                                                <Label className="text-muted-foreground font-normal">Role</Label>
                                                <p className="col-span-2 font-medium">{user.isTrainer ? 'Trainer' : 'Learner'}</p>
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
                                        <CardDescription>Areas where you can share your knowledge.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {user.skillsToTeach && user.skillsToTeach.length > 0 ? (
                                                user.skillsToTeach.map((skill, idx) => (
                                                    // Assuming skill object has 'skill' and 'level' properties
                                                    <Badge key={idx} variant="default">{skill.skill} <span className="ml-1 opacity-75">({skill.level})</span></Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">No teaching skills listed yet.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Skills I Want to Learn</CardTitle>
                                         <CardDescription>Topics you're interested in exploring.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
                                                user.skillsToLearn.map((skill, idx) => (
                                                    // Assuming skillsToLearn is an array of strings
                                                    <Badge key={idx} variant="outline">{skill}</Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">No learning goals listed yet.</p>
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
                                    <CardDescription>Your earned badges and milestones.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {user.badges && user.badges.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"> {/* Responsive grid */}
                                            {user.badges.map((badge, idx) => (
                                                <div key={idx} className="flex flex-col items-center text-center p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                                                    <Award className="h-10 w-10 text-yellow-500 mb-2" /> {/* Adjusted size */}
                                                    <p className="text-sm font-semibold">{badge.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 text-muted-foreground">
                                            <Award className="h-16 w-16 mx-auto mb-4 opacity-30" /> {/* Adjusted opacity */}
                                            <p>No badges earned yet. Keep learning!</p>
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
