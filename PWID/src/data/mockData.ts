// Types and mock data for the app. This file should not contain any React/JSX.

export type PatientStatus = 'stable' | 'needs-attention' | 'urgent';
export type FunctionalSupport = 'minimal' | 'moderate' | 'substantial' | 'extensive';
export type SupportLevel = 'low-support' | 'medium-support' | 'high-support';

export interface Patient {
  id: string;
  name: string;
  age: number;
  roomNumber: string;
  status: PatientStatus;
  primaryDiagnosis: string;
  medications: string[];
  allergies: string[];
  lastCheckDate: string; // ISO string
  functionalSupport: FunctionalSupport;
  // Some views use a simplified label; keep both for compatibility
  supportLevel: SupportLevel;
}

export type TaskStatus = 'pending' | 'overdue' | 'completed';
export type TaskPriority = 'urgent' | 'high' | 'normal';
export type TaskCategory = 'medication' | 'meal' | 'hygiene' | 'therapy' | 'checkup' | 'other';

export interface Task {
  id: string;
  patientId: string;
  title: string;
  description: string;
  dueTime: string; // display only (e.g., "10:00 AM")
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  completedAt?: string; // ISO
  completedBy?: string;
}

export type HistoryEventType = 'voice' | 'image' | 'vitals' | 'medication' | 'task-complete' | 'incident' | 'note';

export interface HistoryEvent {
  id: string;
  patientId: string;
  type: HistoryEventType;
  title: string;
  description: string;
  timestamp: string; // ISO string
  caregiverId: string;
  caregiverName: string;
  // Optional payloads
  voiceTranscription?: string;
  imageUrl?: string;
  vitals?: {
    temperature?: number;
    heartRate?: number;
    bloodPressure?: string;
    weight?: number;
  };
}

export const currentCaregiver = {
  id: 'c001',
  name: 'Alex Morgan',
  role: 'Senior Caregiver',
};

export const mockPatients: Patient[] = [
  {
    id: 'P-1001',
    name: 'John Doe',
    age: 24,
    roomNumber: 'A12',
    status: 'needs-attention',
    primaryDiagnosis: 'Autism Spectrum Disorder',
    medications: ['Risperidone 1mg'],
    allergies: [],
    lastCheckDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    functionalSupport: 'moderate',
    supportLevel: 'medium-support',
  },
  {
    id: 'P-1002',
    name: 'Maria Lopez',
    age: 16,
    roomNumber: 'B07',
    status: 'stable',
    primaryDiagnosis: 'Down Syndrome',
    medications: ['Levothyroxine 50mcg'],
    allergies: ['Penicillin'],
    lastCheckDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    functionalSupport: 'minimal',
    supportLevel: 'low-support',
  },
  {
    id: 'P-1003',
    name: 'Ravi Sharma',
    age: 11,
    roomNumber: 'C03',
    status: 'urgent',
    primaryDiagnosis: 'Cerebral Palsy',
    medications: ['Baclofen 10mg'],
    allergies: [],
    lastCheckDate: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    functionalSupport: 'extensive',
    supportLevel: 'high-support',
  },
  {
    id: 'P-1004',
    name: 'Aisha Khan',
    age: 32,
    roomNumber: 'D21',
    status: 'stable',
    primaryDiagnosis: 'Intellectual Disability',
    medications: ['Multivitamin'],
    allergies: ['Peanuts'],
    lastCheckDate: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    functionalSupport: 'substantial',
    supportLevel: 'medium-support',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'T-2001',
    patientId: 'P-1001',
    title: 'Morning medication',
    description: 'Administer Risperidone 1mg with water',
    dueTime: '08:00 AM',
    status: 'completed',
    priority: 'normal',
    category: 'medication',
    completedAt: new Date().toISOString(),
    completedBy: currentCaregiver.name,
  },
  {
    id: 'T-2002',
    patientId: 'P-1003',
    title: 'Physiotherapy session',
    description: 'Assist with daily stretching routine',
    dueTime: '10:30 AM',
    status: 'overdue',
    priority: 'urgent',
    category: 'therapy',
  },
  {
    id: 'T-2003',
    patientId: 'P-1002',
    title: 'Lunch assistance',
    description: 'Ensure balanced diet and hydration',
    dueTime: '12:30 PM',
    status: 'pending',
    priority: 'high',
    category: 'meal',
  },
  {
    id: 'T-2004',
    patientId: 'P-1004',
    title: 'Routine check-up',
    description: 'Record vitals and general well-being',
    dueTime: '03:00 PM',
    status: 'pending',
    priority: 'normal',
    category: 'checkup',
  },
];

export const mockEvents: HistoryEvent[] = [
  {
    id: 'E-3001',
    patientId: 'P-1003',
    type: 'incident',
    title: 'Fall reported near bed',
    description: 'Minor slip; no visible injury. Monitoring for 24h.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    caregiverId: currentCaregiver.id,
    caregiverName: currentCaregiver.name,
  },
  {
    id: 'E-3002',
    patientId: 'P-1002',
    type: 'vitals',
    title: 'Vitals recorded',
    description: 'Routine vitals check',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    caregiverId: currentCaregiver.id,
    caregiverName: currentCaregiver.name,
    vitals: { temperature: 98.4, heartRate: 72, bloodPressure: '120/80' },
  },
  {
    id: 'E-3003',
    patientId: 'P-1001',
    type: 'voice',
    title: 'Voice note',
    description: 'Daily behavior summary',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    caregiverId: currentCaregiver.id,
    caregiverName: currentCaregiver.name,
    voiceTranscription: 'Patient was calm during morning activities.',
  },
  {
    id: 'E-3004',
    patientId: 'P-1004',
    type: 'image',
    title: 'Photo captured',
    description: 'Skin rash improvement photo',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    caregiverId: currentCaregiver.id,
    caregiverName: currentCaregiver.name,
    imageUrl: 'https://via.placeholder.com/200x140.png?text=Care+Image',
  },
];

export function getDashboardStats() {
  const totalPatients = mockPatients.length;
  const urgentAlerts = mockPatients.filter(p => p.status === 'urgent').length;
  const overdueTasks = mockTasks.filter(t => t.status === 'overdue').length;
  const completedToday = mockTasks.filter(
    t => t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;
  const pendingTasks = mockTasks.filter(t => t.status === 'pending').length;

  return {
    totalPatients,
    urgentAlerts,
    overdueTasks,
    completedToday,
    pendingTasks,
  } as const;
}
