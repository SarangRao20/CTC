import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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

    if (!patient) return <div className="p-10 text-center">{t('loading_report')}</div>;

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
                        <h1 className="text-2xl font-bold tracking-tight">CareConnect {t('report')}</h1>
                    </div>
                    <p className="text-slate-500 text-sm">{t('generated_on')} {format(new Date(), 'MMMM d, yyyy')}</p>
                    <p className="text-slate-500 text-sm">{t('caregiver')}: {caregiver?.name || t('unknown')}</p>
                    {caregiver?.ngo_name && <p className="text-slate-500 text-sm font-medium">{caregiver.ngo_name}</p>}
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold">{patient.name}</h2>
                    <p className="text-lg text-slate-600">{t('room')} {patient.roomNumber}</p>
                    <Badge variant="outline" className="mt-2 text-sm px-3 py-1 border-slate-300">
                        {patient.age} {t('years_old')} • {patient.supportLevel} {t('support')}
                    </Badge>
                </div>
            </div>

            {/* Vitals Summary */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">{t('avg_hr')}</p>
                    <p className="text-3xl font-bold flex items-center justify-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" />
                        {avgHR} <span className="text-sm font-normal text-slate-400">bpm</span>
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">{t('avg_temp')}</p>
                    <p className="text-3xl font-bold flex items-center justify-center gap-2">
                        <Thermometer className="w-5 h-5 text-blue-500" />
                        {avgTemp} <span className="text-sm font-normal text-slate-400">°F</span>
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">{t('total_logs')}</p>
                    <p className="text-3xl font-bold flex items-center justify-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        {events.length}
                    </p>
                </div>
            </div>

            {/* Medical Info */}
            <div className="mb-8">
                <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> {t('medical_context')}
                </h3>
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <p className="font-semibold text-slate-600 mb-1">{t('diagnosis')}</p>
                        <p>{patient.primaryDiagnosis}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-600 mb-1">{t('allergies')}</p>
                        <p>{patient.allergies.length ? patient.allergies.join(', ') : t('none')}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="font-semibold text-slate-600 mb-1">{t('current_medications')}</p>
                        <div className="flex flex-wrap gap-2">
                            {patient.medications.length
                                ? patient.medications.map(m => <span key={m} className="px-2 py-1 bg-slate-100 rounded border border-slate-200">{m}</span>)
                                : t('none')
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Logs Table */}
            <div>
                <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4">{t('recent_logs_history')}</h3>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                            <th className="p-3 rounded-tl-lg">{t('date_time')}</th>
                            <th className="p-3">{t('type')}</th>
                            <th className="p-3">{t('details')}</th>
                            <th className="p-3 rounded-tr-lg">{t('caregiver')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {events.map((e) => (
                            <tr key={e.id}>
                                <td className="p-3 w-40">{format(new Date(e.timestamp), 'MMM d, h:mm a')}</td>
                                <td className="p-3 w-32 capitalize font-medium">{t(e.type) || e.type}</td>
                                <td className="p-3">
                                    <p className="font-medium">{e.title}</p>
                                    <p className="text-slate-500">{e.voiceTranscription || e.description}</p>
                                    {e.vitals && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            {Object.entries(e.vitals).map(([k, v]) => `${t(k)}: ${v}`).join(', ')}
                                        </div>
                                    )}
                                </td>
                                <td className="p-3">{e.caregiverName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {events.length === 0 && <p className="text-center p-8 text-slate-500">{t('no_logs_found')}</p>}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
                {t('report_footer')}
            </div>
        </div>
    );
};

export default ReportPage;
