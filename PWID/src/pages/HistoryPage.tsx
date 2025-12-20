import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mic,
  Camera,
  FileText,
  Activity,
  Pill,
  User,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { format, formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { HistoryEvent } from '@/data/mockData';


const HistoryPage = () => {
  const { events, patients, caregiver } = useApp();
  const [searchParams] = useSearchParams();
  const patientIdFilter = searchParams.get('patientId');

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');

  const filteredEvents = useMemo(() => {
    let list = !patientIdFilter
      ? events
      : events.filter(e => e.patientId === patientIdFilter);

    // Filter by type
    if (typeFilter !== 'all') {
      list = list.filter(e => e.type === typeFilter);
    }

    // Filter by date
    const now = new Date();
    if (dateFilter === '24hours') {
      list = list.filter(e => isAfter(new Date(e.timestamp), subDays(now, 1)));
    } else if (dateFilter === '7days') {
      list = list.filter(e => isAfter(new Date(e.timestamp), subDays(now, 7)));
    } else if (dateFilter === '30days') {
      list = list.filter(e => isAfter(new Date(e.timestamp), subDays(now, 30)));
    }

    // Sort by newest first
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, patientIdFilter, typeFilter, dateFilter]);

  // Analytics for full history (coordinators)
  const analytics = useMemo(() => {
    if (patientIdFilter) return null;

    const incidentCount = filteredEvents.filter(e => e.type === 'incident').length;
    const voiceCount = filteredEvents.filter(e => e.type === 'voice').length;
    const vitalsCount = filteredEvents.filter(e => e.type === 'vitals').length;

    return {
      totalEvents: filteredEvents.length,
      incidents: incidentCount,
      voiceNotes: voiceCount,
      vitalChecks: vitalsCount
    };
  }, [filteredEvents, patientIdFilter]);

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

  const handleExport = () => {
    if (filteredEvents.length === 0) return;

    // CSV Header
    const headers = ['Date', 'Time', 'Patient', 'Type', 'Title', 'Description', 'Caregiver'];
    const rows = filteredEvents.map(e => {
      const d = new Date(e.timestamp);
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        `"${getPatientName(e.patientId)}"`,
        e.type,
        `"${e.title}"`,
        `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
        `"${e.caregiverName}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `history_export_${patientIdFilter || 'all'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Analytics Cards (for full history / coordinators only) */}
        {!patientIdFilter && analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalEvents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-urgent" />
                  <div className="text-2xl font-bold">{analytics.incidents}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Voice Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-info" />
                  <div className="text-2xl font-bold">{analytics.voiceNotes}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vitals Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-success" />
                  <div className="text-2xl font-bold">{analytics.vitalChecks}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header with filters */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {patientIdFilter ? `History: ${getPatientName(patientIdFilter)}` : 'Full History'}
            </h1>
            <p className="text-muted-foreground">
              {patientIdFilter ? 'Events recorded for this resident' : 'All recorded events across patients'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {filteredEvents.length} events
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredEvents.length === 0} className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="voice">Voice Notes</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="vitals">Vitals</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
                <SelectItem value="incident">Incidents</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 hours</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== 'all' || dateFilter !== '7days') && (
            <Button variant="ghost" size="sm" onClick={() => { setTypeFilter('all'); setDateFilter('7days'); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Events list */}

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No history events recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredEvents.map((event, index) => (
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

                      {event.imageUrl && (
                        <div className="mt-2">
                          <img src={event.imageUrl} alt="Event related" className="max-w-xs rounded-lg border border-border" />
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
