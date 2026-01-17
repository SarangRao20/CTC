import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Activity, Moon, Utensils, AlertTriangle, CheckCircle2,
    ChevronDown, ChevronUp, FileText, Info, Clock, Upload, File, Plus,
    Pill, Droplets, Stethoscope, Calendar, Trash2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, isSameDay } from 'date-fns';
import TodaysStatus from '@/components/TodaysStatus';
import AddTaskModal from '@/components/AddTaskModal';

// --- Sub-Components ---

const IncidentTextHeader = ({ risk, incidentCount, onViewIncident, incidentLogs }: { risk: any, incidentCount: number, onViewIncident: () => void, incidentLogs: any[] }) => {
    const isHighRisk = risk?.risk_level === 'High';
    const hasIncidents = incidentCount > 0;
    const latestIncident = incidentLogs[0];

    // Status logic
    let statusText = "Status: Stable. No recent incidents.";
    let statusColor = "text-success";
    let Icon = CheckCircle2;

    if (isHighRisk || hasIncidents) {
        statusText = `Needs Attention: ${latestIncident ? `Incident reported ${format(new Date(latestIncident.created_at), 'MMM d')} (${latestIncident.incident})` : "Risk factors identified."}`;
        statusColor = "text-urgent";
        Icon = AlertTriangle;
    }

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg bg-card border shadow-sm ${isHighRisk || hasIncidents ? 'border-urgent/30 bg-urgent/5' : 'border-border'}`}>
            <Icon className={`w-5 h-5 mt-0.5 ${statusColor}`} />
            <div className="flex-1">
                <p className={`font-semibold text-lg ${statusColor}`}>
                    {statusText}
                </p>
                {hasIncidents && (
                    <div className="mt-2 text-sm text-foreground/80">
                        <span className="font-medium">Action:</span> Review incidents tab for details.
                        <Button variant="link" className="h-auto p-0 ml-2 text-primary" onClick={onViewIncident}>View Logs</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Task Logic (Ported from RoutineChecksPage) ---

const TaskCard = ({ task, onComplete, onDelete }: { task: any, onComplete: (id: string) => void, onDelete: (id: string) => void }) => {
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'medication': return <Pill className="w-4 h-4" />;
            case 'meal': return <Utensils className="w-4 h-4" />;
            case 'hygiene': return <Droplets className="w-4 h-4" />;
            case 'therapy': return <Stethoscope className="w-4 h-4" />;
            case 'checkup': return <Clock className="w-4 h-4" />;
            default: return <Calendar className="w-4 h-4" />;
        }
    };

    return (
        <div className={`p-3 rounded-lg border transition-all mb-2 flex items-center gap-3
            ${task.status === 'overdue' ? 'bg-urgent-light/30 border-urgent/20' :
                task.status === 'completed' ? 'bg-success-light/30 border-success/20' :
                    'bg-card border-border hover:border-primary/30'}`}>

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${task.status === 'overdue' ? 'bg-urgent-light text-urgent' :
                    task.status === 'completed' ? 'bg-success-light text-success' :
                        'bg-secondary text-secondary-foreground'}`}>
                {getCategoryIcon(task.category)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-medium text-sm ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {task.title}
                    </h3>
                    <Badge variant={task.status === 'overdue' ? 'destructive' : task.status === 'completed' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                        {task.status === 'overdue' ? 'Overdue' : task.status === 'completed' ? 'Done' : task.dueTime}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{task.description}</p>
            </div>

            {task.status !== 'completed' && (
                <Button variant="ghost" size="icon" onClick={() => onComplete(task.id)} className="h-8 w-8 text-muted-foreground hover:text-success hover:bg-success/10 rounded-full" title="Mark Complete">
                    <CheckCircle2 className="w-5 h-5" />
                </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" title="Delete Task">
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

const TaskSection = ({ patientId, patientName }: { patientId: string, patientName: string }) => {
    const { tasks, completeTask, deleteTask } = useApp();
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

    // Filter tasks for this patient
    const patientTasks = tasks.filter(t => String(t.patientId) === String(patientId));
    const pending = patientTasks.filter(t => t.status !== 'completed');
    const completed = patientTasks.filter(t => t.status === 'completed');

    return (
        <Card className="border-none shadow-none bg-transparent p-0">
            <CardContent className="p-0">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Daily Routine & Tasks
                    </h3>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{pending.length} Pending</Badge>
                        <Button size="sm" onClick={() => setIsAddTaskOpen(true)} className="gap-1 h-7">
                            <Plus className="w-3 h-3" /> Add Task
                        </Button>
                    </div>
                </div>

                {pending.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">To Do</h4>
                        {pending.map(task => (
                            <TaskCard key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />
                        ))}
                    </div>
                )}

                {completed.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 opacity-70">Completed</h4>
                        {completed.map(task => (
                            <TaskCard key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />
                        ))}
                    </div>
                )}

                {patientTasks.length === 0 && (
                    <div className="text-center py-10 border rounded-xl border-dashed">
                        <p className="text-muted-foreground">No tasks assigned to this resident.</p>
                        <Button variant="link" className="text-primary" onClick={() => setIsAddTaskOpen(true)}>Add a task</Button>
                    </div>
                )}

                <AddTaskModal
                    isOpen={isAddTaskOpen}
                    onClose={() => setIsAddTaskOpen(false)}
                    patientId={patientId}
                    patientName={patientName}
                />
            </CardContent>
        </Card>
    );
};

// --- Detailed Analysis Component ---
const DetailedAnalysis = ({ logs }: { logs: any[] }) => {
    // Mock Data for Charts (if no logs)
    const mockData = [
        { day: 'Mon', mood: 80, sleep: 70 },
        { day: 'Tue', mood: 65, sleep: 60 },
        { day: 'Wed', mood: 90, sleep: 85 },
        { day: 'Thu', mood: 75, sleep: 65 },
        { day: 'Fri', mood: 85, sleep: 80 },
        { day: 'Sat', mood: 60, sleep: 50 },
        { day: 'Sun', mood: 95, sleep: 90 },
    ];

    return (
        <Collapsible className="border rounded-xl bg-card">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-semibold hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Detailed Analysis (Trends)
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockData}>
                            <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                            <YAxis axisLine={false} tickLine={false} fontSize={12} />
                            <Tooltip />
                            <Area type="monotone" dataKey="mood" stroke="#0d9488" fillOpacity={1} fill="url(#colorMood)" />
                            <Area type="monotone" dataKey="sleep" stroke="#8b5cf6" fillOpacity={0} fill="transparent" strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Mood Score</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Sleep Quality</div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

// --- Incident List Component ---
const IncidentList = ({ logs }: { logs: any[] }) => {
    // Filter for incidents (Mock logic: logs with incident !== 'None')
    const incidents = logs.filter(l => l.incident && l.incident !== 'None' && l.incident !== 'no');

    if (incidents.length === 0) {
        return (
            <div className="text-center py-10 border rounded-xl border-dashed">
                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3 opacity-50" />
                <h3 className="font-semibold">{format(new Date(), 'MMMM')} Update</h3>
                <p className="text-muted-foreground">No incidents reported this month. Great job!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {incidents.map((log, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-xl bg-card hover:bg-secondary/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-urgent/10 flex items-center justify-center flex-shrink-0 text-urgent">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{log.incident}</h4>
                            <Badge variant="outline">{format(new Date(log.created_at), 'MMM d, h:mm a')}</Badge>
                        </div>
                        <p className="text-sm text-foreground/80">{log.notes || "No operational notes recorded."}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Main Page Component ---

const PatientDashboard = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("tasks"); // Default to 'tasks'
    const [informed, setInformed] = useState<Record<string, boolean>>({});
    const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

    const [logs, setLogs] = useState<any[]>([]);
    const [risk, setRisk] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [patientRes, logsRes, riskRes] = await Promise.all([
                api.get(`/pwids/${id}`),
                api.get(`/logs/${id}`),
                api.get(`/risk/${id}`)
            ]);
            setPatient(patientRes.data);
            setLogs(logsRes.data.reverse()); // Newest first
            setRisk(riskRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) return <div className="p-8"><Skeleton className="h-12 w-1/3" /></div>;
    if (!patient) return <div className="p-8">Patient not found</div>;

    const incidentCount = logs.filter(l => l.incident && l.incident.toLowerCase() !== 'no' && l.incident.toLowerCase() !== 'none').length;

    // Helper for Age
    const getAge = (dob: string) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return 'N/A'; // Invalid date
        return new Date().getFullYear() - birthDate.getFullYear();
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">Age: {getAge(patient.dob)}</Badge>
                        <span className="text-sm">•</span>
                        <span className="text-xs">Last updated: {format(new Date(), 'HH:mm')}</span>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-6">
                    <TabsTrigger value="tasks">Tasks & Routine</TabsTrigger>
                    <TabsTrigger value="status">Status Overview</TabsTrigger>
                    <TabsTrigger value="incidents">Incidents</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks">
                    <TaskSection patientId={patient.id} patientName={patient.full_name} />
                </TabsContent>

                <TabsContent value="status" className="space-y-6">
                    <IncidentTextHeader
                        risk={risk}
                        incidentCount={incidentCount}
                        onViewIncident={() => setActiveTab('incidents')}
                        incidentLogs={logs}
                    />
                    <TodaysStatus logs={logs} patientName={patient.full_name} />
                    <DetailedAnalysis logs={logs} />
                </TabsContent>

                <TabsContent value="incidents">
                    <IncidentList logs={logs} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PatientDashboard;
