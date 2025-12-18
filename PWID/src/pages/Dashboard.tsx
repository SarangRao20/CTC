import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import PatientListRow from '@/components/PatientListRow';
import PatientDetailPane from '@/components/PatientDetailPane';
import ProgressModal from '@/components/ProgressModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import  { type Patient } from '@/data/mockData';
import { Search, Users, X } from 'lucide-react';
import api from "@/services/api";

type AgeFilter = 'all' | 'children' | 'adolescents' | 'adults';
type SupportFilter = 'all' | 'high' | 'medium' | 'low';

const Dashboard = () => {
  const { patients, selectedPatientId, selectPatient, getPatientTasks, getPatientEvents } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [supportFilter, setSupportFilter] = useState<SupportFilter>('all');
  const [progressPatient, setProgressPatient] = useState<Patient | null>(null);

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
        patient.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase());

      const ageGroup = getAgeGroup(patient.age);
      const matchesAge =
        ageFilter === 'all' || ageGroup === ageFilter;

      const matchesSupport =
        supportFilter === 'all' ||
        (supportFilter === 'high' && patient.supportLevel === 'high-support') ||
        (supportFilter === 'medium' && patient.supportLevel === 'medium-support') ||
        (supportFilter === 'low' && patient.supportLevel === 'low-support');

      return matchesSearch && matchesAge && matchesSupport;
    });
  }, [patients, searchQuery, ageFilter, supportFilter]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const ageFilters: { value: AgeFilter; label: string; count: number }[] = [
    {
      value: 'all',
      label: 'All Ages',
      count: patients.length,
    },
    {
      value: 'children',
      label: 'Children (5–12)',
      count: patients.filter((p) => getAgeGroup(p.age) === 'children').length,
    },
    {
      value: 'adolescents',
      label: 'Adolescents (13–18)',
      count: patients.filter((p) => getAgeGroup(p.age) === 'adolescents').length,
    },
    {
      value: 'adults',
      label: 'Adults (18+)',
      count: patients.filter((p) => getAgeGroup(p.age) === 'adults').length,
    },
  ];

  const supportFilters: { value: SupportFilter; label: string; description: string; count: number }[] = [
    {
      value: 'all',
      label: 'All Support Levels',
      description: 'Show everyone',
      count: patients.length,
    },
    {
      value: 'high',
      label: 'High-support',
      description: 'Needs assistance for most tasks',
      count: patients.filter((p) => p.supportLevel === 'high-support').length,
    },
    {
      value: 'medium',
      label: 'Medium-support',
      description: 'Partial independence',
      count: patients.filter((p) => p.supportLevel === 'medium-support').length,
    },
    {
      value: 'low',
      label: 'Low-support',
      description: 'Mostly independent, supervision needed',
      count: patients.filter((p) => p.supportLevel === 'low-support').length,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-screen-2xl mx-auto p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
          {/* Left Column - Patient List */}
          <section
            className={selectedPatient ? 'lg:w-1/2 xl:w-2/5 flex flex-col' : 'w-full flex flex-col'}
            aria-label="Patient list"
          >
            {/* Search & Filters */}
            <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients by name, room, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input pl-12 w-full"
                  aria-label="Search patients"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Age Group Filters */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  By Age Group
                </p>
                <div className="flex flex-wrap gap-2">
                  {ageFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={ageFilter === filter.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAgeFilter(filter.value)}
                      className="gap-2"
                      aria-pressed={ageFilter === filter.value}
                    >
                      {filter.label}
                      <Badge
                        variant={ageFilter === filter.value ? 'secondary' : 'outline'}
                        className="ml-1"
                      >
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Support Level Filters */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  By Functional Support Level
                </p>
                <div className="flex flex-wrap gap-2">
                  {supportFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={supportFilter === filter.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportFilter(filter.value)}
                      className="gap-2"
                      aria-pressed={supportFilter === filter.value}
                    >
                      <span className="flex flex-col items-start">
                        <span>{filter.label}</span>
                        {filter.value !== 'all' && (
                          <span className="text-[10px] text-muted-foreground">
                            {filter.description}
                          </span>
                        )}
                      </span>
                      <Badge
                        variant={supportFilter === filter.value ? 'secondary' : 'outline'}
                        className="ml-1"
                      >
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient List Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Showing {filteredPatients.length} of {patients.length} patients
                </span>
              </div>
            </div>

            {/* Patient List */}
            <div
              className="flex-1 overflow-y-auto space-y-3 scrollbar-thin pr-1"
              role="list"
              aria-label="Patient list"
            >
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    No patients match your search or filter criteria.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery('');
                      setAgeFilter('all');
                      setSupportFilter('all');
                    }}
                    className="mt-2"
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <PatientListRow
                    key={patient.id}
                    patient={patient}
                    isSelected={selectedPatientId === patient.id}
                    onSelect={() => selectPatient(patient.id)}
                    onViewProgress={() => setProgressPatient(patient)}
                  />
                ))
              )}
            </div>
          </section>

          {/* Right Column - Patient Detail */}
          {selectedPatient && (
            <section
              className="lg:w-1/2 xl:w-3/5 h-full"
              aria-label="Patient details"
            >
              <PatientDetailPane
                patient={selectedPatient}
                tasks={getPatientTasks(selectedPatient.id)}
                events={getPatientEvents(selectedPatient.id)}
                onViewProgress={() => setProgressPatient(selectedPatient)}
              />
            </section>
          )}
        </div>
      </main>

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
