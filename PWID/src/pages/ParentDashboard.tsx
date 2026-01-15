import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';
import { Loader2, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

// Types
interface Guardian {
    id: number;
    name: string;
    email: string;
    pwid_id: number;
}

interface TrackingStatus {
    status: 'in_transit' | 'arrived' | 'overdue' | 'no_record';
    departure_time?: string;
    estimated_arrival_time?: string;
    actual_arrival_time?: string;
    log_id?: number;
}

const ParentDashboard: React.FC = () => {
    const [guardian, setGuardian] = useState<Guardian | null>(null);
    const [status, setStatus] = useState<TrackingStatus | null>(null);
    const [loading, setLoading] = useState(false);

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Poll for status updates if logged in
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (guardian) {
            fetchStatus();
            interval = setInterval(fetchStatus, 30000); // Poll every 30s
        }
        return () => clearInterval(interval);
    }, [guardian]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/guardian/login', { email, password });
            setGuardian(res.data.guardian);
            toast({ title: 'Welcome back', description: `Logged in as ${res.data.guardian.name}` });
        } catch (err: any) {
            toast({
                title: 'Login failed',
                description: err.response?.data?.error || 'Invalid credentials',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatus = async () => {
        if (!guardian) return;
        try {
            const res = await api.get(`/api/track/status/${guardian.pwid_id}`);
            setStatus(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const confirmArrival = async () => {
        if (!status?.log_id) return;
        try {
            await api.post('/api/track/confirm', { log_id: status.log_id });
            toast({ title: 'Arrival Confirmed', description: 'Thank you for confirming safe arrival.' });
            fetchStatus();
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to confirm arrival', variant: 'destructive' });
        }
    };

    if (!guardian) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Parent Portal Login</CardTitle>
                        <CardDescription>Enter your credentials to track arrival status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Login
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
                        <p className="text-gray-500">Welcome, {guardian.name}</p>
                    </div>
                    <Button variant="outline" onClick={() => setGuardian(null)}>Logout</Button>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Current Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!status || status.status === 'no_record' ? (
                            <div className="text-center py-10 text-gray-500">
                                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No travel activity recorded for today yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <span className="text-sm text-gray-500">Departure Time</span>
                                        <p className="text-lg font-semibold">
                                            {new Date(status.departure_time!).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <span className="text-sm text-gray-500">Estimated Arrival</span>
                                        <p className="text-lg font-semibold text-primary">
                                            {new Date(status.estimated_arrival_time!).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                    {status.status === 'in_transit' && (
                                        <>
                                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                                                <Clock className="w-8 h-8" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-blue-700">In Transit</h2>
                                            <p className="text-center text-gray-600 max-w-sm">
                                                Your child is on their way. Please confirm arrival once they reach home.
                                            </p>
                                            <Button size="lg" className="w-full max-w-sm mt-4 text-lg h-12" onClick={confirmArrival}>
                                                <CheckCircle className="mr-2" /> Confirm Safe Arrival
                                            </Button>
                                        </>
                                    )}

                                    {status.status === 'arrived' && (
                                        <>
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-8 h-8" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-green-700">Arrived Safely</h2>
                                            <p className="text-gray-500">
                                                Arrival confirmed at {new Date(status.actual_arrival_time!).toLocaleTimeString()}
                                            </p>
                                        </>
                                    )}

                                    {status.status === 'overdue' && (
                                        <>
                                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-bounce">
                                                <AlertTriangle className="w-8 h-8" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-red-700">Delay Alert</h2>
                                            <p className="text-center text-red-600 max-w-sm">
                                                Patient has not arrived within the estimated time. Caregivers have been notified.
                                            </p>
                                            <Button size="lg" className="w-full max-w-sm mt-4 text-lg h-12 bg-green-600 hover:bg-green-700" onClick={confirmArrival}>
                                                <CheckCircle className="mr-2" /> Confirm Safe Arrival
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ParentDashboard;
