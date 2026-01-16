import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const UserGuide: React.FC = () => {
    const { t } = useTranslation();

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
                            title: t('tour_welcome_title'),
                            description: t('tour_welcome_desc'),
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-stats',
                        popover: {
                            title: t('tour_stats_title'),
                            description: t('tour_stats_desc'),
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-search',
                        popover: {
                            title: t('tour_search_title'),
                            description: t('tour_search_desc'),
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-filters',
                        popover: {
                            title: t('tour_filter_title'),
                            description: t('tour_filter_desc'),
                            side: "left",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-care-cards',
                        popover: {
                            title: t('tour_card_title'),
                            description: t('tour_card_desc'),
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-notifications',
                        popover: {
                            title: t('tour_notif_title'),
                            description: t('tour_notif_desc'),
                            side: "bottom",
                            align: 'end'
                        }
                    },
                    {
                        element: '#tour-profile',
                        popover: {
                            title: t('tour_profile_title'),
                            description: t('tour_profile_desc'),
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
    }, [t]);

    return null; // This component handles side effects only (the tour)
};

export default UserGuide;
