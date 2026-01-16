import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  LayoutDashboard, 
  History, 
  ClipboardList, 
  Bell, 
  LogOut,
  User
} from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const { caregiver, logout, tasks } = useApp();
  
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

  const navItems = [
    { path: '/ngo', label: 'NGO', icon: Building2 },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/routine', label: 'Routine Checks', icon: ClipboardList },
  ];

  return (
    <header 
      className="bg-card border-b border-border sticky top-0 z-40"
      role="banner"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3 min-h-0 min-w-0"
            aria-label="CareConnect Home"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">
              CareConnect
            </span>
          </Link>

          {/* Navigation */}
          <nav 
            className="hidden md:flex items-center gap-1"
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-touch
                    ${isActive 
                      ? 'bg-primary-light text-primary' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon"
              className="relative"
              aria-label={`Notifications, ${overdueTasks} urgent`}
            >
              <Bell className="w-5 h-5" />
              {overdueTasks > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-urgent text-urgent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {overdueTasks}
                </span>
              )}
            </Button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">{caregiver.name}</p>
                <p className="text-xs text-muted-foreground">{caregiver.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav 
          className="md:hidden flex items-center justify-around py-2 border-t border-border -mx-4 px-4"
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
      </div>
    </header>
  );
};

export default Header;
