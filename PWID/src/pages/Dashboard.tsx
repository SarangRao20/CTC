import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import CareCard from '@/components/CareCard';
import ProgressModal from '@/components/ProgressModal';
import DashboardStats from '@/components/DashboardStats';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { Patient } from '@/data/mockData';
import UserGuide from '@/components/UserGuide';

type AgeFilter = 'all' | 'children' | 'adolescents' | 'adults';
type SupportFilter = 'all' | 'high' | 'medium' | 'low';

const Dashboard = () => {
  const { patients, caregiver } = useApp();
  const navigate = useNavigate();

  // Redirect Parents to their specific dashboard if they somehow land here
  React.useEffect(() => {
    if (caregiver?.role === 'Parent') {
      navigate('/parent/dashboard');
    }
  }, [caregiver, navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [progressPatient, setProgressPatient] = useState<Patient | null>(null);

  // Filters state
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [supportFilter, setSupportFilter] = useState<SupportFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getAgeGroup = (age: number): AgeFilter => {
    if (age >= 5 && age <= 12) return 'children';
    if (age >= 13 && age <= 18) return 'adolescents';
    if (age > 18) return 'adults';
    return 'all';
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        searchQuery === '' ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const ageGroup = getAgeGroup(patient.age);
      const matchesAge = ageFilter === 'all' || ageGroup === ageFilter;

      const matchesSupport =
        supportFilter === 'all' ||
        (supportFilter === 'high' && patient.supportLevel === 'high-support') ||
        (supportFilter === 'medium' && patient.supportLevel === 'medium-support') ||
        (supportFilter === 'low' && patient.supportLevel === 'low-support');

      return matchesSearch && matchesAge && matchesSupport;
    }).sort((a, b) => {
      const priority = { 'urgent': 0, 'needs-attention': 1, 'stable': 2 };
      return (priority[a.status] ?? 2) - (priority[b.status] ?? 2);
    });
  }, [patients, searchQuery, ageFilter, supportFilter]);

  const ageFilters: { value: AgeFilter; label: string }[] = [
    { value: 'all', label: 'All Ages' },
    { value: 'children', label: 'Children (5–12)' },
    { value: 'adolescents', label: 'Adolescents (13–18)' },
    { value: 'adults', label: 'Adults (18+)' },
  ];

  const supportFilters: { value: SupportFilter; label: string }[] = [
    { value: 'all', label: 'All Support' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-welcome">
      <UserGuide />
      {/* Dashboard Stats */}
      <div id="tour-stats">
        <DashboardStats />
      </div>


      {/* Dashboard Header */}
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-start gap-4">
        <div className="flex flex-col items-start gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 md:w-64" id="tour-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search residents..."
                className="pl-9 w-full bg-card border-none shadow-sm rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="icon"
              className="rounded-xl border-none shadow-sm bg-card shrink-0"
              onClick={() => setShowFilters(!showFilters)}
              id="tour-filters"
            >
              <Filter className={`w-4 h-4 ${showFilters ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card p-4 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Age Group</span>
            <div className="flex flex-wrap gap-2">
              {ageFilters.map(f => (
                <Button
                  key={f.value}
                  variant={ageFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setAgeFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Support Level</span>
            <div className="flex flex-wrap gap-2">
              {supportFilters.map(f => (
                <Button
                  key={f.value}
                  variant={supportFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setSupportFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Care Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4" id="tour-care-cards">
        {filteredPatients.map(patient => (
          <CareCard
            key={patient.id}
            patient={patient}
            onViewProgress={() => setProgressPatient(patient)}
          />
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No residents found matching your criteria.</p>
          <Button variant="link" onClick={() => {
            setSearchQuery('');
            setAgeFilter('all');
            setSupportFilter('all');
          }}>Clear all filters</Button>
        </div>
      )}

      {/* Progress Modal */}
      {progressPatient && (
        <ProgressModal
          patient={progressPatient}
          isOpen={!!progressPatient}
          onClose={() => setProgressPatient(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
