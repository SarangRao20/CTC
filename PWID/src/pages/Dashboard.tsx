import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import CareCard from '@/components/CareCard';
import ProgressModal from '@/components/ProgressModal';
import DashboardStats from '@/components/DashboardStats';
import VoiceInputButton from '@/components/VoiceInputButton';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Phone } from 'lucide-react';
import { Patient } from '@/data/mockData';
import UserGuide from '@/components/UserGuide';

type AgeFilter = 'all' | 'children' | 'adolescents' | 'adults';
type SupportFilter = 'all' | 'high' | 'medium' | 'low';

const Dashboard = () => {
  const { t } = useTranslation();
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
    { value: 'all', label: t('all_ages') },
    { value: 'children', label: t('children_age') },
    { value: 'adolescents', label: t('adolescents_age') },
    { value: 'adults', label: t('adults_age') },
  ];

  const supportFilters: { value: SupportFilter; label: string }[] = [
    { value: 'all', label: t('all_support') },
    { value: 'high', label: t('high') },
    { value: 'medium', label: t('medium') },
    { value: 'low', label: t('low') },
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-welcome">
      <UserGuide />
      {/* Dashboard Stats */}
      <div id="tour-stats">
        <DashboardStats />
      </div>


      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 md:w-64" id="tour-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('search')}
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
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="icon"
                className="rounded-xl border-none shadow-sm bg-card shrink-0"
                onClick={() => setShowFilters(!showFilters)}
                id="tour-filters"
              >
                <Filter className={`w-4 h-4 ${showFilters ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>

              {/* Global Voice Command Button */}
              <div className="relative flex items-center gap-2">
                <span className="hidden md:inline-block text-sm font-medium text-muted-foreground">Voice Task:</span>
                <VoiceInputButton
                  onTranscription={(text) => {
                    console.log("Voice Command Received:", text);
                    alert(`Voice Command Processed:\nAdded task from: "${text}"`);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <a href="tel:108">
          <Button variant="destructive" className="rounded-xl shadow-lg animate-pulse font-bold">
            <Phone className="w-4 h-4 mr-2" />
            {t('sos')}
          </Button>
        </a>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card p-4 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('age_group')}</span>
            <div className="flex flex-wrap gap-2">
              {ageFilters.map(f => (
                <Button
                  key={f.value}
                  variant={ageFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAgeFilter(f.value)}
                  className="rounded-lg h-8 px-3 text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('support_level')}</span>
            <div className="flex flex-wrap gap-2">
              {supportFilters.map(f => (
                <Button
                  key={f.value}
                  variant={supportFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSupportFilter(f.value)}
                  className="rounded-lg h-8 px-3 text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {(ageFilter !== 'all' || supportFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setAgeFilter('all'); setSupportFilter('all'); }}
              className="text-primary hover:text-primary/80 h-8 px-2 text-xs"
            >
              {t('clear_filters')}
            </Button>
          )}
        </div>
      )}

      {/* Resident List Section */}
      <div id="tour-list" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {t('assigned_patients')}
            <Badge variant="secondary" className="ml-2 font-medium bg-card border-none shadow-sm">
              {filteredPatients.length}
            </Badge>
          </h2>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center border-2 border-dashed border-muted/20">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">{t('no_search_results')}</h3>
            <p className="text-muted-foreground mb-4">{t('try_adjust_filters')}</p>
            {(searchQuery || ageFilter !== 'all' || supportFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setAgeFilter('all');
                  setSupportFilter('all');
                }}
              >
                {t('show_all_residents')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4" id="tour-care-cards">
            {filteredPatients.map(patient => (
              <CareCard
                key={patient.id}
                patient={patient}
                onViewProgress={() => setProgressPatient(patient)}
              />
            ))}
          </div>
        )}
      </div>

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
