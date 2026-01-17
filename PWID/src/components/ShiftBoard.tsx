import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import api from '@/services/api';
import { format, addDays } from 'date-fns';
import EmergencyModal from './EmergencyModal';

const ShiftBoard = () => {
    const { toast } = useToast();
    const [shifts, setShifts] = useState([]);
    const [caretakers, setCaretakers] = useState([]);
    const [pwids, setPwids] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // New Shift Form State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newShift, setNewShift] = useState({
        caregiver_id: '',
        type: 'Morning',
        start_time: '08:00',
        end_time: '16:00'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [shiftsRes, caretakersRes, pwidsRes] = await Promise.all([
                api.get('/shifts/all'),
                api.get('/caretakers'),
                api.get('/pwids')
            ]);
            setShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
            setCaretakers(Array.isArray(caretakersRes.data) ? caretakersRes.data : []);
            setPwids(Array.isArray(pwidsRes.data) ? pwidsRes.data : []);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load shift data. Please refresh the page."
            });
            // Ensure arrays are initialized even on error
            setShifts([]);
            setCaretakers([]);
            setPwids([]);
        }
    };

    const handleCreateShift = async () => {
        try {
            // Construct datetime strings
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const start = `${dateStr}T${newShift.start_time}:00`;
            const end = `${dateStr}T${newShift.end_time}:00`;

            await api.post('/shifts/create', {
                caregiver_id: newShift.caregiver_id,
                type: newShift.type,
                start_time: start,
                end_time: end
            });

            toast({ title: "Shift Created", description: "New shift has been scheduled." });
            setIsCreateOpen(false);
            fetchData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to create shift"
            });
        }
    };

    const getShiftsForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return shifts.filter(s => s.start_time.startsWith(dateStr));
    };

    const getCaregiverName = (id) => {
        const c = caretakers.find(c => c.id === id);
        return c ? c.name : 'Unknown';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Shift Board</h2>
                <div className="flex gap-2">
                    <Input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="w-auto"
                    />
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>+ New Shift</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Schedule Shift</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Caregiver</label>
                                    <Select
                                        name="caregiver"
                                        onValueChange={(val) => setNewShift({ ...newShift, caregiver_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Caregiver" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {caretakers.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Type</label>
                                        <Select
                                            defaultValue="Morning"
                                            onValueChange={(val) => setNewShift({ ...newShift, type: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Morning">Morning</SelectItem>
                                                <SelectItem value="Evening">Evening</SelectItem>
                                                <SelectItem value="Night">Night</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Times</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="time"
                                                value={newShift.start_time}
                                                onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                                            />
                                            <Input
                                                type="time"
                                                value={newShift.end_time}
                                                onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={handleCreateShift} className="w-full">Schedule</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                {Array.isArray(caretakers) && caretakers.map(caregiver => {
                    const shiftsToday = getShiftsForDate(selectedDate).filter(s => s.caregiver_id === caregiver.id);
                    if (shiftsToday.length === 0) return null;

                    return (
                        <Card key={caregiver.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50 p-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">{caregiver.name}</CardTitle>
                                    <span className="text-sm text-muted-foreground">{caregiver.role}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    {shiftsToday.map(shift => (
                                        <div key={shift.id} className="flex-1 border rounded-lg p-3 bg-card shadow-sm">
                                            <div className="flex justify-between mb-2">
                                                <Badge variant={shift.status === 'Active' ? 'default' : 'secondary'}>
                                                    {shift.type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium mb-2">
                                                Assigned PWIDs ({shift.assigned_pwids.length})
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {shift.assigned_pwids.map(pid => {
                                                    const p = pwids.find(p => p.id === pid);
                                                    return (
                                                        <Badge key={pid} variant="outline" className="text-xs">
                                                            {p ? p.name : pid}
                                                        </Badge>
                                                    );
                                                })}
                                                {shift.assigned_pwids.length === 0 && (
                                                    <span className="text-xs text-red-500 italic">No assignments</span>
                                                )}
                                            </div>
                                            {/* Button to assign PWIDs could go here */}
                                            <div className="mt-2 flex justify-end gap-2">
                                                {shift.status === 'Active' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={async () => {
                                                                try {
                                                                    await api.post('/shifts/end', { shift_id: shift.id });
                                                                    toast({ title: "Shift Ended", description: "Handover summary generated." });
                                                                    fetchData();
                                                                } catch (e) {
                                                                    toast({ title: "Error", description: "Failed to end shift", variant: "destructive" });
                                                                }
                                                            }}
                                                        >
                                                            End Shift
                                                        </Button>
                                                        <EmergencyModal
                                                            shiftId={shift.id}
                                                            caretakers={caretakers.filter(c => c.id !== caregiver.id)}
                                                            onSuccess={fetchData}
                                                        />
                                                    </>
                                                )}
                                                {shift.status === 'Completed' && (
                                                    <Button variant="secondary" size="sm" onClick={() => window.location.href = `/shifts/handover-view/${shift.id}`}>
                                                        View Handover
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {getShiftsForDate(selectedDate).length === 0 && (
                    <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        No shifts scheduled for this date.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShiftBoard;
