import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
    Home, Users, GraduationCap, Calendar,
    User, LogOut, BookOpen, Trophy
} from 'lucide-react';
import { getInitials } from '../lib/utils';

export default function Navbar() {
    const { user, logout } = useAuth();

    const navItems = [
        { to: '/dashboard', icon: Home, label: 'Dashboard' },
        { to: '/hubs', icon: Users, label: 'Learner Hubs' },
        { to: '/trainers', icon: GraduationCap, label: 'Find Trainers' },
        { to: '/sessions', icon: Calendar, label: 'My Sessions' },
    ];

    return (
        <nav className="border-b bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/dashboard" className="flex items-center space-x-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            PeerLearn
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link key={item.to} to={item.to}>
                                <Button variant="ghost" className="flex items-center gap-2">
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">{user?.points || 0} pts</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link to="/profile">
                                <Avatar className="cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getInitials(user?.name || 'User')}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>

                            <Button variant="ghost" size="icon" onClick={logout}>
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
