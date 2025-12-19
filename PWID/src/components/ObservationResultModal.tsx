import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

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
    if (!isOpen || !data) return null;

    const { structured_observation: obs, risk } = data;
    const isHighRisk = risk.risk_level === 'High';
    const isMediumRisk = risk.risk_level === 'Medium';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-background rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in text-left border border-border" role="dialog" aria-modal="true">

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

                        {/* Extracted Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-secondary/30 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Mood</span>
                                <p className="font-medium text-sm">{obs.mood}</p>
                            </div>
                            <div className="p-3 bg-secondary/30 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Sleep</span>
                                <p className="font-medium text-sm">{obs.sleep}</p>
                            </div>
                            <div className="p-3 bg-secondary/30 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Meals</span>
                                <p className="font-medium text-sm">{obs.meals}</p>
                            </div>
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
