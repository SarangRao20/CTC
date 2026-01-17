import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Patient, Task, HistoryEvent, currentCaregiver } from '@/data/mockData';
import api from '@/services/api';

interface Caretaker {
  id: string | number;
  name: string;
  email: string;
  role: string;
  ngo_name?: string;
  pwid_id?: string | number;
}

interface AppState {
  isAuthenticated: boolean;
  patients: Patient[];
  tasks: Task[];
  events: HistoryEvent[];
  selectedPatientId: string | null;
  caregiver: Caretaker;
  stats: {
    totalPatients: number;
    urgentAlerts: number;
    overdueTasks: number;
    completedToday: number;
    pendingTasks: number;
  };
}

interface AppContextType extends AppState {
  login: (caretakerData: Caretaker) => void;
  logout: () => void;
  selectPatient: (patientId: string | null) => void;
  completeTask: (taskId: string | number) => void;
  addEvent: (event: Omit<HistoryEvent, 'id' | 'timestamp' | 'caregiverId' | 'caregiverName'> & { patientId: string | number }) => void;
  getPatientTasks: (patientId: string | number) => Task[];
  getPatientEvents: (patientId: string | number) => HistoryEvent[];
  refreshData: () => Promise<void>;
  deleteTask: (taskId: string | number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    patients: [],
    tasks: [],
    events: [],
    selectedPatientId: null,
    // @ts-ignore - Initial empty state
    caregiver: null,
    stats: {
      totalPatients: 0,
      urgentAlerts: 0,
      overdueTasks: 0,
      completedToday: 0,
      pendingTasks: 0
    }
  });

  const fetchPatients = async () => {
    try {
      // If we have a caregiver logged in, use their NGO
      const ngoParam = state.caregiver?.ngo_name ? `?ngo=${encodeURIComponent(state.caregiver.ngo_name)}` : '';
      const response = await api.get(`/pwid/list${ngoParam}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      return [];
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const ngoParam = state.caregiver?.ngo_name ? `?ngo=${encodeURIComponent(state.caregiver.ngo_name)}` : '';
      const response = await api.get(`/dashboard/stats${ngoParam}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return state.stats;
    }
  };

  const refreshData = async () => {
    const [patients, tasks, events, stats] = await Promise.all([fetchPatients(), fetchTasks(), fetchEvents(), fetchStats()]);
    setState(prev => ({ ...prev, patients, tasks, events, stats }));
  };

  useEffect(() => {
    if (state.isAuthenticated) {
      refreshData();
    }
  }, [state.isAuthenticated]);

  const login = (caretakerData: Caretaker) => {
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      caregiver: caretakerData
    }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false, selectedPatientId: null }));
  };

  const selectPatient = async (patientId: string | null) => {
    setState(prev => ({ ...prev, selectedPatientId: patientId }));
    if (patientId) {
      try {
        const response = await api.get(`/events/${patientId}`);
        setState(prev => ({ ...prev, events: response.data }));
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    }
  };

  const completeTask = async (taskId: string | number) => {
    try {
      await api.post(`/tasks/${taskId}/complete`, { completed_by: state.caregiver.name });
      // Refresh tasks after completion
      const tasks = await fetchTasks();
      setState(prev => ({ ...prev, tasks }));
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const deleteTask = async (taskId: string | number) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const addEvent = async (eventData: Omit<HistoryEvent, 'id' | 'timestamp' | 'caregiverId' | 'caregiverName'> & { patientId: string | number }) => {
    try {
      const payload = {
        ...eventData,
        caregiverId: state.caregiver.id,
        caregiverName: state.caregiver.name,
      };
      // We don't have a backend endpoint for raw event creation yet (it's handled by /observe or assumed), 
      // but for "Log Observation" we are calling /observe which creates it.
      // However, if we want to manually add an event (like file upload), we need frontend state update or correct backend call.
      // For now, let's assuming /observe returns the created event or we mock it for instant feedback.

      // If this is called AFTER backend creation (which is the case for CareCard), eventData might have ID.
      // But strictly following interface:

      const newEvent: HistoryEvent = {
        id: `E-${Date.now()}`,
        timestamp: new Date().toISOString(),
        caregiverId: state.caregiver.id,
        caregiverName: state.caregiver.name,
        // @ts-ignore - Assuming eventData has match shape
        ...eventData
      } as HistoryEvent;

      setState(prev => ({
        ...prev,
        events: [newEvent, ...prev.events]
      }));

      // If patient selected, fetch fresh to be safe? No, let's rely on optimisitic update for speed
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const getPatientTasks = (patientId: string | number) => {
    return state.tasks.filter(task => String(task.patientId) === String(patientId));
  };

  const getPatientEvents = (patientId: string | number) => {
    return state.events.filter(event => String(event.patientId) === String(patientId));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        selectPatient,
        completeTask,
        addEvent,
        getPatientTasks,
        getPatientEvents,
        refreshData,
        deleteTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
