import React from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
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
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/data/mockData';

const RoutineChecksPage = () => {
  const { tasks, patients, completeTask } = useApp();

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

  const overdueTasks = tasks.filter(t => t.status === 'overdue');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const TaskCard = ({ task }: { task: Task }) => (
    <article 
      className={`
        p-4 rounded-xl border transition-all
        ${task.status === 'overdue' 
          ? 'bg-urgent-light/30 border-urgent/20' 
          : task.status === 'completed'
            ? 'bg-success-light/30 border-success/20'
            : 'bg-card border-border hover:border-primary/30'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div 
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
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
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{task.title}</h3>
            <Badge 
              variant={
                task.status === 'overdue' ? 'overdue' : 
                task.status === 'completed' ? 'completed' : 
                task.priority === 'urgent' ? 'urgent' :
                task.priority === 'high' ? 'needs-attention' : 
                'pending'
              }
            >
              {task.status === 'overdue' ? 'Overdue' : 
               task.status === 'completed' ? 'Completed' : 
               task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <User className="w-3 h-3" />
            {getPatientName(task.patientId)}
            <span>•</span>
            <Clock className="w-3 h-3" />
            {task.dueTime}
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          
          {task.status !== 'completed' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => completeTask(task.id)}
              className="mt-3 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Complete
            </Button>
          )}

          {task.completedAt && task.completedBy && (
            <p className="text-xs text-success mt-2">
              Completed by {task.completedBy} at {format(new Date(task.completedAt), 'h:mm a')}
            </p>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Routine Checks</h1>
          <p className="text-muted-foreground">Today's scheduled tasks and reminders</p>
        </div>

        {/* Overdue Section */}
        {overdueTasks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-urgent" />
              <h2 className="text-lg font-semibold text-urgent">
                Overdue ({overdueTasks.length})
              </h2>
            </div>
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Pending Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Pending ({pendingTasks.length})
            </h2>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">All tasks completed! Great work.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        {/* Completed Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-foreground">
              Completed Today ({completedTasks.length})
            </h2>
          </div>
          {completedTasks.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground">No tasks completed yet today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default RoutineChecksPage;
