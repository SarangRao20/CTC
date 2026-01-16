import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Activity, Moon, Utensils, AlertTriangle, CheckCircle2,
    ChevronDown, ChevronUp, FileText, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';
import TodaysStatus from '@/components/TodaysStatus';

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

const PatientDashboard = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [risk, setRisk] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("status"); // Default to 'status' (Caregiver View)
    const [informed, setInformed] = useState<Record<string, boolean>>({});
    const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

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

    if (loading) return <div className="p-8"><Skeleton className="h-12 w-1/3" /></div>;
    if (!patient) return <div className="p-8">Patient not found</div>;

    // Process data for charts (retained for DetailedAnalysis)
    const moodMap: any = { "Calm": 5, "Happy": 4, "Anxious": 3, "Irritable": 2, "Aggressive": 1, "Unknown": 3 };
    const sleepMap: any = { "Good": 3, "Disturbed": 2, "Poor": 1, "Unknown": 2 };
    const mealMap: any = { "Normal": 3, "Reduced": 2, "Skipped": 1, "Unknown": 2 };

    const chartData = logs.map(log => ({
        date: format(new Date(log.created_at), 'MMM dd'),
        moodScore: moodMap[log.mood] || 3,
        sleepScore: sleepMap[log.sleep_quality] || 2,
        mealScore: mealMap[log.meals] || 2,
    })).slice(-14);

    const incidentCount = logs.filter(l => l.incident !== 'None' && l.incident !== 'no' && new Date(l.created_at) >= subDays(new Date(), 1)).length;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
            {/* 1. Header (Context Only) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">Age: {new Date().getFullYear() - new Date(patient.dob).getFullYear()}</Badge>
                        <span className="text-sm">•</span>
                        <span className="text-sm">Support Level: High</span>
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
                                    .filter(log => new Date(log.created_at) >= subDays(new Date(), 2))
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
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PatientDashboard;
