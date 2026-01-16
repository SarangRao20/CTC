import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Utensils, Moon, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Log {
    id: number;
    mood: string;
    sleep_quality: string;
    meals: string;
    incident: string;
    medication_given: string;
    activity_done: string;
    notes: string;
    created_at: string;
}

interface TodaysStatusProps {
    logs: Log[];
    patientName: string;
}

const TodaysStatus: React.FC<TodaysStatusProps> = ({ logs, patientName }) => {
    const { t } = useTranslation();
    // Get latest log for today
    const todayLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        const today = new Date();
        return logDate.getDate() === today.getDate() &&
            logDate.getMonth() === today.getMonth() &&
            logDate.getFullYear() === today.getFullYear();
    });

    const latestLog = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : null;

    // Helper to determine status color and icon
    const getStatus = (type: 'mood' | 'sleep' | 'meals', value: string) => {
        const config: any = {
            mood: {
                good: ['Happy', 'Calm'],
                bad: ['Anxious', 'Aggressive', 'Irritable', 'Depressed'],
                icon: Activity
            },
            sleep: {
                good: ['Good'],
                bad: ['Poor', 'Disturbed'],
                icon: Moon
            },
            meals: {
                good: ['Normal'],
                bad: ['Reduced', 'Skipped'],
                icon: Utensils
            }
        };

        const isGood = config[type].good.includes(value);
        const isBad = config[type].bad.includes(value);

        return {
            color: isGood ? 'bg-success/10 text-success border-success/20' : isBad ? 'bg-urgent/10 text-urgent border-urgent/20' : 'bg-secondary text-secondary-foreground',
            dot: isGood ? 'bg-success' : isBad ? 'bg-urgent' : 'bg-secondary-foreground',
            label: value ? t(value.toLowerCase()) : t('not_recorded')
        };
    };

    if (!latestLog) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Clock className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
                    <h3 className="font-semibold text-lg">{t('no_logs_today')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{t('start_routine_check_desc', { name: patientName })}</p>
                </CardContent>
            </Card>
        );
    }

    const moodStatus = getStatus('mood', latestLog.mood);
    const sleepStatus = getStatus('sleep', latestLog.sleep_quality);
    const mealStatus = getStatus('meals', latestLog.meals);

    // AI-driven simple suggestion
    const getSuggestion = () => {
        if (latestLog.mood === 'Anxious' || latestLog.sleep_quality === 'Poor')
            return t('suggestion_calm');
        if (latestLog.meals === 'Skipped')
            return t('suggestion_appetite');
        if (latestLog.incident !== 'None' && latestLog.incident !== 'no')
            return t('suggestion_incident');
        return t('suggestion_stable');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                {t('todays_status')} <span className="text-sm font-normal text-muted-foreground">({format(new Date(), 'EEEE, MMM d')})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mood Card */}
                <Card className={`border ${moodStatus.color}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4" /> {t('mood')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${moodStatus.dot}`} />
                            <span className="text-lg font-bold">{moodStatus.label}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Sleep Card */}
                <Card className={`border ${sleepStatus.color}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Moon className="w-4 h-4" /> {t('sleep')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${sleepStatus.dot}`} />
                            <span className="text-lg font-bold">{sleepStatus.label}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Meals Card */}
                <Card className={`border ${mealStatus.color}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Utensils className="w-4 h-4" /> {t('meals')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${mealStatus.dot}`} />
                            <span className="text-lg font-bold">{mealStatus.label}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Suggestion Card */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex gap-4 items-start">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary mb-1">{t('suggested_attention')}</h4>
                        <p className="text-sm text-foreground/90 font-medium">
                            "{getSuggestion()}"
                        </p>
                    </div>
                </CardContent>
            </Card>


        </div>
    );
};

export default TodaysStatus;
