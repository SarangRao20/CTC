import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import {
  Heart,
  LayoutDashboard,
  History,
  ClipboardList,
  Bell,
  LogOut,
  User,
  Settings,
  Moon,
  Sun
} from 'lucide-react';

interface HeaderProps {
  isDark?: boolean;
  toggleTheme?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggleTheme }) => {
  const { caregiver, logout, tasks } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const overdueTasks = tasks ? tasks.filter(t => t.status === 'overdue').length : 0;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/routine', label: 'Routine Checks', icon: ClipboardList },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Heart className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline-block">CareConnect</span>
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-urgent focus:text-urgent" onClick={handleLogout}>
                <LogOut className="mr-2 w-4 h-4" />
                <span>Log out</span>
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
