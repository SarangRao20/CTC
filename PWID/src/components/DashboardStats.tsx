import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle, Clock, CheckCircle, Activity } from 'lucide-react';
import api from '@/services/api';
import { useApp } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardStats = () => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-28" />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        {
            title: 'Assigned Patients',
            value: stats.totalPatients || 0,
            icon: Users,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'Urgent Alerts',
            value: stats.urgentAlerts || 0,
            icon: AlertTriangle,
            color: 'text-urgent',
            bgColor: 'bg-urgent/10',
        },
        {
            title: 'Overdue Tasks',
            value: stats.overdueTasks || 0,
            icon: Clock,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            title: 'Completed Today',
            value: stats.completedToday || 0,
            icon: CheckCircle,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
    ];

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Status */}
            <Card className="border-none shadow-sm mb-8">
                <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Quick Status</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-urgent mt-2" />
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {stats.urgentAlerts || 0} patients need immediate attention
                                </p>
                                <p className="text-xs text-muted-foreground">Based on pending tasks and recent incidents</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-warning mt-2" />
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {stats.pendingTasks || 0} routine tasks scheduled for today
                                </p>
                                <p className="text-xs text-muted-foreground">Medication, therapy, and care activities</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default DashboardStats;
