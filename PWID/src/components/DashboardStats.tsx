import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle, Clock, CheckCircle, Activity } from 'lucide-react';
import api from '@/services/api';
import { useApp } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardStats = () => {
    const { t } = useTranslation();
    const { caregiver } = useApp();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!caregiver?.ngo_name) return;

            try {
                const response = await api.get(`/dashboard/stats?ngo=${caregiver.ngo_name}`);
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [caregiver]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-24 sm:h-28" />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        {
            title: t('assigned_patients'),
            value: stats.totalPatients || 0,
            icon: Users,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: t('alerts'),
            value: stats.urgentAlerts || 0,
            icon: AlertTriangle,
            color: 'text-urgent',
            bgColor: 'bg-urgent/10',
        },
        {
            title: t('overdue_tasks'),
            value: stats.overdueTasks || 0,
            icon: Clock,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            title: t('completed_today'),
            value: stats.completedToday || 0,
            icon: CheckCircle,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
    ];

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3 sm:p-4 md:p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">{stat.title}</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                                </div>
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>


        </>
    );
};

export default DashboardStats;
