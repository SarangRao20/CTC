import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const ParentUserGuide: React.FC = () => {
    useEffect(() => {
        const hasSeenTour = sessionStorage.getItem('hasSeenParentUserGuide');

        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    {
                        element: '#parent-welcome',
                        popover: {
                            title: 'Welcome Parent',
                            description: 'This is your dedicated secure dashboard to monitor your loved one.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#child-profile',
                        popover: {
                            title: 'Child Profile',
                            description: 'View current status, diagnosis, and support details here.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#recent-logs',
                        popover: {
                            title: 'Daily Logs',
                            description: 'Scroll through recent daily activities, mood logs, and meals.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#risk-assessment',
                        popover: {
                            title: 'Risk Analysis',
                            description: 'AI-driven analysis of mood and sleep patterns to help you stay informed.',
                            side: "left",
                            align: 'start'
                        }
                    },
                    {
                        element: '#travel-status',
                        popover: {
                            title: 'Tracking Status',
                            description: 'Real-time updates on location and transit status. You can confirm safe arrival here.',
                            side: "left",
                            align: 'start'
                        }
                    }
                ],
                onDestroyStarted: () => {
                    sessionStorage.setItem('hasSeenParentUserGuide', 'true');
                    driverObj.destroy();
                }
            });

            setTimeout(() => {
                driverObj.drive();
            }, 1000);
        }
    }, []);

    return null;
};

export default ParentUserGuide;
