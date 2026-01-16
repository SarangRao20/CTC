
import React, { useState, useEffect } from 'react';
import Header from './Header';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
    children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Check local storage or system preference
        if (localStorage.getItem('theme') === 'dark') return true;
        return false; // Default light for now or window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
<<<<<<< HEAD
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
            {children || (
                <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
                    <Outlet />
=======
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col w-full overflow-x-hidden">
            <Header isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
            {children || (
                <main className="flex-1 w-full mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6 lg:py-8 pb-24 sm:pb-28 md:pb-8 overflow-x-hidden">
                    <div className="w-full max-w-7xl mx-auto">
                        <Outlet />
                    </div>
>>>>>>> origin/frontend
                </main>
            )}
        </div>
    );
};

export default Layout;
