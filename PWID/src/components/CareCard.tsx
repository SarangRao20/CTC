import React, { useState } from 'react';
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

const CareCard: React.FC<CareCardProps> = ({ patient, onViewProgress }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { addEvent, getPatientEvents } = useApp();
    const [logText, setLogText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [observationResult, setObservationResult] = useState(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

    // Helper to determine status color
    const statusColor = patient.status === 'stable' ? 'bg-success' :
        patient.status === 'needs-attention' ? 'bg-warning' : 'bg-urgent';

    // Dynamic Last Log Logic
    // We use useApp's events to find the latest for this patient
    const patientEvents = getPatientEvents(patient.id);
    const lastEvent = patientEvents.length > 0
        ? patientEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;

    const lastLogTime = lastEvent
        ? formatDistanceToNow(new Date(lastEvent.timestamp), { addSuffix: true })
        : "No logs yet";


    const handleVoiceTranscription = (text: string) => {
        setLogText(prev => prev ? `${prev} ${text}` : text);
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

                // Add to context immediately for history update
                addEvent({
                    patientId: patient.id,
                    type: 'note', // Default type, can be refined based on AI result
                    title: 'Observation Logged',
                    description: logText,
                    // AI result could be merged here if we parsed it
                    // For now, raw text is fine
                });

                setIsResultModalOpen(true);
                setLogText(''); // Clear input
                toast({
                    title: "Observation Logged",
                    description: "AI analysis complete.",
                    variant: "default"
                });
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to log observation.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
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
                        </div>

                        {/* Risk & Last Check-in */}
                        <div className="flex items-center gap-2 mb-4">
                            <Badge
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${patient.status === 'stable' ? 'bg-success/15 text-success hover:bg-success/25' :
                                    patient.status === 'needs-attention' ? 'bg-warning/15 text-warning hover:bg-warning/25' :
                                        'bg-urgent/15 text-urgent hover:bg-urgent/25'
                                    }`}
                                variant="outline"
                            >
                                {patient.status === 'stable' ? 'Stable' : patient.status === 'needs-attention' ? 'Needs' : 'Urgent'}
                            </Badge>
                            <div className="flex items-center text-[10px] text-muted-foreground">
                                <Clock className="w-2.5 h-2.5 mr-1" />
                                {lastLogTime}
                            </div>
                        </div>
                    </div>

                    {/* Input Section: Voice Only focused */}
                    <div className="mt-auto">
                        {logText && (
                            <div className="mb-2 p-2 bg-secondary/20 rounded-lg text-xs italic text-muted-foreground relative">
                                "{logText}"
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border shadow-sm hover:text-destructive"
                                    onClick={() => setLogText('')}
                                >
                                    <span className="sr-only">Clear</span>
                                    &times;
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <div className="flex gap-1 items-center">
                                <VoiceInputButton onTranscription={handleVoiceTranscription} />

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
                                    className="rounded-lg px-3 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 ml-auto"
                                    onClick={handleLogSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <ObservationResultModal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                data={observationResult}
            />

            <AddTaskModal
                isOpen={isAddTaskOpen}
                onClose={() => setIsAddTaskOpen(false)}
                patientId={patient.id}
                patientName={patient.name}
            />
        </>
    );
};

export default CareCard;
