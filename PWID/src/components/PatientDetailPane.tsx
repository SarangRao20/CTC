import React, { useState } from 'react';
import { Patient, Task, HistoryEvent } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VoiceInputButton from './VoiceInputButton';
import ImageUploadButton from './ImageUploadButton';
import ObservationResultModal from './ObservationResultModal';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  MapPin,
  Pill,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Mic,
  Camera,
  Calendar
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PatientDetailPaneProps {
  patient: Patient;
  tasks: Task[];
  events: HistoryEvent[];
  onViewProgress: () => void;
}

const PatientDetailPane: React.FC<PatientDetailPaneProps> = ({
  patient,
  tasks,
  events,
  onViewProgress,
}) => {
  const { completeTask, addEvent } = useApp();
  const { toast } = useToast();
  const [observationResult, setObservationResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVoiceNote = async (transcription: string) => {
    // 1. Optimistic UI update (optional, keeping existing behavior for immediate feedback)
    addEvent({
      patientId: patient.id,
      type: 'voice',
      title: 'Voice Note',
      description: transcription,
      voiceTranscription: transcription,
    });

    // 2. Call Backend
    try {
      const response = await api.post('/observe', {
        text: transcription,
        pwid_id: patient.id, // Ensure pwid_id is correct format for backend
        caregiver_id: 1 // Hardcoded for now as per Context limitation
      });

      if (response.status === 201) {
        setObservationResult(response.data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Observation failed", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the observation with AI.",
        variant: "destructive"
      });
    }
  };

  const handleImageCapture = (file: File, preview: string) => {
    addEvent({
      patientId: patient.id,
      type: 'image',
      title: 'Photo Captured',
      description: `Image: ${file.name}`,
      imageUrl: preview,
    });
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'overdue');
  const recentEvents = events.slice(0, 3);

  const statusLabel = {
    stable: 'Stable',
    'needs-attention': 'Needs Attention',
    urgent: 'Urgent',
  };

  return (
    <div className="detail-pane h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border bg-secondary/30">
        <div className="flex items-start gap-4">
          <div
            className={`
              w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
              ${patient.status === 'urgent'
                ? 'bg-urgent-light'
                : patient.status === 'needs-attention'
                  ? 'bg-warning-light'
                  : 'bg-primary-light'
              }
            `}
          >
            <User
              className={`
                w-8 h-8
                ${patient.status === 'urgent'
                  ? 'text-urgent'
                  : patient.status === 'needs-attention'
                    ? 'text-warning'
                    : 'text-primary'
                }
              `}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
              <Badge variant={patient.status === 'urgent' ? 'urgent' : patient.status === 'needs-attention' ? 'needs-attention' : 'stable'}>
                {statusLabel[patient.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-2">
              {patient.primaryDiagnosis}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Age {patient.age}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Room {patient.roomNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mt-4">
          <VoiceInputButton onTranscription={handleVoiceNote} />
          <ImageUploadButton onImageCapture={handleImageCapture} />
          <Button variant="action-secondary" onClick={onViewProgress} className="flex-1">
            View Full Progress
          </Button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* Medications & Allergies */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Medical Info
          </h3>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
              <Pill className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Medications</p>
                <p className="text-sm text-muted-foreground">
                  {patient.medications.join(', ') || 'None'}
                </p>
              </div>
            </div>
            {patient.allergies.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-urgent-light/50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-urgent mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-urgent mb-1">Allergies</p>
                  <p className="text-sm text-urgent/80">
                    {patient.allergies.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pending Tasks
            </h3>
            <Badge variant="secondary">{pendingTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending tasks
              </p>
            ) : (
              pendingTasks.map(task => (
                <div
                  key={task.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border
                    ${task.status === 'overdue'
                      ? 'bg-urgent-light/30 border-urgent/20'
                      : 'bg-card border-border'
                    }
                  `}
                >
                  <Clock
                    className={`w-5 h-5 flex-shrink-0 ${task.status === 'overdue' ? 'text-urgent' : 'text-muted-foreground'
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {task.dueTime}
                    </p>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => completeTask(task.id)}
                    className="flex-shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="sr-only">Complete task</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              recentEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    {event.type === 'voice' ? (
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    ) : event.type === 'image' ? (
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })} • {event.caregiverName}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <ObservationResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={observationResult}
      />
    </div>
  );
};

export default PatientDetailPane;
