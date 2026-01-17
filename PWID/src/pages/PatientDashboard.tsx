import React, { useEffect, useState, useRef } from 'react';
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

// (Components removed as per simplification request)

// --- Main Page Component ---

const PatientDashboard = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const patientRes = await api.get(`/pwids/${id}`);
                setPatient(patientRes.data);
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

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">Age: {new Date().getFullYear() - new Date(patient.dob).getFullYear()}</Badge>
                        <span className="text-sm">•</span>
                        <span className="text-xs">Last updated: {format(new Date(), 'HH:mm')}</span>
                    </div>
                </div>
            </div>

            {/* Task Section (Only View) */}
            <div className="mt-6">
                <TaskSection patientId={patient.id} patientName={patient.name} />
            </div>
        </div>
    );
};

export default PatientDashboard;
