import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  LayoutDashboard,
  History,
  ClipboardList,
  Bell,
  LogOut,
  User,
  Settings,
  Building2,
  Moon,
  Sun
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  isDark?: boolean;
  toggleTheme?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggleTheme }) => {
  const { t } = useTranslation();
  const { caregiver, logout, tasks } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const overdueTasks = tasks ? tasks.filter(t => t.status === 'overdue').length : 0;

  const allNavItems = [
    { path: '/ngo', label: t('ngo_management'), icon: Building2, roles: ['organization'] },
    { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['all'] },
    { path: '/history', label: t('view_history'), icon: History, roles: ['all'] },
    { path: '/routine', label: t('routine_checks'), icon: ClipboardList, roles: ['all'] },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.roles.includes('all')) return true;
    if (item.roles.includes('organization')) {
      return caregiver?.role?.toLowerCase() === 'organization';
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Heart className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline-block">{t('app_name')}</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 mx-6">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSwitcher />

          {toggleTheme && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          )}

          <Button variant="ghost" size="icon" className="text-muted-foreground relative" aria-label={`Notifications, ${overdueTasks} urgent`} id="tour-notifications">
            <Bell className="w-5 h-5" />
            {overdueTasks > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-urgent animate-pulse" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent" id="tour-profile">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold border border-border">
                  {caregiver?.name ? caregiver.name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium leading-none">{caregiver?.name || 'Caregiver'}</p>
                  <p className="text-xs text-muted-foreground max-w-[100px] truncate">{caregiver?.ngo_name || 'CareConnect'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('my_account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 w-4 h-4" />
                <span>{t('settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-urgent focus:text-urgent" onClick={handleLogout}>
                <LogOut className="mr-2 w-4 h-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav
        className="md:hidden flex items-center justify-around py-2 border-t border-border bg-background"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors
                  ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
                }
                `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
