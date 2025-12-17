import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDashboardStats } from '@/data/mockData';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Activity,
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, caregiver } = useApp();
  const stats = getDashboardStats();

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
    // Simulated auth delay
    await new Promise(resolve => setTimeout(resolve, 500));
    login();
    navigate('/dashboard');
    setIsLoading(false);
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
            <h1 className="text-xl font-bold text-foreground tracking-tight">CareConnect</h1>
            <p className="text-sm text-muted-foreground">PWID Care Management</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-success-light text-success border border-success/20">Secure Access</span>
            <span className="px-3 py-1 rounded-full bg-primary-light text-primary border border-primary/20">HIPAA-ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-start animate-fade-in">
          {/* Left: Overview */}
          <div className="space-y-8">
            <div className="text-left lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Welcome back, {caregiver.name}
              </h2>
              <p className="text-lg text-muted-foreground">
                {caregiver.role} • {new Date().toLocaleDateString('en-US', { 
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
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground text-sm font-medium">
                    Assigned Patients
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-info-light flex items-center justify-center">
                    <Users className="w-5 h-5 text-info" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.totalPatients}</p>
              </article>

              <article className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground text-sm font-medium">
                    Urgent Alerts
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-urgent-light flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-urgent" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-urgent">{stats.urgentAlerts}</p>
              </article>

              <article className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground text-sm font-medium">
                    Overdue Tasks
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-warning">{stats.overdueTasks}</p>
              </article>

              <article className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground text-sm font-medium">
                    Completed Today
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-success">{stats.completedToday}</p>
              </article>
            </div>

            {/* Quick Status */}
            <div className="bg-card/90 backdrop-blur rounded-2xl border border-border shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Quick Status</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-urgent animate-pulse" />
                  <span className="text-foreground">
                    <strong>{stats.urgentAlerts} patient{stats.urgentAlerts !== 1 ? 's' : ''}</strong> need{stats.urgentAlerts === 1 ? 's' : ''} immediate attention
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-foreground">
                    <strong>{stats.pendingTasks} routine task{stats.pendingTasks !== 1 ? 's' : ''}</strong> scheduled for today
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="w-full max-w-lg ml-auto">
            <div className="bg-card/95 backdrop-blur rounded-2xl border border-border shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
                  <p className="text-sm text-muted-foreground">Access your caregiver dashboard</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-urgent-light border border-urgent/30 flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-urgent" />
                  <span className="text-sm text-urgent">{error}</span>
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

              <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">
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
