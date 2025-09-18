import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Card, Button } from '@carrierllm/ui';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '../lib/api';
const quickActions = [
    {
        title: 'New Intake Form',
        description: 'Start a new client intake with our comprehensive questionnaire',
        href: '/intake',
        icon: 'form',
        variant: 'primary',
    },
    {
        title: 'Chat Intake',
        description: 'Have a conversation to gather client information',
        href: '/chat',
        icon: 'chat',
        variant: 'secondary',
    },
    {
        title: 'View Analytics',
        description: 'Review your placement performance and trends',
        href: '/analytics',
        icon: 'chart',
        variant: 'secondary',
    },
];
const iconMap = {
    form: (_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) })),
    chat: (_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) })),
    chart: (_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) })),
};
export const DashboardPage = () => {
    const { user } = useUser();
    // Fetch dashboard statistics
    const { data: analytics, isLoading: statsLoading, error } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchAnalytics,
        retry: false,
        staleTime: 30000
    });
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good morning';
        if (hour < 18)
            return 'Good afternoon';
        return 'Good evening';
    };
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900", children: [getGreeting(), ", ", user?.firstName || 'Agent', "!"] }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Ready to help your clients find the perfect insurance coverage?" })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Quick Actions" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: quickActions.map((action) => (_jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg", children: iconMap[action.icon] }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: action.title }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: action.description }), _jsx(Link, { to: action.href, children: _jsx(Button, { variant: action.variant, size: "sm", children: "Get Started" }) })] })] }) }, action.title))) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Your Performance" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(Card, { children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg", children: _jsx("svg", { className: "w-5 h-5 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Submissions" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: statsLoading ? '...' : error ? '0' : analytics?.stats.totalIntakes || '0' })] })] }) }), _jsx(Card, { children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg", children: _jsx("svg", { className: "w-5 h-5 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Average Fit" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: statsLoading ? '...' : error ? '0%' : `${Math.round(analytics?.stats.averageFitScore || 0)}%` })] })] }) }), _jsx(Card, { children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg", children: _jsx("svg", { className: "w-5 h-5 text-purple-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }) }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Placement Rate" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: statsLoading ? '...' : error ? '0%' : `${Math.round(analytics?.stats.placementRate || 0)}%` })] })] }) }), _jsx(Card, { children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg", children: _jsx("svg", { className: "w-5 h-5 text-orange-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Remaining" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: statsLoading ? '...' : error ? '∞' : analytics?.stats.remainingRecommendations || '∞' })] })] }) })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Recent Activity" }), _jsx(Card, { children: _jsxs("div", { className: "text-center py-8", children: [_jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No recent activity" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Start by creating your first intake submission." }), _jsx("div", { className: "mt-6", children: _jsx(Link, { to: "/intake", children: _jsx(Button, { children: "Start New Intake" }) }) })] }) })] })] }));
};
