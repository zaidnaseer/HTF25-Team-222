import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
    Users, GraduationCap, Trophy, Calendar,
    MessageSquare, BookOpen, Sparkles, ArrowRight
} from 'lucide-react';

export default function Landing() {
    const features = [
        {
            icon: Users,
            title: 'Learner Hubs',
            description: 'Join or create learning communities with gamification, contests, and collaborative roadmaps.'
        },
        {
            icon: GraduationCap,
            title: 'Expert Trainers',
            description: 'Find and book sessions with experienced trainers across various domains and skills.'
        },
        {
            icon: Trophy,
            title: 'Gamification',
            description: 'Earn points, badges, and climb leaderboards while learning and contributing.'
        },
        {
            icon: Calendar,
            title: 'Flexible Scheduling',
            description: 'Book 1-on-1 or group sessions with integrated video calls and calendar management.'
        },
        {
            icon: MessageSquare,
            title: 'Real-time Chat',
            description: 'Collaborate with peers through instant messaging and resource sharing.'
        },
        {
            icon: BookOpen,
            title: 'Custom Roadmaps',
            description: 'Follow pre-built learning paths or create your own personalized roadmap.'
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-50 to-pink-50 dark:from-primary/20 dark:via-purple-950 dark:to-pink-950">
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Welcome to the Future of Learning</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Learn Together, Grow Together
                        </h1>

                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Connect with peers, find expert trainers, and accelerate your learning journey
                            through collaborative hubs, gamified challenges, and structured roadmaps.
                        </p>

                        <div className="flex gap-4 justify-center">
                            <Link to="/register">
                                <Button size="lg" className="text-lg px-8">
                                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="text-lg px-8">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-4 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Everything You Need to Excel</h2>
                    <p className="text-xl text-muted-foreground">
                        Powerful features designed to make learning collaborative, engaging, and effective
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Card key={index} className="group hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-primary/50">
                            <CardContent className="p-6">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-primary text-primary-foreground py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-5xl font-bold mb-2">10k+</div>
                            <div className="text-lg opacity-90">Active Learners</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2">500+</div>
                            <div className="text-lg opacity-90">Expert Trainers</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2">50k+</div>
                            <div className="text-lg opacity-90">Sessions Completed</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="container mx-auto px-4 py-24">
                <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-2 border-primary/20">
                    <CardContent className="p-12 text-center">
                        <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Join thousands of learners and trainers building skills together
                        </p>
                        <Link to="/register">
                            <Button size="lg" className="text-lg px-8">
                                Create Free Account
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
