import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';
import {
    Loader2, MapPin, Clock, CheckCircle, AlertTriangle,
    Activity, Moon, Utensils, Smile, Calendar, Phone
} from 'lucide-react';
import ParentUserGuide from '@/components/ParentUserGuide';

interface TrackingStatus {
    status: 'in_transit' | 'arrived' | 'overdue' | 'no_record';
    departure_time?: string;
    estimated_arrival_time?: string;
    actual_arrival_time?: string;
    log_id?: number;
}

const ParentDashboard: React.FC = () => {
    const { caregiver, logout } = useApp();
    const [status, setStatus] = useState<TrackingStatus | null>(null);
    const [childInfo, setChildInfo] = useState<any>(null);
    const [riskData, setRiskData] = useState<any>(null);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Ensure we have a parent logged in
    const childId = caregiver?.pwid_id;

    useEffect(() => {
        if (childId) {
            setLoading(true);
            Promise.all([
                api.get(`/pwids/${childId}`),
                api.get(`/risk/${childId}`),
                api.get(`/logs/${childId}`),
                api.get(`/api/track/status/${childId}`)
            ]).then(([pwidRes, riskRes, logsRes, statusRes]) => {
                setChildInfo(pwidRes.data);
                setRiskData(riskRes.data);
                setRecentLogs(logsRes.data.slice(0, 5)); // Top 5 recent
                setStatus(statusRes.data);
            }).catch(err => {
                console.error("Dashboard fetch error:", err);
                toast({ title: "Error loading data", description: "Could not fetch updated child information." });
            }).finally(() => setLoading(false));
        }
    }, [childId]);

    // Polling for tracking status
    useEffect(() => {
        if (!childId) return;
        const interval = setInterval(() => {
            api.get(`/api/track/status/${childId}`)
                .then(res => setStatus(res.data))
                .catch(console.error);
        }, 30000);
        return () => clearInterval(interval);
    }, [childId]);

    const confirmArrival = async () => {
        if (!status?.log_id) return;
        try {
            await api.post('/api/track/confirm', { log_id: status.log_id });
            toast({ title: 'Arrival Confirmed', description: 'Thank you for confirming safe arrival.' });
            // Refresh status immediately
            const res = await api.get(`/api/track/status/${childId}`);
            setStatus(res.data);
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to confirm arrival', variant: 'destructive' });
        }
    };

    if (!caregiver || caregiver.role !== 'Parent') {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Access Denied. Please log in as a parent.</p>
                <Button variant="link" onClick={logout}>Go to Login</Button>
            </div>
        );
    }

    if (loading && !childInfo) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="parent-welcome">
                    <div>
                        <ParentUserGuide />
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Parent Dashboard</h1>
                        <p className="text-slate-500">Monitoring <span className="font-semibold text-primary">{childInfo?.full_name}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Phone className="w-4 h-4" /> Contact NGO
                        </Button>
                        <Button variant="ghost" onClick={logout} className="text-red-500 hover:text-red-600 hover:bg-red-50">Log out</Button>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column: Stats & Status */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Child Profile Card */}
                        <Card className="border-slate-100 shadow-sm overflow-hidden" id="child-profile">
                            <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-400" />
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-semibold">{childInfo?.full_name}</h3>
                                        <p className="text-sm text-slate-500">{childInfo?.age} years • {childInfo?.age_group}</p>
                                    </div>
                                    <Badge variant={(childInfo?.status || 'stable') === 'stable' ? 'secondary' : 'destructive'}
                                        className="uppercase tracking-wider text-[10px]">
                                        {childInfo?.status || 'Stable'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <span className="text-xs font-medium text-slate-500 uppercase">Diagnosis</span>
                                        <p className="font-medium text-slate-800">{childInfo?.primary_diagnosis || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <span className="text-xs font-medium text-slate-500 uppercase">Support Level</span>
                                        <p className="font-medium text-slate-800 capitalize">{childInfo?.support_level}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <span className="text-xs font-medium text-slate-500 uppercase">NGO</span>
                                        <p className="font-medium text-slate-800">{childInfo?.ngo_name}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity / Logs */}
                        <Card className="border-slate-100 shadow-sm" id="recent-logs">
                            <CardHeader className="pb-3 border-b border-slate-50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Recent Daily Logs
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[300px]">
                                    {recentLogs.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400">No logs available yet.</div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {recentLogs.map((log) => (
                                                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <div className={`w-2 h-2 rounded-full ${log.incident === 'yes' ? 'bg-red-500' : 'bg-green-500'}`} />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-medium text-sm text-slate-900">
                                                                {new Date(log.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </p>
                                                            <span className="text-xs text-slate-400">
                                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-3 text-sm text-slate-600">
                                                            <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> {log.sleep_quality}</span>
                                                            <span className="flex items-center gap-1"><Utensils className="w-3 h-3" /> {log.meals}</span>
                                                            <span className="flex items-center gap-1"><Smile className="w-3 h-3" /> {log.mood}</span>
                                                        </div>
                                                        {log.notes && (
                                                            <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded italic">"{log.notes}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tracking & Risk */}
                    <div className="space-y-6">
                        {/* Risk Assessment */}
                        <Card className="border-slate-100 shadow-sm overflow-hidden" id="risk-assessment">
                            <CardHeader className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="text-base font-medium flex items-center justify-between">
                                    Risk Assessment
                                    {riskData?.level === 'High' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 text-center">
                                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4
                                    ${riskData?.level === 'Low' ? 'border-green-100 bg-green-50 text-green-600' :
                                        riskData?.level === 'Medium' ? 'border-yellow-100 bg-yellow-50 text-yellow-600' :
                                            'border-red-100 bg-red-50 text-red-600'}`}>
                                    <span className="text-xl font-bold">{riskData?.level || 'N/A'}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-800 mb-1">
                                    {riskData?.reason || 'Analysis pending...'}
                                </p>
                                <p className="text-xs text-slate-500 mb-6">
                                    Based on recent sleep, mood, and behavioural patterns.
                                </p>
                                <div className="space-y-3 text-left bg-slate-50 p-4 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Sleep Pattern</span>
                                        <span className="font-medium">{riskData?.factors?.sleep || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Mood Stability</span>
                                        <span className="font-medium">{riskData?.factors?.mood || 'N/A'}</span>
                                    </div>
                                </div>

                                {riskData?.details && riskData.details.length > 0 && (
                                    <div className="mt-4 text-left border-t border-slate-100 pt-4">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Observations</h4>
                                        <ul className="space-y-1">
                                            {riskData.details.map((detail: string, i: number) => (
                                                <li key={i} className="text-xs text-slate-600 flex gap-2">
                                                    <span className="text-red-400">•</span> {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Travel Status */}
                        <Card className="border-slate-100 shadow-sm" id="travel-status">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">Travel Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!status || status.status === 'no_record' ? (
                                    <div className="text-center py-6 text-slate-400">
                                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No active travel.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className={`p-4 rounded-xl flex items-center gap-4 
                                            ${status.status === 'in_transit' ? 'bg-blue-50 text-blue-700' :
                                                status.status === 'arrived' ? 'bg-green-50 text-green-700' :
                                                    'bg-red-50 text-red-700'}`}>
                                            {status.status === 'in_transit' && <Loader2 className="animate-spin w-5 h-5" />}
                                            {status.status === 'arrived' && <CheckCircle className="w-5 h-5" />}
                                            {status.status === 'overdue' && <AlertTriangle className="w-5 h-5" />}
                                            <div>
                                                <p className="font-bold text-sm uppercase tracking-wide">{status.status.replace('_', ' ')}</p>
                                                {status.estimated_arrival_time && status.status === 'in_transit' && (
                                                    <p className="text-xs opacity-90">ETA: {new Date(status.estimated_arrival_time).toLocaleTimeString()}</p>
                                                )}
                                                {status.actual_arrival_time && status.status === 'arrived' && (
                                                    <p className="text-xs opacity-90">At {new Date(status.actual_arrival_time).toLocaleTimeString()}</p>
                                                )}
                                            </div>
                                        </div>

                                        {(status.status === 'in_transit' || status.status === 'overdue') && (
                                            <Button className="w-full" variant={status.status === 'overdue' ? 'destructive' : 'default'} onClick={confirmArrival}>
                                                Confirm Safe Arrival
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
