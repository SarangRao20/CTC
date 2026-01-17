import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import NGODashboard from "./pages/NGODashboard";
import HistoryPage from "./pages/HistoryPage";
import ReportPage from "./pages/ReportPage";
import PatientDashboard from "./pages/PatientDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// App routes with auth check
const AppRoutes = () => {
  const { isAuthenticated, caregiver } = useApp();

  // Determine dashboard based on role
  const dashboardPath = caregiver?.role === 'Parent' ? '/parent/dashboard' : '/dashboard';

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to={dashboardPath} replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to={dashboardPath} replace /> : <SignupPage />}
      />

      {/* Protected Parent Route (No Layout) */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes wrapped in Layer */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ngo" element={<NGODashboard />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/report/:patientId" element={<ReportPage />} />
        <Route path="/patient/:id" element={<PatientDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
