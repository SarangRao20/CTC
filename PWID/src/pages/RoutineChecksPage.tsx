import React from 'react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Pill,
  Utensils,
  Droplets,
  Stethoscope,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/data/mockData';
import { useNavigate, useSearchParams } from 'react-router-dom';

const RoutineChecksPage = () => {
  const { tasks, patients, completeTask, caregiver } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFilter = searchParams.get('patientId');

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'Unknown Patient';
  };

  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'medication': return <Pill className="w-4 h-4" />;
      case 'meal': return <Utensils className="w-4 h-4" />;
      case 'hygiene': return <Droplets className="w-4 h-4" />;
      case 'therapy': return <Stethoscope className="w-4 h-4" />;
      case 'checkup': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // Group tasks by patient (filtered)
  const patientTasks = patients
    .filter(p => !patientIdFilter || String(p.id) === patientIdFilter)
    .reduce((acc, patient) => {
      const pTasks = tasks.filter(t => String(t.patientId) === String(patient.id));
      if (pTasks.length > 0) {
        acc.push({
          patient,
          tasks: pTasks
        });
      }
      return acc;
    }, [] as { patient: any, tasks: Task[] }[]);

  const TaskCard = ({ task }: { task: Task }) => (
    <article
      className={`
        p-3 rounded-lg border transition-all mb-2
        ${task.status === 'overdue'
          ? 'bg-urgent-light/30 border-urgent/20'
          : task.status === 'completed'
            ? 'bg-success-light/30 border-success/20'
            : 'bg-card border-border hover:border-primary/30'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            ${task.status === 'overdue'
              ? 'bg-urgent-light text-urgent'
              : task.status === 'completed'
                ? 'bg-success-light text-success'
                : 'bg-secondary text-secondary-foreground'
            }
          `}
        >
          {getCategoryIcon(task.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm text-foreground">{task.title}</h3>
            <Badge
              className="text-[10px] px-1.5 py-0"
              variant={
                task.status === 'overdue' ? 'overdue' :
                  task.status === 'completed' ? 'completed' :
                    task.priority === 'urgent' ? 'urgent' :
                      task.priority === 'high' ? 'needs-attention' :
                        'pending'
              }
            >
              {task.status === 'overdue' ? 'Overdue' :
                task.status === 'completed' ? 'Done' :
                  task.dueTime}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
        </div>

        {task.status !== 'completed' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => completeTask(task.id)}
            className="h-8 w-8 text-muted-foreground hover:text-success hover:bg-success-light/20 rounded-full"
            title="Mark Complete"
          >
            <CheckCircle2 className="w-5 h-5" />
          </Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      <main className="max-w-5xl mx-auto p-4 md:p-6 w-full flex-1 flex flex-col min-h-0">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {patientIdFilter ? `Tasks for ${getPatientName(patientIdFilter)}` : 'Routine Checks'}
            </h1>
            <p className="text-muted-foreground">
              {patientIdFilter ? 'Specific resident tasks' : `Tasks for ${caregiver?.ngo_name || 'your residents'}`}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {patientIdFilter && (
              <Button variant="ghost" size="sm" onClick={() => setSearchParams({})} className="mr-2">
                Clear Filter
              </Button>
            )}
            <div className="px-3 py-1 bg-urgent-light/20 text-urgent rounded-lg text-sm font-medium border border-urgent/20">
              {tasks.filter(t => t.status === 'overdue').length} Overdue
            </div>
            <div className="px-3 py-1 bg-secondary text-foreground rounded-lg text-sm font-medium border border-border">
              {tasks.filter(t => t.status === 'pending').length} Pending
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-20 pr-2">
          {patientTasks.map(({ patient, tasks: pTasks }) => {
            const pending = pTasks.filter(t => t.status !== 'completed');
            const completed = pTasks.filter(t => t.status === 'completed');
            const hasUrgent = pending.some(t => t.priority === 'urgent' || t.status === 'overdue');

            return (
              <div key={patient.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${hasUrgent ? 'border-urgent/40' : 'border-border'}`}>
                {/* Patient Header */}
                <div className="p-4 bg-secondary/30 flex items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center font-bold text-lg text-primary">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground">{patient.name}</h2>
                      <p className="text-xs text-muted-foreground">Room {patient.roomNumber}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/dashboard`)}>
                    View Card <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                {/* Task List */}
                <div className="p-4">
                  {pending.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">To Do ({pending.length})</h3>
                      {pending.map(t => <TaskCard key={t.id} task={t} />)}
                    </div>
                  )}

                  {completed.length > 0 && (
                    <div className={`${pending.length > 0 ? 'pt-4 border-t border-border' : ''}`}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Completed</h3>
                      {completed.map(t => <TaskCard key={t.id} task={t} />)}
                    </div>
                  )}

                  {pTasks.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No tasks assigned.</p>
                  )}
                </div>
              </div>
            );
          })}

          {patientTasks.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">No active routine checks found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoutineChecksPage;
