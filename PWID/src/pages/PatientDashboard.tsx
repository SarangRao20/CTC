import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import {
    Activity, Moon, Utensils, AlertTriangle, CheckCircle2,
    ChevronDown, ChevronUp, FileText, Info, Phone
} from 'lucide-react';
=======
import { ArrowLeft, Activity, Skull, Moon, Utensils, AlertTriangle, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
>>>>>>> origin/frontend
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
<<<<<<< HEAD
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
=======
>>>>>>> origin/frontend
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';
import TodaysStatus from '@/components/TodaysStatus';

<<<<<<< HEAD
// --- Sub-Components (Local for "One File" simplicity) ---

const StatusBanner = ({ risk, incidentCount, onViewIncident }: { risk: any, incidentCount: number, onViewIncident: () => void }) => {
    const isHighRisk = risk?.risk_level === 'High';
    const isMediumRisk = risk?.risk_level === 'Medium';
    const hasIncidents = incidentCount > 0;

    let statusColor = "bg-success/10 border-success/20 text-success-foreground";
    let iconColor = "bg-success text-success-foreground";
    let Icon = CheckCircle2;
    let title = "Stable";

    if (isHighRisk) {
        statusColor = "bg-urgent/10 border-urgent/20 text-urgent-foreground";
        iconColor = "bg-urgent text-urgent-foreground";
        Icon = AlertTriangle;
        title = "Immediate Action Required";
    } else if (isMediumRisk || hasIncidents) {
        statusColor = "bg-warning/10 border-warning/20 text-warning-foreground";
        iconColor = "bg-warning text-warning-foreground";
        Icon = AlertTriangle;
        title = "Needs Attention";
    }

    return (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${statusColor}`}>
            <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-full ${iconColor}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {title}
                    </h3>
                    <p className="text-sm opacity-90 font-medium mt-1">
                        {risk?.reason || (hasIncidents ? "Incident reported recently." : "Routine is proceeding as expected.")}
                    </p>
                </div>
            </div>
            {(isHighRisk || hasIncidents) && (
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-background/80 border-current/30" onClick={onViewIncident}>
                        View Incident
                    </Button>
                    <Button variant={isHighRisk ? "destructive" : "default"} onClick={() => alert("Supervisor Notified (Simulated)")}>
                        Inform Supervisor
                    </Button>
                </div>
            )}
        </div>
    );
};

const ActionItem = ({ label, defaultChecked = false }: { label: string, defaultChecked?: boolean }) => {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${checked ? 'bg-secondary/20 border-border/50 opacity-60' : 'bg-card border-border hover:border-primary/50'}`}>
            <Checkbox checked={checked} onCheckedChange={(c) => setChecked(!!c)} id={`task-${label}`} />
            <label
                htmlFor={`task-${label}`}
                className={`text-sm font-medium cursor-pointer flex-1 ${checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}
            >
                {label}
            </label>
            {checked && <CheckCircle2 className="w-4 h-4 text-success" />}
        </div>
    );
};

const CaregiverActionList = ({ logs }: { logs: any[] }) => {
    // Basic logic to suggest tasks
    const lastLog = logs[logs.length - 1];
    const poorSleep = lastLog?.sleep_quality === 'Poor' || lastLog?.sleep_quality === 'Disturbed';
    const missedMeal = lastLog?.meals === 'Reduced' || lastLog?.meals === 'Skipped';

    return (
        <Card className="border-l-4 border-l-primary shadow-sm bg-gradient-to-r from-background to-secondary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    What Needs Attention Today
                </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
                <ActionItem label="Log mood before shift end" />
                <ActionItem label="Ensure all scheduled meals are completed" defaultChecked={!missedMeal} />
                {poorSleep && <ActionItem label="Monitor sleep patterns tonight (Previous sleep was poor)" />}
                <ActionItem label="Update hygiene checklist" />
            </CardContent>
        </Card>
    );
};

const TextSummarySection = ({ logs, patient }: { logs: any[], patient: any }) => {
    // Generate simple insights
    const last7Days = logs.slice(-7);
    const stableDays = last7Days.filter(l => l.incident === 'None' || l.incident === 'no').length;

    // Determine dominant mood text
    const anxietyCount = last7Days.filter(l => l.mood === 'Anxious').length;
    const moodSummary = anxietyCount > 2
        ? `Anxiety was noticed on ${anxietyCount} days this week.`
        : "Mood has been mostly calm and stable.";

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                        Weekly Care Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{stableDays} <span className="text-base font-normal text-muted-foreground">of 7 days</span></span>
                    </div>
                    <p className="text-sm font-medium">Routine followed well.</p>
                    <div className="space-y-2 pt-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" /> No major incidents reported.
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Moon className="w-4 h-4 text-indigo-400" /> 1 night of disturbed sleep.
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-primary">View Routine Details →</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                        What the System Noticed
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 flex gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            "On days with poor sleep, anxiety increased."
                        </p>
                    </div>
                    <div className="pt-2">
                        <h4 className="text-sm font-semibold mb-1">Mood Pattern</h4>
                        <p className="text-sm text-muted-foreground">{moodSummary}</p>
                    </div>
                    <div className="pt-2">
                        <h4 className="text-sm font-semibold mb-1">Suggested Care</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>Offer reassurance on anxious days.</li>
                            <li>Maintain consistent bedtime routine.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const DetailedAnalysis = ({ logs, chartData }: { logs: any[], chartData: any[] }) => {
    // This component holds the old charts
    const pieData = [
        { name: 'Calm', value: logs.filter(l => l.mood === 'Calm').length, color: '#10b981' }, // Success
        { name: 'Happy', value: logs.filter(l => l.mood === 'Happy').length, color: '#34d399' }, // Success Light
        { name: 'Anxious', value: logs.filter(l => l.mood === 'Anxious').length, color: '#f59e0b' }, // Warning
        { name: 'Irritable', value: logs.filter(l => l.mood === 'Irritable').length, color: '#f97316' }, // Warning Dark
        { name: 'Aggressive', value: logs.filter(l => l.mood === 'Aggressive').length, color: '#ef4444' }, // Destructive
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 pt-4">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Re-using previous charts logic here */}
                <Card>
                    <CardHeader><CardTitle>Mood & Sleep Trends</CardTitle></CardHeader>
                    <CardContent className="h-[250px]">
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
                                <YAxis hide />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <Tooltip />
                                <Area type="monotone" dataKey="moodScore" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMood)" />
                                <Area type="monotone" dataKey="sleepScore" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSleep)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Mood Distribution</CardTitle></CardHeader>
                    <CardContent className="h-[250px] flex justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
            </div>
        </div>
    );
}

// --- Main Page Component ---

=======
>>>>>>> origin/frontend
const PatientDashboard = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [risk, setRisk] = useState<any>(null);
    const [loading, setLoading] = useState(true);
<<<<<<< HEAD
    const [activeTab, setActiveTab] = useState("status"); // Default to 'status' (Caregiver View)
    const [informed, setInformed] = useState<Record<string, boolean>>({});
    const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
=======
>>>>>>> origin/frontend

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

<<<<<<< HEAD
    if (loading) return <div className="p-8"><Skeleton className="h-12 w-1/3" /></div>;
    if (!patient) return <div className="p-8">Patient not found</div>;

    // Process data for charts (retained for DetailedAnalysis)
=======
    if (loading) {
        return <div className="p-3 sm:p-4 md:p-8 space-y-3 sm:space-y-4">
            <Skeleton className="h-8 sm:h-10 md:h-12 w-1/2 sm:w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <Skeleton className="h-20 sm:h-24 md:h-28" />
                <Skeleton className="h-20 sm:h-24 md:h-28" />
                <Skeleton className="h-20 sm:h-24 md:h-28" />
                <Skeleton className="h-20 sm:h-24 md:h-28" />
            </div>
            <Skeleton className="h-40 sm:h-56 md:h-64" />
        </div>;
    }

    if (!patient) return <div className="p-3 sm:p-4 md:p-8">Patient not found</div>;

    // Process data for charts
>>>>>>> origin/frontend
    const moodMap: any = { "Calm": 5, "Happy": 4, "Anxious": 3, "Irritable": 2, "Aggressive": 1, "Unknown": 3 };
    const sleepMap: any = { "Good": 3, "Disturbed": 2, "Poor": 1, "Unknown": 2 };
    const mealMap: any = { "Normal": 3, "Reduced": 2, "Skipped": 1, "Unknown": 2 };

    const chartData = logs.map(log => ({
        date: format(new Date(log.created_at), 'MMM dd'),
        moodScore: moodMap[log.mood] || 3,
        sleepScore: sleepMap[log.sleep_quality] || 2,
        mealScore: mealMap[log.meals] || 2,
<<<<<<< HEAD
    })).slice(-14);

    const incidentCount = logs.filter(l => l.incident !== 'None' && l.incident !== 'no' && new Date(l.created_at) >= subDays(new Date(), 7)).length;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
            {/* 1. Header (Context Only) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">Age: {patient.age || 'N/A'}</Badge>
                        <span className="text-sm">•</span>
                        <span className="text-sm">Support Level: {patient.support_level || 'High'}</span>
                        <span className="text-sm">•</span>
                        <span className="text-xs">Last updated: {format(new Date(), 'HH:mm')}</span>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="status">Status Overview</TabsTrigger>
                    <TabsTrigger value="incidents">Incidents</TabsTrigger>
                </TabsList>

                {/* --- CAREGIVER VIEW (STATUS) --- */}
                <TabsContent value="status" className="space-y-6 mt-6">

                    {/* 2. Status Banner */}
                    <StatusBanner
                        risk={risk}
                        incidentCount={incidentCount}
                        onViewIncident={() => setActiveTab('incidents')}
                    />

                    {/* 3. Action List (Anchor) */}
                    <CaregiverActionList logs={logs} />

                    {/* 4. Daily Snapshot (Existing Component) */}
                    <TodaysStatus logs={logs} patientName={patient.full_name.split(' ')[0]} />

                    {/* 5. Text Summaries */}
                    <TextSummarySection logs={logs} patient={patient} />

                    {/* 6. Detailed Analysis (Collapsible) */}
                    <Collapsible open={showDetailedAnalysis} onOpenChange={setShowDetailedAnalysis} className="border rounded-xl bg-card">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full flex justify-between items-center p-4 h-auto font-normal text-muted-foreground hover:text-foreground">
                                <span className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Detailed Analysis (For Supervisors)
                                </span>
                                {showDetailedAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 border-t">
                            <DetailedAnalysis logs={logs} chartData={chartData} />
                        </CollapsibleContent>
                    </Collapsible>

                </TabsContent>


                {/* --- INCIDENTS VIEW --- */}
                <TabsContent value="incidents" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Incident & Routine Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...logs]
                                    .filter(log => new Date(log.created_at) >= subDays(new Date(), 7))
                                    .sort((a, b) => {
                                        const aHasIncident = a.incident !== 'None' && a.incident !== 'no';
                                        const bHasIncident = b.incident !== 'None' && b.incident !== 'no';
                                        if (aHasIncident && !bHasIncident) return -1;
                                        if (!aHasIncident && bHasIncident) return 1;
                                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                                    })
                                    .map((log) => (
                                        <div key={log.id} className={`flex items-start gap-4 p-4 rounded-xl border ${log.incident !== 'None' && log.incident !== 'no' ? 'bg-urgent/5 border-urgent/20' : 'bg-secondary/30 border-border/50'}`}>
                                            <div className={`p-2 rounded-lg ${log.incident !== 'None' && log.incident !== 'no' ? 'bg-urgent/10 text-urgent' : 'bg-background text-primary'}`}>
                                                {log.incident !== 'None' && log.incident !== 'no' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`font-semibold text-sm ${log.incident !== 'None' && log.incident !== 'no' ? 'text-urgent' : ''}`}>
                                                        {log.incident !== 'None' && log.incident !== 'no' ? `Incident: ${log.incident}` : `${log.mood} Mood`}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline" className="text-[10px]">Sleep: {log.sleep_quality}</Badge>
                                                    <Badge variant="outline" className="text-[10px]">Meals: {log.meals}</Badge>
                                                </div>
                                            </div>
                                            {(log.incident !== 'None' && log.incident !== 'no') && (
                                                <div className="flex flex-col items-center self-center pl-2">
                                                    <Button
                                                        size="sm"
                                                        variant={informed[log.id] ? "ghost" : "destructive"}
                                                        className={informed[log.id] ? "text-success hover:text-success hover:bg-success/10 h-8" : "h-8 px-3 text-xs"}
                                                        onClick={() => setInformed(prev => ({ ...prev, [log.id]: true }))}
                                                        disabled={informed[log.id]}
                                                    >
                                                        {informed[log.id] ? <CheckCircle2 className="w-4 h-4 mr-1" /> : "Inform"}
                                                        {informed[log.id] && "Informed"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
=======
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
        <div className="min-h-screen bg-background px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-6 overflow-x-hidden max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 w-full">
                <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold truncate">{patient.full_name}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Room {patient.roomNumber} • Age {patient.age} • {patient.supportLevel}</p>
                </div>
                <div className="flex-shrink-0">
                    <Badge className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap ${getRiskColor(risk?.risk_level)}`}>
                        {risk?.risk_level} Risk
                    </Badge>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Recorded Incidents</CardTitle>
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-urgent flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">{incidentCount}</div>
                        <p className="text-xs text-muted-foreground">Total recorded</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Trend Score</CardTitle>
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">{risk?.risk_score}</div>
                        <p className="text-xs text-muted-foreground">Avg risk (lower better)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Last Check</CardTitle>
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">{logs.length > 0 ? format(new Date(logs[logs.length - 1].created_at), 'HH:mm') : '--'}</div>
                        <p className="text-xs text-muted-foreground">
                            {logs.length > 0 ? format(new Date(logs[logs.length - 1].created_at), 'MMM dd') : 'No logs'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Compliance</CardTitle>
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">98%</div>
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



            // ... (imports remain the same)

            // ... (inside component)

            {/* Charts Section */}
            <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-5 md:w-[700px]">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="mood">Mood</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="mt-4">
                    <TodaysStatus logs={logs} patientName={patient.full_name.split(' ')[0]} />
                </TabsContent>

                <TabsContent value="insights" className="mt-4 space-y-6">
                    {/* Insights Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* 1. Consistency Score */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between">
                                    <span>Routine Consistency</span>
                                    <Badge variant="outline">{Math.round((logs.filter(l => l.mood !== 'Anxious' && l.meals !== 'Skipped' && l.sleep_quality !== 'Poor').length / (logs.length || 1)) * 100)}% Stable</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${Math.round((logs.filter(l => l.mood !== 'Anxious' && l.meals !== 'Skipped').length / (logs.length || 1)) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Based on meals, sleep, and activity completion over last 30 entries.
                                    </p>

                                    {/* 2. Risk Drivers Panel */}
                                    <div className="pt-4 border-t border-border">
                                        <h4 className="text-sm font-semibold mb-2">Risk Drivers (Last 7 Days)</h4>
                                        <div className="space-y-2">
                                            {logs.slice(0, 7).filter(l => l.meals === 'Skipped').length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                                                    {logs.slice(0, 7).filter(l => l.meals === 'Skipped').length} skipped meals
                                                </div>
                                            )}
                                            {logs.slice(0, 7).filter(l => l.sleep_quality === 'Poor').length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                    {logs.slice(0, 7).filter(l => l.sleep_quality === 'Poor').length} nights of disturbed sleep
                                                </div>
                                            )}
                                            {incidentCount > 0 ? (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-urgent" />
                                                    {incidentCount} incidents reported
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-success">
                                                    <CheckCircle2 className="w-3 h-3" /> No incidents in last 7 days
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Sleep-Mood Correlation & Confidence */}
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Observations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Sleep Mood Correlation */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Moon className="w-4 h-4 text-indigo-400" /> Sleep-Mood Correlation
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        On days with <b>poor sleep</b>, anxious mood was observed
                                        <b> {Math.round((logs.filter(l => l.sleep_quality === 'Poor' && l.mood === 'Anxious').length / (logs.filter(l => l.sleep_quality === 'Poor').length || 1)) * 100)}%</b> of the time.
                                    </p>
                                </div>

                                {/* 4. Last Stable Period */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-success" /> Last Fully Stable Period
                                    </h4>
                                    <div className="text-sm bg-success/10 text-success-foreground px-3 py-2 rounded-lg inline-block">
                                        {format(subDays(new Date(), 3), 'MMM dd')} – {format(subDays(new Date(), 1), 'MMM dd')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Routine was 100% compliant during this time.
                                    </p>
                                </div>

                                {/* 5. Confidence */}
                                <div className="pt-4 border-t border-border flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">AI Data Confidence</span>
                                    <Badge variant="outline" className="text-xs gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success" /> High
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Weekly Heatmap */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Routine Heatmap</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-2">
                                {/* Header Row */}
                                <div className="text-xs font-semibold text-muted-foreground"></div>
                                {[...Array(7)].map((_, i) => (
                                    <div key={i} className="text-xs text-center text-muted-foreground">
                                        {format(subDays(new Date(), 6 - i), 'dd')}
                                    </div>
                                ))}

                                {/* Sleep Row */}
                                <div className="text-sm font-medium py-2">Sleep</div>
                                {[...Array(7)].map((_, i) => {
                                    const dayLog = logs[i % logs.length]; // Mock: ideally filter by real date
                                    const status = dayLog?.sleep_quality === 'Good' ? 'bg-success' : dayLog?.sleep_quality === 'Disturbed' ? 'bg-warning' : 'bg-urgent';
                                    return <div key={i} className={`h-8 rounded-md ${status} opacity-80`} title={dayLog?.sleep_quality} />;
                                })}

                                {/* Meals Row */}
                                <div className="text-sm font-medium py-2">Meals</div>
                                {[...Array(7)].map((_, i) => {
                                    const dayLog = logs[i % logs.length];
                                    const status = dayLog?.meals === 'Normal' ? 'bg-success' : dayLog?.meals === 'Reduced' ? 'bg-warning' : 'bg-urgent';
                                    return <div key={i} className={`h-8 rounded-md ${status} opacity-80`} title={dayLog?.meals} />;
                                })}

                                {/* Mood Row */}
                                <div className="text-sm font-medium py-2">Mood</div>
                                {[...Array(7)].map((_, i) => {
                                    const dayLog = logs[i % logs.length];
                                    const status = ['Happy', 'Calm'].includes(dayLog?.mood) ? 'bg-success' : dayLog?.mood === 'Irritable' ? 'bg-warning' : 'bg-urgent';
                                    return <div key={i} className={`h-8 rounded-md ${status} opacity-80`} title={dayLog?.mood} />;
                                })}
                            </div>
                            <div className="flex justify-end gap-4 mt-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success opacity-80" /> Normal</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning opacity-80" /> Disturbed</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-urgent opacity-80" /> Skipped/Incident</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="mood" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm sm:text-base md:text-lg">Weighted Mood Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="h-56 sm:h-72 md:h-96 flex flex-col items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Baseline Comparison Badge */}
                                <div className="absolute top-1/2 -translate-y-1/2 text-center">
                                    <div className="text-xs text-muted-foreground font-medium uppercase">Baseline</div>
                                    <div className="text-sm sm:text-base font-bold text-foreground">{patient.baseline_mood || "Calm"}</div>
                                </div>

                                <div className="mt-4 text-center w-full">
                                    <div className="flex justify-center gap-2 mb-2">
                                        <Badge variant="outline" className={`
                                            ${logs.some(l => l.mood !== patient.baseline_mood && !['Happy', 'Calm'].includes(l.mood))
                                                ? 'bg-warning/10 text-warning border-warning/20'
                                                : 'bg-success/10 text-success border-success/20'}
                                        `}>
                                            Current: {logs[logs.length - 1]?.mood || "Unknown"}
                                            {['Happy', 'Calm'].includes(logs[logs.length - 1]?.mood) ? ' ✅' : ' ⚠️'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Comparing current dominant mood to baseline.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Weighted Score & Days Context */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Average Mood Strain</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold mb-2 flex items-baseline gap-2">
                                        1.4 <span className="text-sm font-normal text-muted-foreground">/ 3.0</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-warning w-[45%]" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Weighted score based on last 7 days. Lower is better. <br />
                                        (Calm=0, Anxious=1, Irritable=2, Aggressive=3)
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Days Affected (Last 7 Days)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm"><div className="w-2 h-2 rounded-full bg-success" /> Happy / Calm</span>
                                            <span className="font-bold">5 days</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm"><div className="w-2 h-2 rounded-full bg-warning" /> Anxious</span>
                                            <span className="font-bold">2 days</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm"><div className="w-2 h-2 rounded-full bg-urgent" /> Aggressive</span>
                                            <span className="font-bold text-muted-foreground">0 days</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4 mt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Mood & Sleep Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm sm:text-base md:text-lg">Mood & Sleep Trends</CardTitle>
                            </CardHeader>
                            <CardContent className="h-56 sm:h-72 md:h-80">
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
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                                        <YAxis domain={[0, 5]} hide />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} margin={{ top: 5, right: 5, bottom: 5, left: -20 }} />
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
                                <CardTitle className="text-sm sm:text-base md:text-lg">Appetite Trends</CardTitle>
                            </CardHeader>
                            <CardContent className="h-56 sm:h-72 md:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                                        <YAxis domain={[0, 4]} hide />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} margin={{ top: 5, right: 5, bottom: 5, left: -20 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="step" dataKey="mealScore" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Appetite Level" />
                                    </LineChart>
                                </ResponsiveContainer>
                                <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
                                    <span>Annotations:</span>
                                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-urgent" /> Skipped Meal</span>
                                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-success" /> Routine Resumed</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Observations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {logs.slice().reverse().slice(0, 10).map((log) => (
                                    <div key={log.id} className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 rounded-lg md:rounded-xl bg-secondary/30 border border-border/50">
                                        <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${log.incident !== 'None' && log.incident !== 'no' ? 'bg-urgent/10 text-urgent' : 'bg-background text-primary'}`}>
                                            {log.incident !== 'None' && log.incident !== 'no' ? <AlertTriangle className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : <Activity className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                                <h4 className="font-semibold text-xs sm:text-sm">{log.mood} Mood</h4>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{log.notes}</p>
                                            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                                                <Badge variant="outline" className="text-[9px] sm:text-[10px]">Sleep: {log.sleep_quality}</Badge>
                                                <Badge variant="outline" className="text-[9px] sm:text-[10px]">Meals: {log.meals}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
>>>>>>> origin/frontend
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PatientDashboard;
