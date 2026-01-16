import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Heart, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '@/services/api';

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // NGO State
  const [ngoName, setNgoName] = useState(''); // For Org: Input Value. For Caregiver: Selected Name
  const [ngoOptions, setNgoOptions] = useState<{ id: number, name: string, type: string }[]>([]);
  const [ngoType, setNgoType] = useState('residential');
  const [ngoAddress, setNgoAddress] = useState('');

  // Fetch NGO options on mount
  useEffect(() => {
    api.get('/ngos').then(res => {
      setNgoOptions(res.data || []);
    }).catch(() => setNgoOptions([]));
  }, []);

  const [role, setRole] = useState('Caregiver');

  // For parent role
  const [childId, setChildId] = useState('');
  const [childOptions, setChildOptions] = useState<{ id: string, name: string }[]>([]);
  // Helper to get selected child object
  const selectedChild = childOptions.find((c) => String(c.id) === String(childId));

  const [loadingChildren, setLoadingChildren] = useState(false);
  const fetchChildren = () => {
    setLoadingChildren(true);
    api.get('/pwid/list').then(res => {
      setChildOptions(res.data.map((p: any) => ({ id: p.id, name: p.full_name })));
    }).catch((err) => {
      console.error("Failed to fetch children:", err);
      setChildOptions([]);
      toast({ title: "Error", description: "Failed to load children list.", variant: "destructive" });
    }).finally(() => setLoadingChildren(false));
  };

  // Fetch PWID options for parent role
  useEffect(() => {
    if (role === 'Parent') {
      fetchChildren();
    }
  }, [role]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'Parent') navigate('/parent/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, role]);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!name.trim()) e.name = 'Please enter your full name.';
    if (!email.trim()) e.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';

    // Validate NGO selection
    if (role === 'Caregiver') {
      if (!ngoName || ngoName === '') {
        e.ngoName = 'Please select your NGO.';
      }
    }

    if (role === 'Organization') {
      if (!ngoName.trim()) e.ngoName = 'Please enter Organization/NGO Name.';
    }

    // Validate Parent-specific fields
    if (role === 'Parent' && !childId) {
      e.childId = 'Please select your child.';
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
      if (role === 'Parent') {
        // ... (parent logic same)
        const response = await api.post('/parent/register', {
          name,
          email,
          password,
          pwid_id: childId,
        });
        if (response.status === 201) {
          toast({ title: 'Account created', description: 'Your parent profile is ready.' });
          const parent = { ...response.data.parent, role: 'Parent' };
          login(parent);
          navigate('/parent/dashboard');
        }
      } else {
        // Caregiver or Organization
        const response = await api.post('/caretaker/register', {
          name,
          email,
          password,
          role,
          ngo_name: ngoName, // Either selected (Caregiver) or Typed (Org)
          ngo_type: role === 'Organization' ? ngoType : undefined,
          ngo_address: role === 'Organization' ? ngoAddress : undefined,
        });

        if (response.status === 201 && response.data.caretaker) {
          toast({ title: 'Account created', description: `Your ${role} profile is ready.` });
          login(response.data.caretaker);
          await refreshData();
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err.response?.data?.error || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col relative overflow-hidden" role="main" aria-label="Signup page">
      {/* ... header and blobs same ... */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 -top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-info/10 blur-3xl" />
      </div>

      <header className="relative bg-card/80 backdrop-blur border-b border-border/70 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('app_name')}</h1>
            <p className="text-sm text-muted-foreground">{t('pwid_care_management')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('signup_title')}</h2>
            <p className="text-muted-foreground text-lg">{t('signup_subtitle')}</p>
          </div>

          <div className="w-full max-w-lg ml-auto">
            <div className="bg-card/95 backdrop-blur rounded-2xl border border-border shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{t('create_account')}</h2>
                  <p className="text-sm text-muted-foreground">{t('start_journey')}</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">{t('full_name')}</Label>
                  <Input id="name" placeholder="Alex Morgan" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
                  {errors.name && <p className="text-xs text-urgent mt-1">{t('enter_full_name')}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">{t('email')}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
                  {errors.email && <p className="text-xs text-urgent mt-1">{errors.email === 'Please enter your email.' ? t('enter_email') : t('invalid_email')}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">{t('role')}</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t('role')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caregiver">{t('caregiver')}</SelectItem>
                      <SelectItem value="Organization">{t('org_admin')}</SelectItem>
                      <SelectItem value="Parent">{t('parent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === 'Caregiver' && (
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">{t('select_ngo')}</Label>
                    <Select value={ngoName} onValueChange={setNgoName}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={t('select_ngo')} />
                      </SelectTrigger>
                      <SelectContent>
                        {ngoOptions.map((ngo) => (
                          <SelectItem key={ngo.id} value={ngo.name}>{ngo.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ngoName && <p className="text-xs text-urgent mt-1">{t('select_your_ngo')}</p>}
                  </div>
                )}

                {role === 'Organization' && (
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">{t('org_ngo_name')}</Label>
                    <Input
                      placeholder={t('enter_org_name')}
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      className="h-12"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">{t('org_creation_hint')}</div>
                    {errors.ngoName && <p className="text-xs text-urgent mt-1">{t('enter_org_name_error')}</p>}
                  </div>
                )}

                {role === 'Parent' && (
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">{t('select_child')}</Label>
                    <Select value={childId} onValueChange={setChildId}>
                      <SelectTrigger className="h-12"><SelectValue placeholder={t('select_child')} /></SelectTrigger>
                      <SelectContent>
                        {childOptions.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.childId && <p className="text-xs text-urgent mt-1">{t('select_child_error')}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 text-base" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? t('hide_password') : t('show_password')}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-urgent mt-1">{errors.password === 'Create a password.' ? t('create_password_error') : t('min_password_length')}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">{t('confirm_password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder={t('confirm_password')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12 text-base" autoComplete="new-password" />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-urgent mt-1">{errors.confirmPassword === 'Confirm your password.' ? t('confirm_password_error') : t('passwords_mismatch')}</p>}
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox id="accept" checked={accept} onCheckedChange={(v) => setAccept(Boolean(v))} />
                  <Label htmlFor="accept" className="text-sm text-muted-foreground">
                    {t('agree_to_terms')} <span className="text-primary">{t('privacy_policy')}</span>.
                  </Label>
                </div>
                {errors.accept && <p className="text-xs text-urgent -mt-2">{t('accept_terms_error')}</p>}

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
                  {submitting ? t('signing_up') : t('create_account')}
                </Button>

                <p className="text-center text-sm text-muted-foreground">{t('already_have_account')} <Link to="/" className="text-primary font-medium">{t('login')}</Link></p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SignupPage;
