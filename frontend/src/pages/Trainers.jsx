import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trainerAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Search, Star, DollarSign, Users, TrendingUp } from 'lucide-react';
import { getInitials } from '../lib/utils';

export default function Trainers() {
    const [trainers, setTrainers] = useState([]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ minRating: '', maxPrice: '', sort: '' });

    useEffect(() => {
        loadTrainers();
    }, [search, filters]);

    const loadTrainers = async () => {
        try {
            const response = await trainerAPI.getTrainers({ search, ...filters });
            setTrainers(response.data);
        } catch (error) {
            console.error('Failed to load trainers:', error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Find Expert Trainers</h1>
                <p className="text-muted-foreground">Connect with experienced professionals to accelerate your learning</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Sort By</label>
                                <select
                                    className="w-full h-10 rounded-md border px-3"
                                    value={filters.sort}
                                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                                >
                                    <option value="">Default</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="students">Most Students</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Min Rating</label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.5"
                                    placeholder="e.g., 4.0"
                                    value={filters.minRating}
                                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Max Price ($/hr)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 100"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setFilters({ minRating: '', maxPrice: '', sort: '' })}
                            >
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search trainers by name, domain..."
                            className="pl-10 h-12 text-lg"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {trainers.map((trainer) => (
                            <Card key={trainer._id} className="hover:shadow-xl transition-all">
                                <CardHeader>
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src={trainer.avatar} />
                                            <AvatarFallback className="text-lg">{getInitials(trainer.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl mb-1">{trainer.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{trainer.bio}</CardDescription>
                                            <div className="flex items-center gap-4 mt-3 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-semibold">{trainer.averageRating.toFixed(1)}</span>
                                                    <span className="text-muted-foreground">({trainer.totalRatings})</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span>{trainer.trainerProfile?.totalStudents || 0} students</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {trainer.trainerProfile?.domain?.slice(0, 3).map((domain, idx) => (
                                                <Badge key={idx} variant="outline">{domain}</Badge>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-1 text-lg font-semibold">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                                <span>{trainer.trainerProfile?.pricing?.hourlyRate || 0}/hr</span>
                                            </div>
                                            <Link to={`/trainers/${trainer._id}`}>
                                                <Button>View Profile</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {trainers.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-16">
                                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-2xl font-semibold mb-2">No trainers found</h3>
                                <p className="text-muted-foreground">Try adjusting your search or filters</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
