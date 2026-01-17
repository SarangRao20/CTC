import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from '@/services/api';

interface EmergencyModalProps {
    shiftId: number;
    caretakers: any[];
    onSuccess: () => void;
}

const EmergencyModal = ({ shiftId, caretakers, onSuccess }: EmergencyModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [replacementId, setReplacementId] = useState('');
    const [reason, setReason] = useState('');

    const handleReplace = async () => {
        try {
            await api.post('/shifts/emergency_replace', {
                shift_id: shiftId,
                new_caregiver_id: replacementId,
                reason: reason
            });
            toast({ title: "Emergency Replacement Executed", description: "Shift transferred successfully." });
            setIsOpen(false);
            onSuccess();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed",
                description: "Could not replace caregiver."
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Emergency Replace</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Emergency Protocol</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Caregiver</label>
                        <Select onValueChange={setReplacementId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Replacement" />
                            </SelectTrigger>
                            <SelectContent>
                                {caretakers.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reason</label>
                        <Textarea
                            placeholder="Why is this replacement happening?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReplace}>Confirm Replacement</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EmergencyModal;
