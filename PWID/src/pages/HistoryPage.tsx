import React from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Camera, 
  FileText, 
  Activity, 
  Pill,
  User,
  Calendar,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { HistoryEvent } from '@/data/mockData';

const HistoryPage = () => {
  const { events, patients } = useApp();

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'Unknown Patient';
  };

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'image': return <Camera className="w-4 h-4" />;
      case 'vitals': return <Activity className="w-4 h-4" />;
      case 'medication': return <Pill className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getEventBadge = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'voice': return <Badge variant="info">Voice</Badge>;
      case 'image': return <Badge variant="secondary">Image</Badge>;
      case 'vitals': return <Badge variant="stable">Vitals</Badge>;
      case 'medication': return <Badge variant="default">Medication</Badge>;
      case 'incident': return <Badge variant="urgent">Incident</Badge>;
      default: return <Badge variant="secondary">Note</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">History</h1>
            <p className="text-muted-foreground">All recorded events across patients</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {events.length} events
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {events.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No history events recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((event, index) => (
                <article 
                  key={event.id}
                  className="p-4 md:p-6 hover:bg-secondary/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              {getPatientName(event.patientId)}
                            </div>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {event.caregiverName}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {getEventBadge(event.type)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}

                      {event.voiceTranscription && (
                        <div className="mt-2 p-3 bg-info-light/30 rounded-lg">
                          <p className="text-sm italic text-foreground">"{event.voiceTranscription}"</p>
                        </div>
                      )}

                      {event.vitals && (
                        <div className="mt-2 p-3 bg-success-light/30 rounded-lg">
                          <div className="flex flex-wrap gap-4 text-sm">
                            {event.vitals.temperature && (
                              <span className="text-foreground">
                                <span className="text-muted-foreground">Temp:</span> {event.vitals.temperature}°F
                              </span>
                            )}
                            {event.vitals.heartRate && (
                              <span className="text-foreground">
                                <span className="text-muted-foreground">HR:</span> {event.vitals.heartRate} bpm
                              </span>
                            )}
                            {event.vitals.bloodPressure && (
                              <span className="text-foreground">
                                <span className="text-muted-foreground">BP:</span> {event.vitals.bloodPressure}
                              </span>
                            )}
                            {event.vitals.weight && (
                              <span className="text-foreground">
                                <span className="text-muted-foreground">Weight:</span> {event.vitals.weight} lbs
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
