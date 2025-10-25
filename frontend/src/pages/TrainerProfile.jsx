import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trainerAPI, sessionAPI, ratingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Star, DollarSign, Calendar, Users, Award } from 'lucide-react';
import { getInitials } from '../lib/utils';

export default function TrainerProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const [trainer, setTrainer] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [showBookDialog, setShowBookDialog] = useState(false);
    const [bookingData, setBookingData] = useState({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        type: 'one-on-one'
    });

    useEffect(() => {
        loadTrainerProfile();
    }, [id]);

    const loadTrainerProfile = async () => {
        try {
            const response = await trainerAPI.getTrainer(id);
            setTrainer(response.data.trainer);
            setRatings(response.data.ratings);
        } catch (error) {
            console.error('Failed to load trainer:', error);
        }
    };

    const handleBookSession = async (e) => {
        e.preventDefault();
        try {
            await sessionAPI.createSession({
                ...bookingData,
                trainerId: id,
                price: trainer.trainerProfile.pricing.hourlyRate
            });
            setShowBookDialog(false);
            alert('Session booked successfully!');
        } catch (error) {
            console.error('Failed to book session:', error);
        }
    };

    if (!trainer) return <div className="container mx-auto px-4 py-8">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <Avatar className="h-32 w-32 mx-auto mb-4">
                                    <AvatarImage src={trainer.avatar} />
                                    <AvatarFallback className="text-3xl">{getInitials(trainer.name)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-bold">{trainer.name}</h2>
                                <p className="text-muted-foreground">{trainer.bio}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-center gap-2">
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-2xl font-bold">{trainer.averageRating.toFixed(1)}</span>
                                    <span className="text-muted-foreground">({trainer.totalRatings} reviews)</span>
                                </div>

                                <div className="flex items-center justify-center gap-6 text-sm">
                                    <div className="text-center">
                                        <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                        <p className="font-semibold">{trainer.trainerProfile.totalStudents}</p>
                                        <p className="text-muted-foreground">Students</p>
                                    </div>
                                    <div className="text-center">
                                        <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                        <p className="font-semibold">{trainer.trainerProfile.totalSessions}</p>
                                        <p className="text-muted-foreground">Sessions</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-primary/10 rounded-lg text-center">
                                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                                        <DollarSign />
                                        <span>{trainer.trainerProfile.pricing.hourlyRate}</span>
                                        <span className="text-base font-normal">/hour</span>
                                    </div>
                                </div>
                            </div>

                            <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
                                <DialogTrigger asChild>
                                    <Button className="w-full" size="lg">Book a Session</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Book a Session with {trainer.name}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleBookSession} className="space-y-4">
                                        <div>
                                            <Label>Session Title</Label>
                                            <Input value={bookingData.title} onChange={(e) => setBookingData({ ...bookingData, title: e.target.value })} required />
                                        </div>
                                        <div>
                                            <Label>Description</Label>
                                            <Input value={bookingData.description} onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>Date & Time</Label>
                                            <Input type="datetime-local" value={bookingData.scheduledAt} onChange={(e) => setBookingData({ ...bookingData, scheduledAt: e.target.value })} required />
                                        </div>
                                        <div>
                                            <Label>Duration (minutes)</Label>
                                            <Input type="number" value={bookingData.duration} onChange={(e) => setBookingData({ ...bookingData, duration: e.target.value })} required />
                                        </div>
                                        <div>
                                            <Label>Total: ${(trainer.trainerProfile.pricing.hourlyRate * (bookingData.duration / 60)).toFixed(2)}</Label>
                                        </div>
                                        <Button type="submit" className="w-full">Confirm Booking</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expertise</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {trainer.trainerProfile.domain.map((domain, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">{domain}</Badge>
                                ))}
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground">Experience: {trainer.trainerProfile.experience} years</p>
                            </div>
                        </CardContent>
                    </Card>

                    {trainer.trainerProfile.pricing.programs.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Training Programs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {trainer.trainerProfile.pricing.programs.map((program, idx) => (
                                        <div key={idx} className="p-4 border rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-lg">{program.title}</h4>
                                                <Badge>{program.type}</Badge>
                                            </div>
                                            <p className="text-muted-foreground text-sm mb-3">{program.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">{program.duration}</span>
                                                <span className="text-lg font-bold text-primary">${program.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Reviews ({ratings.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ratings.map((rating) => (
                                    <div key={rating._id} className="p-4 border rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={rating.learner.avatar} />
                                                <AvatarFallback>{getInitials(rating.learner.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">{rating.learner.name}</p>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{rating.review}</p>
                                    </div>
                                ))}
                                {ratings.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
