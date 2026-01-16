import React, { useMemo, useState } from 'react';
import {
  Building2,
  CalendarRange,
  AlertTriangle,
  Users,
  Activity,
  HeartPulse,
  ClipboardList,
  Bell,
  BarChart3,
  Clock3,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'caregivers', label: 'Caregivers', icon: Users },
  { key: 'pwids', label: 'PWIDs', icon: HeartPulse },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'shifts', label: 'Shifts', icon: Clock3 },
  { key: 'tasks', label: 'Tasks & Events', icon: ClipboardList },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
];

const NGODashboard: React.FC = () => {
  const { patients, tasks, caregiver } = useApp();
  const safeCaregiver = caregiver ?? { name: 'Caregiver', ngo_name: 'CareConnect NGO' };
  const ngoName = (safeCaregiver as any)?.ngo_name || (safeCaregiver as any)?.ngoName || 'CareConnect NGO';
  const [active, setActive] = useState<string>('overview');
  const [dateRange, setDateRange] = useState<string>('last7');

  const stats = useMemo(() => {
    const totalPwids = patients.length;
    const highSupport = patients.filter(p => p.supportLevel === 'high-support').length;
    const overdue = tasks.filter(t => t.status === 'overdue').length;
    const inProgress = tasks.filter(t => t.status === 'pending').length;
    return { totalPwids, highSupport, overdue, inProgress };
  }, [patients, tasks]);

  const taskList = useMemo(() => tasks.slice(0, 5), [tasks]);

  const riskChips = [
    { label: 'Overdue tasks', value: stats.overdue, tone: 'bg-urgent/15 text-urgent border border-urgent/20' },
    { label: 'High support PWIDs', value: stats.highSupport, tone: 'bg-warning/15 text-warning border border-warning/20' },
    { label: 'Pending tasks', value: stats.inProgress, tone: 'bg-info/15 text-info border border-info/20' },
  ];

  const renderSection = () => {
    switch (active) {
      case 'caregivers':
        return (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Caregivers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">Assign caregivers by shift and monitor handoffs.</p>
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                  <div className="flex justify-between text-sm font-medium text-foreground">
                    <span>{safeCaregiver.name}</span>
                    <span className="text-muted-foreground">Lead</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Primary coordinator on duty.</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                  <div className="flex justify-between text-sm font-medium text-foreground">
                    <span>Relief coverage</span>
                    <span className="text-muted-foreground">Shifts</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Add backup caregivers for nights and weekends.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'pwids':
        return (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HeartPulse className="w-4 h-4" /> PWIDs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">Track residents by support level and flag critical cases.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <p className="text-sm font-semibold">High support</p>
                  <p className="text-2xl font-bold text-warning">{stats.highSupport}</p>
                  <p className="text-xs text-muted-foreground">Requires daily check-ins</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <p className="text-sm font-semibold">Total PWIDs</p>
                  <p className="text-2xl font-bold">{stats.totalPwids}</p>
                  <p className="text-xs text-muted-foreground">Across all centers</p>
                </div>
              </div>
              <ScrollArea className="h-48 rounded-lg border border-border bg-secondary/60 p-3">
                <div className="space-y-2">
                  {patients.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-card rounded-lg p-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Room {p.roomNumber}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{p.supportLevel.replace('-support',' support')}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      case 'analytics':
        return (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">Snapshot of operational health.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                  <p className="text-xs text-muted-foreground">Overdue tasks</p>
                  <p className="text-2xl font-bold text-urgent">{stats.overdue}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                  <p className="text-xs text-muted-foreground">In-progress</p>
                  <p className="text-2xl font-bold text-info">{stats.inProgress}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                  <p className="text-xs text-muted-foreground">High support</p>
                  <p className="text-2xl font-bold text-warning">{stats.highSupport}</p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground bg-card/70">
                Add charts here (e.g., completion trends, shift coverage heatmaps).
              </div>
            </CardContent>
          </Card>
        );
      case 'shifts':
        return (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> Shifts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">Upcoming shifts and handoffs.</p>
              <div className="space-y-2">
                {["Morning", "Afternoon", "Night"].map((label, idx) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border">
                    <div>
                      <p className="text-sm font-semibold">{label} shift</p>
                      <p className="text-xs text-muted-foreground">Coverage ready • Handoff checklist {idx === 0 ? 'complete' : 'pending'}</p>
                    </div>
                    <Badge variant="outline">{idx === 0 ? 'On duty' : 'Queued'}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      case 'tasks':
        return (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Tasks & Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">Recent operational tasks.</p>
              <div className="space-y-2">
                {taskList.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/60 border border-border">
                    <div>
                      <p className="text-sm font-semibold">{t.title}</p>
                      <p className="text-xs text-muted-foreground">Status: {t.status}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{t.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      case 'alerts':
        return (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.overdue === 0 ? (
                <p className="text-sm text-muted-foreground">No active alerts.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.filter(t => t.status === 'overdue').map(t => (
                    <div key={t.id} className="p-3 rounded-xl bg-urgent/10 border border-urgent/30 text-urgent">
                      <p className="text-sm font-semibold">{t.title}</p>
                      <p className="text-xs">Immediate attention needed.</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4" /> Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryTile label="Total PWIDs" value={stats.totalPwids} icon={<HeartPulse className="w-4 h-4 text-primary" />} />
                <SummaryTile label="High support" value={stats.highSupport} icon={<AlertTriangle className="w-4 h-4 text-warning" />} />
                <SummaryTile label="Overdue tasks" value={stats.overdue} icon={<Bell className="w-4 h-4 text-urgent" />} />
                <SummaryTile label="Pending" value={stats.inProgress} icon={<ClipboardList className="w-4 h-4 text-info" />} />
              </div>
              <div className="rounded-xl border border-border bg-card/80 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">NGO readiness</p>
                  <p className="text-xs text-muted-foreground">Keep shifts covered and resolve overdue tasks.</p>
                </div>
                <Button variant="outline" size="sm">View handoff plan</Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="bg-card/90 border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">NGO</p>
            <p className="text-base font-semibold">{ngoName}</p>
          </div>
        </div>
        <nav className="space-y-1" aria-label="NGO navigation">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActive(item.key)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="space-y-6">
        <div className="bg-card/90 border border-border rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Organization</p>
            <p className="text-lg font-semibold">{ngoName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <CalendarRange className="w-4 h-4" />
              Apply
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {riskChips.map(chip => (
              <span key={chip.label} className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${chip.tone}`}>
                <Activity className="w-3 h-3" />
                {chip.label}: {chip.value}
              </span>
            ))}
          </div>
        </div>

        {renderSection()}
      </section>
    </div>
  );
};

interface SummaryTileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

const SummaryTile: React.FC<SummaryTileProps> = ({ label, value, icon }) => (
  <div className="p-3 rounded-xl bg-secondary/60 border border-border flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default NGODashboard;
