import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Patient, Task, HistoryEvent, currentCaregiver } from '@/data/mockData';
import api from '@/services/api';

interface Caretaker {
  id: string | number;
  name: string;
  email: string;
  role: string;
  ngo_name?: string;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isAuthenticated: true,
    patients: [],
    tasks: [],
    events: [],
    selectedPatientId: null,
    caregiver: currentCaregiver as Caretaker,
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
      const response = await api.get(`/dashboard/summary${ngoParam}`);
      // Note: Backend route was /dashboard/stats but the one I see in routes.py is /dashboard/summary or /dashboard/stats?
      // Let's check routes.py again. Ah, it has BOTH. /dashboard/stats (API) and /dashboard/summary (API).
      // Converting to use the summary endpoint which I just modified with NGO support? 
      // logic in routes.py:
      // @routes_bp.route('/dashboard/stats', methods=['GET']) -> get_dashboard_stats_api -> DOES NOT HAVE FILTER YET
      // @routes_bp.route("/dashboard/summary" -> dashboard_summary -> HAS FILTER

      // Let's stick to the one the text uses: /dashboard/stats. Wait, looking at routes.py again..
      // I modified dashboard_summary (line 439) in previous step.
      // I should update get_dashboard_stats_api (line 380) too.
      // For now, I'll point to /dashboard/stats and will fix that endpoint in next step.
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
