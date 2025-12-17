import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient, Task, HistoryEvent, mockPatients, mockTasks, mockEvents, currentCaregiver } from '@/data/mockData';

interface AppState {
  isAuthenticated: boolean;
  patients: Patient[];
  tasks: Task[];
  events: HistoryEvent[];
  selectedPatientId: string | null;
  caregiver: typeof currentCaregiver;
}

interface AppContextType extends AppState {
  login: () => void;
  logout: () => void;
  selectPatient: (patientId: string | null) => void;
  completeTask: (taskId: string) => void;
  addEvent: (event: Omit<HistoryEvent, 'id' | 'timestamp' | 'caregiverId' | 'caregiverName'> & { patientId: string }) => void;
  getPatientTasks: (patientId: string) => Task[];
  getPatientEvents: (patientId: string) => HistoryEvent[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    patients: mockPatients,
    tasks: mockTasks,
    events: mockEvents,
    selectedPatientId: null,
    caregiver: currentCaregiver,
  });

  const login = () => {
    setState(prev => ({ ...prev, isAuthenticated: true }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false, selectedPatientId: null }));
  };

  const selectPatient = (patientId: string | null) => {
    setState(prev => ({ ...prev, selectedPatientId: patientId }));
  };

  const completeTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              completedBy: prev.caregiver.name,
            }
          : task
      ),
    }));
  };

  const addEvent = (eventData: Omit<HistoryEvent, 'id' | 'timestamp' | 'caregiverId' | 'caregiverName'> & { patientId: string }) => {
    const newEvent: HistoryEvent = {
      ...eventData,
      id: `e${Date.now()}`,
      timestamp: new Date().toISOString(),
      caregiverId: state.caregiver.id,
      caregiverName: state.caregiver.name,
    };

    setState(prev => ({
      ...prev,
      events: [newEvent, ...prev.events],
    }));
  };

  const getPatientTasks = (patientId: string) => {
    return state.tasks.filter(task => task.patientId === patientId);
  };

  const getPatientEvents = (patientId: string) => {
    return state.events.filter(event => event.patientId === patientId);
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
