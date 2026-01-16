import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDashboardStats } from '@/data/mockData';
import { Search, Users, X, Activity, Heart, Mail, Lock, Eye, EyeOff, AlertCircle, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, caregiver, stats } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Try Caretaker login first
      const response = await api.post('/caretaker/login', { email, password });
      if (response.status === 200) {
        login(response.data.caretaker);
        navigate('/dashboard');
        return; // Exit on success
      }
    } catch (err: any) {
      // If Caretaker login failed explicitly (invalid credentials), try Parent login
      // But only if it's a 401 (Auth error), not 500 or timeout
      if (err.response && err.response.status === 401) {
        try {
          const parentRes = await api.post('/parent/login', { email, password });
          if (parentRes.status === 200) {
            login(parentRes.data.parent);
            navigate('/parent/dashboard');
            return;
          }
        } catch (parentErr: any) {
          // Both failed
          setError('Invalid credentials. Please check your email and password.');
          console.error('Parent login error:', parentErr);
        }
      } else {
        // Some other error (network, 500, etc)
        setError(err.response?.data?.error || 'Login failed. Please try again.');
        console.error('Caretaker login error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col relative overflow-hidden"
      role="main"
      aria-label="Login page"
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 -top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-info/10 blur-3xl" />
      </div>
      {/* Header */}
      <header className="relative bg-card/80 backdrop-blur border-b border-border/70 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">SaharaAI</h1>
            <p className="text-sm text-muted-foreground">PWID Care Management</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-success-light text-success border border-success/20">Secure Access</span>
            <span className="px-3 py-1 rounded-full bg-primary-light text-primary border border-primary/20">HIPAA-ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 relative z-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-start animate-fade-in">
          {/* Left: Overview */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="text-left lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Welcome back, {caregiver?.name || 'Caregiver'}
              </h2>
              <p className="text-lg text-muted-foreground">
                {caregiver?.role || 'Guest'} • {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Summary Cards */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              role="region"
              aria-label="Dashboard summary"
            >
              <article className="stat-card">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Assigned Patients
                  </span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-info-light flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalPatients}</p>
              </article>

              <article className="stat-card">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Urgent Alerts
                  </span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-urgent-light flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-urgent" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-urgent">{stats.urgentAlerts}</p>
              </article>

              <article className="stat-card">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Overdue Tasks
                  </span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-warning-light flex items-center justify-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-warning">{stats.overdueTasks}</p>
              </article>

              <article className="stat-card">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-muted-foreground text-xs sm:text-sm font-medium">
                    Completed Today
                  </span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-success-light flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-success">{stats.completedToday}</p>
              </article>
            </div>

            {/* Quick Status */}
            <div className="bg-card/90 backdrop-blur rounded-2xl border border-border shadow-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3 md:mb-4">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Quick Status</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 bg-secondary/50 rounded-xl">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-urgent animate-pulse flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground">
                    <strong>{stats.urgentAlerts} patient{stats.urgentAlerts !== 1 ? 's' : ''}</strong> need{stats.urgentAlerts === 1 ? 's' : ''} immediate attention
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 bg-secondary/50 rounded-xl">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-warning flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground">
                    <strong>{stats.pendingTasks} routine task{stats.pendingTasks !== 1 ? 's' : ''}</strong> scheduled for today
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="w-full max-w-lg mx-auto lg:ml-auto">
            <div className="bg-card/95 backdrop-blur rounded-2xl border border-border shadow-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Sign in</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Access your caregiver dashboard</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-2 sm:p-3 rounded-xl bg-urgent-light border border-urgent/30 flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-urgent flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-urgent">{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="caregiver@careconnect.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-base"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 text-base"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-3 sm:mt-4 md:mt-5 space-y-1 sm:space-y-2 text-center text-xs sm:text-sm text-muted-foreground">
                <p>
                  New here? <a href="/signup" className="text-primary font-medium">Create an account</a>
                </p>
                <p className="text-xs">By continuing you agree to our privacy policy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
