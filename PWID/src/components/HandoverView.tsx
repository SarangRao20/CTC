import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api'; // Use configured API
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const HandoverView = () => {
    const { shiftId } = useParams();
    const { toast } = useToast();
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummaries = async () => {
            try {
                const res = await api.get(`/shifts/handover/${shiftId}`);
                setSummaries(res.data);
            } catch (error) {
                console.error(error);
                toast({
                    title: "Error fetching handover data",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSummaries();
    }, [shiftId]);

    if (loading) return <div>Loading handover data...</div>;

    if (summaries.length === 0) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">No Handover Summary Generated Yet</h2>
                <p className="text-muted-foreground">The shift might still be active or no data was recorded.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Shift Handover Summary</h1>
            <div className="grid gap-6 md:grid-cols-2">
                {summaries.map((summary) => (
                    <Card key={summary.id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                <span>PWID ID: {summary.pwid_id}</span> {/* Ideally fetch Name */}
                                <Badge variant={summary.content.risk_level === 'High' ? 'destructive' : 'outline'}>
                                    Risk: {summary.content.risk_level}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm">Sleep & Meals</h4>
                                <div className="text-sm">
                                    Sleep: {summary.content.sleep_quality}, Meals: {summary.content.meals_summary}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold text-sm">Mood Trend</h4>
                                <div className="text-sm text-muted-foreground">
                                    {summary.content.mood_trend.join(' → ') || 'No mood data'}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold text-sm">Incidents</h4>
                                {summary.content.incidents.length > 0 ? (
                                    <ul className="list-disc pl-4 text-sm text-red-500">
                                        {summary.content.incidents.map((inc, i) => <li key={i}>{inc}</li>)}
                                    </ul>
                                ) : (
                                    <span className="text-sm text-green-600">None reported</span>
                                )}
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold text-sm">Pending Tasks</h4>
                                {summary.content.pending_tasks.length > 0 ? (
                                    <ul className="list-disc pl-4 text-sm">
                                        {summary.content.pending_tasks.map((t, i) => <li key={i}>{t}</li>)}
                                    </ul>
                                ) : (
                                    <span className="text-sm text-green-600">All caught up</span>
                                )}
                            </div>
                            {summary.content.risk_justification && (
                                <div className="bg-muted p-2 rounded text-xs mt-2">
                                    risk note: {summary.content.risk_justification}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default HandoverView;
