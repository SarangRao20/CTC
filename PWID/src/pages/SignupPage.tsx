import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Heart, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '@/services/api';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ngoName, setNgoName] = useState('');
  const [ngoOptions, setNgoOptions] = useState<string[]>([]);
  const [customNgo, setCustomNgo] = useState('');

  // Fetch NGO options on mount
  useEffect(() => {
    api.get('/ngos').then(res => {
      setNgoOptions(res.data || []);
    }).catch(() => setNgoOptions([]));
  }, []);
  const [role, setRole] = useState('Caregiver');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!name.trim()) e.name = 'Please enter your full name.';
    if (!email.trim()) e.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    
    // Validate NGO selection
    if (!ngoName || ngoName === '') {
      e.ngoName = 'Please select your NGO.';
    } else if (ngoName === '__other__' && !customNgo.trim()) {
      e.ngoName = 'Please enter your NGO name.';
    }
    
    if (!password) e.password = 'Create a password.';
    else if (password.length < 8) e.password = 'Minimum 8 characters.';
    if (!confirmPassword) e.confirmPassword = 'Confirm your password.';
    else if (confirmPassword !== password) e.confirmPassword = 'Passwords do not match.';
    if (!accept) e.accept = 'You must accept the terms to continue.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const { refreshData, login } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const finalNgoName = ngoName === '__other__' ? customNgo : ngoName;
      
      const response = await api.post('/caretaker/register', {
        name,
        email,
        password,
        role,
        ngo_name: finalNgoName,
      });

      if (response.status === 201 && response.data.caretaker) {
        toast({
          title: 'Account created',
          description: 'Your caregiver profile is ready.',
        });

        // Auto-login the user with the returned caretaker data
        login(response.data.caretaker);
        
        // Refresh data to fetch PWIDs for this NGO
        await refreshData();
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err.response?.data?.error || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      console.error('Registration error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col relative overflow-hidden" role="main" aria-label="Signup page">
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

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Copy */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Create your caregiver account</h2>
            <p className="text-muted-foreground text-lg">Set up your profile to access the caregiver dashboard. You can update your details later in settings.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/60 border border-border">
                <ShieldCheck className="w-5 h-5 text-success mb-2" />
                <p className="text-sm text-foreground font-medium">Data encrypted & privacy-focused</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/60 border border-border">
                <Heart className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm text-foreground font-medium">Designed for PWID caregivers</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Already have an account? <Link to="/" className="text-primary font-medium">Sign in</Link></p>
          </div>

          {/* Right: Signup Card */}
          <div className="w-full max-w-lg ml-auto">
            <div className="bg-card/95 backdrop-blur rounded-2xl border border-border shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Sign up</h2>
                  <p className="text-sm text-muted-foreground">Start your caregiver journey</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="name" placeholder="Alex Morgan" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 text-base" />
                  </div>
                  {errors.name && <p className="text-xs text-urgent mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="caregiver@careconnect.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 text-base" autoComplete="email" />
                  </div>
                  {errors.email && <p className="text-xs text-urgent mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caregiver">Caregiver</SelectItem>
                      <SelectItem value="Nurse">Nurse</SelectItem>
                      <SelectItem value="Therapist">Therapist</SelectItem>
                      <SelectItem value="Coordinator">Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ngoName" className="text-foreground font-medium">NGO Name</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Select value={ngoName} onValueChange={setNgoName}>
                      <SelectTrigger className="pl-10 h-12 text-base">
                        <SelectValue placeholder="Select your NGO" />
                      </SelectTrigger>
                      <SelectContent>
                        {ngoOptions.map((ngo) => (
                          <SelectItem key={ngo} value={ngo}>{ngo}</SelectItem>
                        ))}
                        <SelectItem value="__other__">Other (not listed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {ngoName === '__other__' && (
                    <div className="mt-2">
                      <Input
                        id="ngoNameOther"
                        placeholder="Type your NGO Name"
                        value={customNgo}
                        onChange={(e) => setCustomNgo(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                  )}
                  {errors.ngoName && <p className="text-xs text-urgent mt-1">{errors.ngoName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 text-base" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-urgent mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12 text-base" autoComplete="new-password" />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-urgent mt-1">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox id="accept" checked={accept} onCheckedChange={(v) => setAccept(Boolean(v))} />
                  <Label htmlFor="accept" className="text-sm text-muted-foreground">
                    I agree to the <span className="text-primary">Terms</span> and <span className="text-primary">Privacy Policy</span>.
                  </Label>
                </div>
                {errors.accept && <p className="text-xs text-urgent -mt-2">{errors.accept}</p>}

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Create account'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">Already registered? <Link to="/" className="text-primary font-medium">Sign in</Link></p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SignupPage;
