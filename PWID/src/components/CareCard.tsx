import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Patient } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Send, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceInputButton from './VoiceInputButton';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ObservationResultModal from './ObservationResultModal';
import AddTaskModal from './AddTaskModal';
import { useApp } from '@/context/AppContext';
import { formatDistanceToNow } from 'date-fns';

interface CareCardProps {
    patient: Patient;
    onViewProgress: () => void;
}

const CareCard: React.FC<CareCardProps> = ({ patient }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { addEvent, getPatientEvents } = useApp();
    const [logText, setLogText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [observationResult, setObservationResult] = useState(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

    // Helper to determine status color
    const statusColor = patient.status === 'stable' ? 'bg-success' :
        patient.status === 'needs-attention' ? 'bg-warning' : 'bg-urgent';

    // Dynamic Last Log Logic
    const patientEvents = getPatientEvents(patient.id);
    const lastEvent = patientEvents.length > 0
        ? patientEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;

    const lastLogTime = lastEvent
        ? formatDistanceToNow(new Date(lastEvent.timestamp), { addSuffix: true })
        : t('no_logs');

    const handleVoiceTranscription = (text: string) => {
        // Simple heuristic: If text starts with "Task" or "Remind", treat as task
        const lowerText = text.toLowerCase().trim();
        if (lowerText.startsWith("task") || lowerText.startsWith("remind") || lowerText.startsWith("add task")) {
            // Mock Task Addition
            toast({
                title: "Voice Task Added",
                description: `Task created: "${text}"`,
                variant: "default"
            });
            // Clear log text in case it was partially set
            setLogText("");
        } else {
            // Standard Observation Log
            setLogText(prev => prev ? `${prev} ${text}` : text);
        }
    };

    const handleLogSubmit = async () => {
        if (!logText.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await api.post('/observe', {
                text: logText,
                pwid_id: patient.id,
                caregiver_id: 1 // Default
            });

            if (res.status === 201) {
                setObservationResult(res.data);
                addEvent({
                    patientId: patient.id,
                    type: 'note',
                    title: t('observation_logged'),
                    description: logText,
                });

                setIsResultModalOpen(true);
                setLogText('');
                toast({ title: t('observation_logged'), description: t('ai_analysis_complete'), variant: "default" });
            }
        } catch (err) {
            toast({ title: t('error'), description: t('failed_log_obs'), variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.status === 201) {
                addEvent({
                    patientId: patient.id,
                    type: 'image',
                    title: t('file_uploaded'),
                    description: `${t('uploaded')}: ${file.name}`,
                    imageUrl: res.data.url
                });
                toast({ title: t('file_uploaded'), description: t('file_saved'), variant: "default" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: t('upload_failed'), description: t('upload_failed_desc'), variant: "destructive" });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl group flex flex-col h-full">
                <div className="p-4 flex-1 flex flex-col justify-between">
                    {/* Header: Identity + Risk + Last Check-in */}
                    <div>
                        <div
                            className="flex items-start justify-between mb-3 cursor-pointer"
                            onClick={() => navigate(`/patient/${patient.id}`)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}`} />
                                        <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    {/* Mood/Status Dot from Avatar */}
                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${statusColor}`} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{patient.name}</h3>
                                    <p className="text-[10px] text-muted-foreground">Room {patient.roomNumber}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                title="View History"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/history?patientId=${patient.id}`);
                                }}
                            >
                                <History className="w-4 h-4" />
                            </Button>
                        </div>
                        <Badge variant="outline" className="rounded-full px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs">
                            {t('room')} {patient.roomNumber}
                        </Badge>
                    </div>

                    {/* Quick Stats and Add Task */}
                    <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4 md:mb-5">
                        <div className="bg-secondary/40 rounded-lg p-2 sm:p-2.5 flex flex-col items-center justify-center text-center">
                            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mb-0.5 sm:mb-1" />
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('vitals')}</span>
                            <span className="text-xs font-bold text-foreground">{t('normal')}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-auto rounded-lg p-2 sm:p-2.5 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 border-primary/20"
                            onClick={() => setIsAddTaskOpen(true)}
                        >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mb-0.5 sm:mb-1" />
                            <span className="text-[9px] sm:text-[10px] text-primary font-medium uppercase tracking-wide">{t('add_task')}</span>
                        </Button>
                    </div>

                    {/* Input Section: Voice Only focused */}
                    <div className="mt-auto">
                        {logText && (
                            <div className="mb-2 p-2 bg-secondary/20 rounded-lg text-xs italic text-muted-foreground relative">
                                "{logText}"
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title={t('file_upload')}
                                    onClick={handleFileClick}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                </Button>
                            </div>

                            <div className="ml-auto flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary"
                                    onClick={() => navigate(`/history?patientId=${patient.id}`)}
                                    title={t('view_history')}
                                >
                                    <FileText className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="Add Task"
                                    onClick={() => setIsAddTaskOpen(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {logText && (
                            <Button
                                size="sm"
                                className="rounded-lg px-4 shadow-none bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={handleLogSubmit}
                                disabled={!logText.trim() || isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                            </div>
                </div>
            </div>
        </div >
            </Card >

    <ObservationResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        data={observationResult}
    />
        </>
    );
};

export default CareCard;
