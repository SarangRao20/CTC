import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Skull, Moon, Utensils, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';

const PatientDashboard = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [risk, setRisk] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientRes, logsRes, riskRes] = await Promise.all([
                    api.get(`/pwids/${id}`),
                    api.get(`/logs/${id}`),
                    api.get(`/risk/${id}`)
                ]);
                setPatient(patientRes.data);
                setLogs(logsRes.data);
                setRisk(riskRes.data);
            } catch (error) {
                console.error("Failed to fetch patient data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
        </div>;
    }

    if (!patient) return <div className="p-8">Patient not found</div>;

    // Process data for charts
    const moodMap: any = { "Calm": 5, "Happy": 4, "Anxious": 3, "Irritable": 2, "Aggressive": 1, "Unknown": 3 };
    const sleepMap: any = { "Good": 3, "Disturbed": 2, "Poor": 1, "Unknown": 2 };
    const mealMap: any = { "Normal": 3, "Reduced": 2, "Skipped": 1, "Unknown": 2 };

    const chartData = logs.map(log => ({
        date: format(new Date(log.created_at), 'MMM dd'),
        moodScore: moodMap[log.mood] || 3,
        sleepScore: sleepMap[log.sleep_quality] || 2,
        mealScore: mealMap[log.meals] || 2,
        mood: log.mood,
        sleep: log.sleep_quality,
        meals: log.meals,
        incident: log.incident
    })).slice(-14); // Last 14 entries for clearer charts

    // Risk Color
    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'bg-urgent text-urgent-foreground';
            case 'medium': return 'bg-warning text-warning-foreground';
            default: return 'bg-success text-success-foreground';
        }
    };

    const incidentCount = logs.filter(l => l.incident !== 'None' && l.incident !== 'no').length;

    const pieData = [
        { name: 'Happy/Calm', value: logs.filter(l => ['Happy', 'Calm'].includes(l.mood)).length, color: '#10b981' }, // success
        { name: 'Anxious', value: logs.filter(l => l.mood === 'Anxious').length, color: '#f59e0b' }, // warning
        { name: 'Aggressive/Irr', value: logs.filter(l => ['Aggressive', 'Irritable'].includes(l.mood)).length, color: '#ef4444' }, // urgent
    ].filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-background p-6 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{patient.full_name}</h1>
                    <p className="text-muted-foreground">Room {patient.roomNumber} • Age {patient.age} • {patient.supportLevel}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <Badge className={`text-lg px-4 py-1.5 rounded-full ${getRiskColor(risk?.risk_level)}`}>
                        {risk?.risk_level} Risk Level
                    </Badge>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recorded Incidents</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-urgent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{incidentCount}</div>
                        <p className="text-xs text-muted-foreground">Total recorded in history</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trend Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{risk?.risk_score}</div>
                        <p className="text-xs text-muted-foreground">Avg risk score (Lower is better)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Check</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{logs.length > 0 ? format(new Date(logs[logs.length - 1].created_at), 'HH:mm') : '--'}</div>
                        <p className="text-xs text-muted-foreground">
                            {logs.length > 0 ? format(new Date(logs[logs.length - 1].created_at), 'MMM dd, yyyy') : 'No logs'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                        <Activity className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98%</div>
                        <p className="text-xs text-muted-foreground">Medication & Routine</p>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Reason Alert */}
            {risk?.reason && (
                <div className={`p-4 border-l-4 rounded-r-lg shadow-sm ${risk.risk_level === 'High' ? 'bg-urgent/10 border-urgent' : risk.risk_level === 'Medium' ? 'bg-warning/10 border-warning' : 'bg-success/10 border-success'}`}>
                    <h3 className="font-semibold mb-1">Risk Analysis</h3>
                    <p>{risk.reason}</p>
                    {risk.details && risk.details.length > 0 && (
                        <ul className="mt-2 text-sm list-disc list-inside opacity-80">
                            {risk.details.map((d: string, i: number) => <li key={i}>{d}</li>)}
                        </ul>
                    )}
                </div>
            )}

            {/* Charts Section */}
            <Tabs defaultValue="trends" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                    <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
                    <TabsTrigger value="mood">Mood Distribution</TabsTrigger>
                    <TabsTrigger value="logs">Recent Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-4 mt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Mood & Sleep Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Mood & Sleep Trends</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 5]} hide />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            labelStyle={{ color: '#666' }}
                                        />
                                        <Area type="monotone" dataKey="moodScore" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMood)" name="Mood Score" />
                                        <Area type="monotone" dataKey="sleepScore" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSleep)" name="Sleep Quality" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Meals Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Appetite & Routine</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 4]} hide />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="step" dataKey="mealScore" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Appetite Level" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="mood" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Overall Mood Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px] flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Observations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {logs.slice().reverse().slice(0, 10).map((log) => (
                                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
                                        <div className={`p-2 rounded-lg ${log.incident !== 'None' && log.incident !== 'no' ? 'bg-urgent/10 text-urgent' : 'bg-background text-primary'}`}>
                                            {log.incident !== 'None' && log.incident !== 'no' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-sm">{log.mood} Mood</h4>
                                                <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="outline" className="text-[10px]">Sleep: {log.sleep_quality}</Badge>
                                                <Badge variant="outline" className="text-[10px]">Meals: {log.meals}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PatientDashboard;
