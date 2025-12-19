import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import {
    Heart,
    Activity,
    Thermometer,
    TrendingUp,
    FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ReportPage = () => {
    const { patientId } = useParams();
    const { patients, getPatientEvents, caregiver } = useApp();

    // Find patient
    const patient = patients.find(p => p.id === patientId || String(p.id) === patientId);
    const events = patient ? getPatientEvents(patient.id) : [];

    // Trigger print dialog on load
    useEffect(() => {
        if (patient) {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [patient]);

    if (!patient) return <div className="p-10 text-center">Loading Report or Patient Not Found...</div>;

    const vitalsEvents = events.filter(e => e.type === 'vitals');

    // Calculate Averages
    const avgHR = vitalsEvents.length
        ? Math.round(vitalsEvents.reduce((acc, curr) => acc + (curr.vitals?.heartRate || 0), 0) / vitalsEvents.length)
        : '--';
    const avgTemp = vitalsEvents.length
        ? (vitalsEvents.reduce((acc, curr) => acc + (curr.vitals?.temperature || 0), 0) / vitalsEvents.length).toFixed(1)
        : '--';

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
            {/* Header / Letterhead */}
            <div className="border-b-2 border-slate-200 pb-6 mb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-6 h-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">CareConnect Report</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Generated on {format(new Date(), 'MMMM d, yyyy')}</p>
                    <p className="text-slate-500 text-sm">Caregiver: {caregiver?.name || 'Unknown'}</p>
                    {caregiver?.ngo_name && <p className="text-slate-500 text-sm font-medium">{caregiver.ngo_name}</p>}
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold">{patient.name}</h2>
                    <p className="text-lg text-slate-600">Room {patient.roomNumber}</p>
                    <Badge variant="outline" className="mt-2 text-sm px-3 py-1 border-slate-300">
                        {patient.age} Years Old • {patient.supportLevel} Support
                    </Badge>
                </div>
            </div>

            {/* Vitals Summary */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Heart Rate (Avg)</p>
                    <p className="text-3xl font-bold flex items-center justify-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" />
                        {avgHR} <span className="text-sm font-normal text-slate-400">bpm</span>
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Temperature (Avg)</p>
                    <p className="text-3xl font-bold flex items-center justify-center gap-2">
                        <Thermometer className="w-5 h-5 text-blue-500" />
                        {avgTemp} <span className="text-sm font-normal text-slate-400">°F</span>
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Total Logs</p>
                    <p className="text-3xl font-bold flex items-center justify-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        {events.length}
                    </p>
                </div>
            </div>

            {/* Medical Info */}
            <div className="mb-8">
                <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Medical Context
                </h3>
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <p className="font-semibold text-slate-600 mb-1">Diagnosis</p>
                        <p>{patient.primaryDiagnosis}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-600 mb-1">Allergies</p>
                        <p>{patient.allergies.length ? patient.allergies.join(', ') : 'None'}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="font-semibold text-slate-600 mb-1">Current Medications</p>
                        <div className="flex flex-wrap gap-2">
                            {patient.medications.length
                                ? patient.medications.map(m => <span key={m} className="px-2 py-1 bg-slate-100 rounded border border-slate-200">{m}</span>)
                                : 'None'
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Logs Table */}
            <div>
                <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4">Recent Logs History</h3>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                            <th className="p-3 rounded-tl-lg">Date/Time</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Details</th>
                            <th className="p-3 rounded-tr-lg">Caregiver</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {events.map((e) => (
                            <tr key={e.id}>
                                <td className="p-3 w-40">{format(new Date(e.timestamp), 'MMM d, h:mm a')}</td>
                                <td className="p-3 w-32 capitalize font-medium">{e.type.replace('-', ' ')}</td>
                                <td className="p-3">
                                    <p className="font-medium">{e.title}</p>
                                    <p className="text-slate-500">{e.voiceTranscription || e.description}</p>
                                    {e.vitals && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            {Object.entries(e.vitals).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                        </div>
                                    )}
                                </td>
                                <td className="p-3">{e.caregiverName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {events.length === 0 && <p className="text-center p-8 text-slate-500">No logs found for this period.</p>}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
                Generated by CareConnect. Confidential Patient Information.
            </div>
        </div>
    );
};

export default ReportPage;
