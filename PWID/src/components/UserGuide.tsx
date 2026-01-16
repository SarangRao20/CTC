import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const UserGuide: React.FC = () => {
    useEffect(() => {
        // Check if the tour has already been shown in this session
        const hasSeenTour = sessionStorage.getItem('hasSeenUserGuide');

        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    {
                        element: '#dashboard-welcome',
                        popover: {
                            title: 'Welcome to CareConnect!',
                            description: 'This is your central command center. Here you can track patient status, view alerts, and manage your daily tasks.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-stats',
                        popover: {
                            title: 'Daily Overview',
                            description: 'Get a quick summary of urgent alerts, pending tasks, and patient wellness scores at a glance.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-search',
                        popover: {
                            title: 'Search Residents',
                            description: 'Quickly find a specific resident by name or room number.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-filters',
                        popover: {
                            title: 'Filter Views',
                            description: 'Focus solely on children, adults, or high-support patients to better prioritize your rounds.',
                            side: "left",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-care-cards',
                        popover: {
                            title: 'Resident Cards',
                            description: 'Each card represents a resident. Click "View Progress" to see detailed logs, history, and AI-driven insights.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-notifications',
                        popover: {
                            title: 'Notifications',
                            description: 'Check here for real-time alerts about critical events or overdue tasks.',
                            side: "bottom",
                            align: 'end'
                        }
                    },
                    {
                        element: '#tour-profile',
                        popover: {
                            title: 'Your Profile',
                            description: 'Access settings, switch NGOs, or log out from here.',
                            side: "bottom",
                            align: 'end'
                        }
                    }
                ],
                onDestroyStarted: () => {
                    // If the user clicks strict off click or 'x' or 'done'.
                    // We can mark it as seen so it doesn't pop up again in this session.
                    // However, for testing purposes, the user might want to see it again if they refresh? 
                    // The requirement says "everytime user logs in", which usually implies session.
                    sessionStorage.setItem('hasSeenUserGuide', 'true');
                    driverObj.destroy();
                }
            });

            // Give a small delay to ensure DOM elements are fully rendered/hydrated
            setTimeout(() => {
                driverObj.drive();
            }, 1000);
        }
    }, []);

    return null; // This component handles side effects only (the tour)
};

export default UserGuide;
