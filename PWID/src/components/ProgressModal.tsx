import React, { useEffect, useRef } from 'react';
import { Patient, HistoryEvent } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  X,
  User,
  Calendar,
  TrendingUp,
  Mic,
  Camera,
  FileText,
  Activity,
  Pill,
  Heart,
  Thermometer,
  Download
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ProgressModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ patient, isOpen, onClose }) => {
  const { getPatientEvents } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const events = getPatientEvents(patient.id);

  // Focus trap and close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'image': return <Camera className="w-4 h-4" />;
      case 'vitals': return <Activity className="w-4 h-4" />;
      case 'medication': return <Pill className="w-4 h-4" />;
      case 'task-complete': return <Heart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'voice': return 'bg-info-light text-info';
      case 'image': return 'bg-accent-light text-accent-foreground';
      case 'vitals': return 'bg-success-light text-success';
      case 'medication': return 'bg-primary-light text-primary';
      case 'incident': return 'bg-urgent-light text-urgent';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content animate-scale-in"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-foreground">
                {patient.name} - Progress
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Last 30 days
              </p>
            </div>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close progress modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto scrollbar-thin">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-secondary/50 rounded-xl text-center">
              <div className="w-10 h-10 rounded-lg bg-success-light mx-auto mb-2 flex items-center justify-center">
                <Heart className="w-5 h-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {events.filter(e => e.type === 'vitals' && e.vitals?.heartRate).length > 0
                  ? Math.round(events.filter(e => e.type === 'vitals' && e.vitals?.heartRate).reduce((acc, curr) => acc + (curr.vitals?.heartRate || 0), 0) / events.filter(e => e.type === 'vitals' && e.vitals?.heartRate).length)
                  : '--'}
              </p>
              <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-xl text-center">
              <div className="w-10 h-10 rounded-lg bg-info-light mx-auto mb-2 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-info" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {events.filter(e => e.type === 'vitals' && e.vitals?.temperature).length > 0
                  ? (events.filter(e => e.type === 'vitals' && e.vitals?.temperature).reduce((acc, curr) => acc + (curr.vitals?.temperature || 0), 0) / events.filter(e => e.type === 'vitals' && e.vitals?.temperature).length).toFixed(1)
                  : '--'}°
              </p>
              <p className="text-sm text-muted-foreground">Avg Temp</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-xl text-center">
              <div className="w-10 h-10 rounded-lg bg-primary-light mx-auto mb-2 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {events.filter(e => e.type === 'vitals' && e.vitals?.bloodPressure).length > 0
                  ? events.filter(e => e.type === 'vitals' && e.vitals?.bloodPressure)[0].vitals?.bloodPressure
                  : '--'}
              </p>
              <p className="text-sm text-muted-foreground">Latest BP</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-xl text-center">
              <div className="w-10 h-10 rounded-lg bg-accent-light mx-auto mb-2 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{events.length}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
          </div>

          {/* Timeline */}
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Event Timeline
          </h3>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No events recorded for this patient.
              </p>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    {index < events.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {event.caregiverName} • {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>

                    {event.voiceTranscription && (
                      <div className="p-3 bg-info-light/30 rounded-lg text-sm">
                        <p className="text-foreground italic">"{event.voiceTranscription}"</p>
                      </div>
                    )}

                    {event.vitals && (
                      <div className="p-3 bg-success-light/30 rounded-lg text-sm">
                        <div className="flex flex-wrap gap-4">
                          {event.vitals.temperature && (
                            <span>Temp: {event.vitals.temperature}°F</span>
                          )}
                          {event.vitals.heartRate && (
                            <span>HR: {event.vitals.heartRate} bpm</span>
                          )}
                          {event.vitals.bloodPressure && (
                            <span>BP: {event.vitals.bloodPressure}</span>
                          )}
                          {event.vitals.weight && (
                            <span>Weight: {event.vitals.weight} lbs</span>
                          )}
                        </div>
                      </div>
                    )}

                    {event.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={event.imageUrl}
                          alt={event.description}
                          className="rounded-lg max-w-[200px] border border-border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="default" className="gap-2" onClick={() => window.open(`/report/${patient.id}`, '_blank')}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
