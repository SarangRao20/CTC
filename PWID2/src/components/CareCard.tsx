import React, { useState, useRef, useMemo } from 'react';
import { Patient } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Clock, FileText, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceInputButton from './VoiceInputButton';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ObservationResultModal from './ObservationResultModal';
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
    const [isUploading, setIsUploading] = useState(false);
    const [observationResult, setObservationResult] = useState(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.status === 201) {
                // Log event for the upload
                addEvent({
                    patientId: patient.id,
                    type: 'image', // Assuming image for now, logic can check file.type
                    title: 'File Uploaded',
                    description: `Uploaded: ${file.name}`,
                    imageUrl: res.data.url
                });

                toast({
                    title: "File Uploaded",
                    description: "File saved to patient history.",
                    variant: "default"
                });
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Upload Failed",
                description: "Could not upload file.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl group flex flex-col h-full">
                <div className="p-5 flex-1 flex flex-col">
                    {/* Header - Clickable for Progress */}
                    <div
                        className="flex items-start justify-between mb-4 cursor-pointer"
                        onClick={() => navigate(`/patient/${patient.id}`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="w-14 h-14 border-4 border-background shadow-sm">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}`} />
                                    <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${statusColor}`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{patient.name}</h3>
                                <p className="text-xs text-muted-foreground">Room {patient.roomNumber}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                            Age {patient.age}
                        </Badge>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        <div className="bg-secondary/40 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                            <Activity className="w-4 h-4 text-primary mb-1" />
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Vitals</span>
                            <span className="text-xs font-bold text-foreground">Normal</span>
                        </div>
                        <div className="bg-secondary/40 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                            <Clock className="w-4 h-4 text-primary mb-1" />
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Last Log</span>
                            <span className="text-xs font-bold text-foreground">{lastLogTime}</span>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <div className="relative">
                            <Textarea
                                placeholder={`Log for ${patient.name.split(' ')[0]}...`}
                                className="min-h-[80px] resize-none bg-secondary/20 border-secondary focus:bg-background pr-10 text-sm rounded-xl"
                                value={logText}
                                onChange={(e) => setLogText(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <VoiceInputButton onTranscription={handleVoiceTranscription} />

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="Upload File"
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
                                    title="View History"
                                >
                                    <FileText className="w-4 h-4" />
                                </Button>
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
                </div>
            </Card>

            <ObservationResultModal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                data={observationResult}
            />
        </>
    );
};

export default CareCard;
