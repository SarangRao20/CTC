import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Activity, Skull, Moon, Utensils, AlertTriangle, TrendingUp, Calendar, CheckCircle2,
    ChevronDown, ChevronUp, FileText, Info, Phone
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

// --- Sub-Components ---

const StatusBanner = ({ risk, incidentCount, onViewIncident }: { risk: any, incidentCount: number, onViewIncident: () => void }) => {
    const { t } = useTranslation();
    const isHighRisk = risk?.risk_level === 'High';
    const isMediumRisk = risk?.risk_level === 'Medium';
    const hasIncidents = incidentCount > 0;

    let statusColor = "bg-success/10 border-success/20 text-success-foreground";
    let iconColor = "bg-success text-success-foreground";
    let Icon = CheckCircle2;
    let title = t('stable');

    if (isHighRisk) {
        statusColor = "bg-urgent/10 border-urgent/20 text-urgent-foreground";
        iconColor = "bg-urgent text-urgent-foreground";
        Icon = AlertTriangle;
        title = t('immediate_action_required');
    } else if (isMediumRisk || hasIncidents) {
        statusColor = "bg-warning/10 border-warning/20 text-warning-foreground";
        iconColor = "bg-warning text-warning-foreground";
        Icon = AlertTriangle;
        title = t('needs_attention');
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
                        {risk?.reason || (hasIncidents ? t('incident_reported_recent') : t('routine_proceeding_expected'))}
                    </p>
                </div>
            </div>
            {(isHighRisk || hasIncidents) && (
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-background/80 border-current/30" onClick={onViewIncident}>
                        {t('view_incident')}
                    </Button>
                    <Button variant={isHighRisk ? "destructive" : "default"} onClick={() => alert(t('supervisor_notified_sim'))}>
                        {t('inform_supervisor')}
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
    const { t } = useTranslation();
    const lastLog = logs[logs.length - 1];
    const poorSleep = lastLog?.sleep_quality === 'Poor' || lastLog?.sleep_quality === 'Disturbed';
    const missedMeal = lastLog?.meals === 'Reduced' || lastLog?.meals === 'Skipped';

    return (
        <Card className="border-l-4 border-l-primary shadow-sm bg-gradient-to-r from-background to-secondary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {t('what_needs_attention_today')}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
                <ActionItem label={t('task_log_mood')} />
                <ActionItem label={t('task_ensure_meals')} defaultChecked={!missedMeal} />
                {poorSleep && <ActionItem label={t('task_monitor_sleep')} />}
                <ActionItem label={t('task_update_hygiene')} />
            </CardContent>
        </Card>
    );
};

const TextSummarySection = ({ logs, patient }: { logs: any[], patient: any }) => {
    const { t } = useTranslation();
    const last7Days = logs.slice(-7);
    const stableDays = last7Days.filter(l => l.incident === 'None' || l.incident === 'no').length;

    const anxietyCount = last7Days.filter(l => l.mood === 'Anxious').length;
    const moodSummary = anxietyCount > 2
        ? t('mood_summary_anxious', { count: anxietyCount })
        : t('mood_summary_stable');

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                        {t('weekly_care_summary')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{stableDays} <span className="text-base font-normal text-muted-foreground">{t('of_7_days')}</span></span>
                    </div>
                    <p className="text-sm font-medium">{t('routine_followed_well')}</p>
                    <div className="space-y-2 pt-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" /> {t('no_major_incidents')}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Moon className="w-4 h-4 text-indigo-400" /> {t('disturbed_sleep_count', { count: 1 })}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-primary">{t('view_routine_details')} →</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                        {t('system_observations')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 flex gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            {t('system_insight_sleep_anxiety')}
                        </p>
                    </div>
                    <div className="pt-2">
                        <h4 className="text-sm font-semibold mb-1">{t('mood_pattern')}</h4>
                        <p className="text-sm text-muted-foreground">{moodSummary}</p>
                    </div>
                    <div className="pt-2">
                        <h4 className="text-sm font-semibold mb-1">{t('suggested_care')}</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>{t('offer_reassurance')}</li>
                            <li>{t('maintain_bedtime_routine')}</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const DetailedAnalysis = ({ logs, chartData, patient }: { logs: any[], chartData: any[], patient: any }) => {
    const { t } = useTranslation();
    const pieData = [
        { name: t('calm'), value: logs.filter(l => l.mood === 'Calm').length, color: '#10b981' },
        { name: t('happy'), value: logs.filter(l => l.mood === 'Happy').length, color: '#34d399' },
        { name: t('anxious'), value: logs.filter(l => l.mood === 'Anxious').length, color: '#f59e0b' },
        { name: t('irritable'), value: logs.filter(l => l.mood === 'Irritable').length, color: '#f97316' },
        { name: t('aggressive'), value: logs.filter(l => l.mood === 'Aggressive').length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 pt-4">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>{t('mood_sleep_trends')}</CardTitle></CardHeader>
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
                    <CardHeader><CardTitle>{t('mood_distribution')}</CardTitle></CardHeader>
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
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <Activity className="w-6 h-6 text-primary mb-2" />
                        <span className="text-2xl font-bold">98%</span>
                        <span className="text-xs text-muted-foreground">{t('compliance')}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <TrendingUp className="w-6 h-6 text-success mb-2" />
                        <span className="text-2xl font-bold">{t('stable')}</span>
                        <span className="text-xs text-muted-foreground">{t('mood_trend')}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <Moon className="w-6 h-6 text-indigo-400 mb-2" />
                        <span className="text-2xl font-bold">{t('good')}</span>
                        <span className="text-xs text-muted-foreground">{t('sleep_check')}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <Utensils className="w-6 h-6 text-orange-400 mb-2" />
                        <span className="text-2xl font-bold">{t('normal')}</span>
                        <span className="text-xs text-muted-foreground">{t('appetite')}</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- Main Page Component ---

const PatientDashboard = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [risk, setRisk] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("status");
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

    if (loading) return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        </div>
    );

    if (!patient) return <div className="p-8">{t('patient_not_found')}</div>;

    const moodMap: any = { "Calm": 5, "Happy": 4, "Anxious": 3, "Irritable": 2, "Aggressive": 1, "Unknown": 3 };
    const sleepMap: any = { "Good": 3, "Disturbed": 2, "Poor": 1, "Unknown": 2 };
    const mealMap: any = { "Normal": 3, "Reduced": 2, "Skipped": 1, "Unknown": 2 };

    const chartData = logs.map(log => ({
        date: format(new Date(log.created_at), 'MMM dd'),
        moodScore: moodMap[log.mood] || 3,
        sleepScore: sleepMap[log.sleep_quality] || 2,
        mealScore: mealMap[log.meals] || 2,
    })).slice(-14);

    const incidentCount = logs.filter(l => l.incident !== 'None' && l.incident !== 'no' && new Date(l.created_at) >= subDays(new Date(), 7)).length;

    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'bg-urgent text-urgent-foreground';
            case 'medium': return 'bg-warning text-warning-foreground';
            default: return 'bg-success text-success-foreground';
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
            {/* 1. Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{patient.full_name}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs">{t('room')} {patient.roomNumber}</Badge>
                            <span className="text-sm">•</span>
                            <span className="text-sm">{t('age')}: {patient.age}</span>
                            <span className="text-sm">•</span>
                            <span className="text-sm">{t('level')}: {patient.supportLevel}</span>
                        </div>
                    </div>
                </div>
                <Badge className={`text-sm px-3 py-1 rounded-full ${getRiskColor(risk?.risk_level)}`}>
                    {t(risk?.risk_level?.toLowerCase() || 'unknown')} {t('risk')}
                </Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="status">{t('status_overview')}</TabsTrigger>
                    <TabsTrigger value="incidents">{t('incidents')}</TabsTrigger>
                </TabsList>

                {/* --- CAREGIVER VIEW (STATUS) --- */}
                <TabsContent value="status" className="space-y-6 mt-6">
                    {/* Status Banner */}
                    <StatusBanner
                        risk={risk}
                        incidentCount={incidentCount}
                        onViewIncident={() => setActiveTab('incidents')}
                    />

                    {/* Action List */}
                    <CaregiverActionList logs={logs} />

                    {/* Daily Snapshot */}
                    <TodaysStatus logs={logs} patientName={patient.full_name.split(' ')[0]} />

                    {/* Text Summaries */}
                    <TextSummarySection logs={logs} patient={patient} />

                    {/* Collapsible Detailed Analysis */}
                    <Collapsible open={showDetailedAnalysis} onOpenChange={setShowDetailedAnalysis} className="border rounded-xl bg-card">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full flex justify-between items-center p-4 h-auto font-normal text-muted-foreground hover:text-foreground">
                                <span className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    {t('detailed_analysis')} ({t('for_supervisors')})
                                </span>
                                {showDetailedAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 border-t">
                            <DetailedAnalysis logs={logs} chartData={chartData} patient={patient} />
                        </CollapsibleContent>
                    </Collapsible>
                </TabsContent>

                {/* --- INCIDENTS VIEW --- */}
                <TabsContent value="incidents" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('incident_routine_logs')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {logs.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">{t('no_logs_recorded')}</p>
                                ) : (
                                    [...logs]
                                        .filter(log => new Date(log.created_at) >= subDays(new Date(), 7))
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .map((log) => {
                                            const isIncident = log.incident !== 'None' && log.incident !== 'no';
                                            return (
                                                <div key={log.id} className={`flex items-start gap-4 p-4 rounded-xl border ${isIncident ? 'bg-urgent/5 border-urgent/20' : 'bg-secondary/30 border-border/50'}`}>
                                                    <div className={`p-2 rounded-lg ${isIncident ? 'bg-urgent/10 text-urgent' : 'bg-background text-primary'}`}>
                                                        {isIncident ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className={`font-semibold text-sm ${isIncident ? 'text-urgent' : ''}`}>
                                                                {isIncident ? `${t('incident')}: ${log.incident}` : `${t(log.mood.toLowerCase())} ${t('mood')}`}
                                                            </h4>
                                                            <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            <Badge variant="outline" className="text-[10px]">{t('sleep')}: {t(log.sleep_quality.toLowerCase())}</Badge>
                                                            <Badge variant="outline" className="text-[10px]">{t('meals')}: {t(log.meals.toLowerCase())}</Badge>
                                                        </div>
                                                    </div>
                                                    {isIncident && (
                                                        <div className="flex flex-col items-center self-center pl-2">
                                                            <Button
                                                                size="sm"
                                                                variant={informed[log.id] ? "ghost" : "destructive"}
                                                                className={informed[log.id] ? "text-success hover:text-success hover:bg-success/10 h-8" : "h-8 px-3 text-xs"}
                                                                onClick={() => setInformed(prev => ({ ...prev, [log.id]: true }))}
                                                                disabled={informed[log.id]}
                                                            >
                                                                {informed[log.id] ? <CheckCircle2 className="w-4 h-4 mr-1" /> : t('inform')}
                                                                {informed[log.id] && t('informed')}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PatientDashboard;
