import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Activity, HelpCircle } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ObservationResult {
    structured_observation: {
        mood: string;
        sleep: string;
        meals: string;
        incident: string;
        notes: string;
        confidence: string;
        explanation: string;
    };
    risk: {
        risk_level: string;
        risk_score: number;
        reason: string;
    };
    log_id: number;
}

interface ObservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ObservationResult | null;
}

const ObservationResultModal: React.FC<ObservationModalProps> = ({ isOpen, onClose, data }) => {
    const { toast } = useToast();
    const [localData, setLocalData] = useState<ObservationResult | null>(null);

    // Sync prop data to local state for updates
    React.useEffect(() => {
        setLocalData(data);
    }, [data]);

    if (!isOpen || !localData) return null;

    const { structured_observation: obs, risk, log_id } = localData;
    const isHighRisk = risk.risk_level === 'High';
    const isMediumRisk = risk.risk_level === 'Medium';

    const handleUpdateField = async (field: string, value: string) => {
        try {
            await api.patch(`/logs/${log_id}`, { [field]: value });

            setLocalData(prev => prev ? ({
                ...prev,
                structured_observation: {
                    ...prev.structured_observation,
                    [field]: value
                }
            }) : null);

            toast({ title: "Updated", description: `${field} updated to ${value}` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update log", variant: "destructive" });
        }
    };

    const renderMissingPrompt = (field: 'mood' | 'sleep' | 'meals', currentValue: string) => {
        if (currentValue !== 'Unknown') return null;

        const options = {
            mood: ['Happy', 'Calm', 'Sad', 'Anxious'],
            sleep: ['Good', 'Poor', 'Disturbed'],
            meals: ['Normal', 'Skipped', 'Reduced']
        };

        return (
            <div className="mt-2 p-3 bg-warning-light/20 border border-warning/30 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-warning-dark">How was {field}?</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {options[field].map(opt => (
                        <Button
                            key={opt}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-background hover:bg-primary hover:text-primary-foreground"
                            onClick={() => handleUpdateField(field, opt)}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-background rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in text-left border border-border overflow-y-auto max-h-[90vh]" role="dialog" aria-modal="true">

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isHighRisk ? (
                                <div className="w-12 h-12 rounded-full bg-urgent-light flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-urgent" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-success" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Observation Logged</h2>
                                <p className="text-sm text-muted-foreground">Successfully analyzed and saved</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 py-2">
                        {/* Risk Status */}
                        <div className={`p-4 rounded-xl border ${isHighRisk ? 'bg-urgent-light/20 border-urgent/20' :
                            isMediumRisk ? 'bg-warning-light/20 border-warning/20' :
                                'bg-secondary/50 border-border'
                            }`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-sm">Risk Assessment</span>
                                <Badge variant={isHighRisk ? 'urgent' : isMediumRisk ? 'needs-attention' : 'stable'}>
                                    {risk.risk_level} Risk
                                </Badge>
                            </div>
                            <p className="text-sm opacity-90">{risk.reason}</p>
                        </div>

                        {/* Extracted Details & Prompts */}
                        <div className="grid grid-cols-1 gap-3">
                            {/* Mood */}
                            <div className="p-3 bg-secondary/30 rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Mood</span>
                                    <span className="font-medium text-sm">{obs.mood}</span>
                                </div>
                                {renderMissingPrompt('mood', obs.mood)}
                            </div>

                            {/* Sleep */}
                            <div className="p-3 bg-secondary/30 rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Sleep</span>
                                    <span className="font-medium text-sm">{obs.sleep}</span>
                                </div>
                                {renderMissingPrompt('sleep', obs.sleep)}
                            </div>

                            {/* Meals */}
                            <div className="p-3 bg-secondary/30 rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Meals</span>
                                    <span className="font-medium text-sm">{obs.meals}</span>
                                </div>
                                {renderMissingPrompt('meals', obs.meals)}
                            </div>

                            {/* Incident - usually not prompted unless flagged, but we display it */}
                            <div className="p-3 bg-secondary/30 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Incident</span>
                                <p className="font-medium text-sm">{obs.incident}</p>
                            </div>
                        </div>

                        {/* Explanation */}
                        {obs.explanation && (
                            <div className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg italic">
                                "{obs.explanation}"
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={onClose} className="w-full" size="lg">
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ObservationResultModal;
