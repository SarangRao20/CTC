import React from 'react';
import { useTranslation } from 'react-i18next';
import { Patient } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, TrendingUp, Clock, HandHelping } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PatientListRowProps {
  patient: Patient;
  isSelected: boolean;
  onSelect: () => void;
  onViewProgress: () => void;
}

const PatientListRow: React.FC<PatientListRowProps> = ({
  patient,
  isSelected,
  onSelect,
  onViewProgress,
}) => {
  const { t } = useTranslation();

  const statusVariant = {
    stable: 'stable',
    'needs-attention': 'needs-attention',
    urgent: 'urgent',
  } as const;

  const statusLabel = {
    stable: t('stable'),
    'needs-attention': t('needs_attention'),
    urgent: t('urgent'),
  };

  const supportLevelLabel = {
    minimal: t('minimal'),
    moderate: t('moderate'),
    substantial: t('substantial'),
    extensive: t('extensive'),
  };

  const supportLevelColor = {
    minimal: 'text-success',
    moderate: 'text-info',
    substantial: 'text-warning',
    extensive: 'text-urgent',
  };

  const lastCheckTime = formatDistanceToNow(new Date(patient.lastCheckDate), { addSuffix: true });

  return (
    <article
      className={`patient-row ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      role="button"
      tabIndex={0}
      aria-label={`${t('select')} ${patient.name}, ${t('status')}: ${statusLabel[patient.status]}`}
      aria-pressed={isSelected}
    >
      {/* Avatar */}
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
          ${patient.status === 'urgent'
            ? 'bg-urgent-light'
            : patient.status === 'needs-attention'
              ? 'bg-warning-light'
              : 'bg-primary-light'
          }
        `}
        aria-hidden="true"
      >
        <User
          className={`
            w-6 h-6
            ${patient.status === 'urgent'
              ? 'text-urgent'
              : patient.status === 'needs-attention'
                ? 'text-warning'
                : 'text-primary'
            }
          `}
        />
      </div>

      {/* Patient Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">{patient.name}</h3>
          <Badge variant={statusVariant[patient.status]} className="flex-shrink-0">
            {statusLabel[patient.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1">
          <span>{t('age')} {patient.age}</span>
          <span>•</span>
          <span>{t('room')} {patient.roomNumber}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lastCheckTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <HandHelping className={`w-3.5 h-3.5 ${supportLevelColor[patient.functionalSupport]}`} />
          <span className={`font-medium ${supportLevelColor[patient.functionalSupport]}`}>
            {supportLevelLabel[patient.functionalSupport]} {t('support')}
          </span>
        </div>
      </div>

      {/* Progress Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onViewProgress();
        }}
        className="flex-shrink-0 gap-2"
        aria-label={`${t('view_progress_for')} ${patient.name}`}
      >
        <TrendingUp className="w-4 h-4" />
        <span className="hidden sm:inline">{t('progress')}</span>
      </Button>
    </article>
  );
};

export default PatientListRow;
