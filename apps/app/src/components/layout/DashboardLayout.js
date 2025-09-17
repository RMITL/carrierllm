import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
const navigation = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'New Intake', href: '/intake', icon: 'plus' },
    { name: 'Chat Intake', href: '/chat', icon: 'chat' },
    { name: 'Analytics', href: '/analytics', icon: 'chart' },
];
const userNavigation = [
    { name: 'Profile', href: '/profile', icon: 'user' },
    { name: 'Billing', href: '/billing', icon: 'credit-card' },
];
const iconMap = {
    dashboard: (_jsxs("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" })] })),
    plus: (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) })),
    chat: (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) })),
    chart: (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) })),
    user: (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) })),
    'credit-card': (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" }) })),
};
export const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user } = useUser();
    const isActiveRoute = (href) => {
        if (href === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(href);
    };
    const navLinkClass = (href) => `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActiveRoute(href)
        ? 'bg-[color:var(--color-primary)] text-white'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("div", { className: `fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`, children: [_jsx("div", { className: `fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`, onClick: () => setSidebarOpen(false) }), _jsxs("div", { className: `relative flex w-full max-w-xs flex-1 flex-col bg-white transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`, children: [_jsx("div", { className: "absolute top-0 right-0 -mr-12 pt-2", children: _jsxs("button", { type: "button", className: "ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white", onClick: () => setSidebarOpen(false), children: [_jsx("span", { className: "sr-only", children: "Close sidebar" }), _jsx("svg", { className: "h-6 w-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })] }) }), _jsx(SidebarContent, {})] })] }), _jsx("div", { className: "hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col", children: _jsx(SidebarContent, {}) }), _jsxs("div", { className: "md:pl-64 flex flex-col flex-1", children: [_jsxs("div", { className: "sticky top-0 z-30 flex h-16 shrink-0 bg-white shadow-sm border-b border-gray-200", children: [_jsxs("button", { type: "button", className: "border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--color-primary)] md:hidden", onClick: () => setSidebarOpen(true), children: [_jsx("span", { className: "sr-only", children: "Open sidebar" }), _jsx("svg", { className: "h-6 w-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) })] }), _jsxs("div", { className: "flex flex-1 justify-between px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "flex flex-1", children: _jsx("div", { className: "flex items-center", children: _jsx("h1", { className: "text-lg font-semibold text-gray-900", children: navigation.concat(userNavigation).find(item => isActiveRoute(item.href))?.name || 'Dashboard' }) }) }), _jsx("div", { className: "ml-4 flex items-center md:ml-6", children: _jsx(UserButton, { appearance: {
                                                elements: {
                                                    avatarBox: 'w-8 h-8',
                                                },
                                            }, afterSignOutUrl: "/" }) })] })] }), _jsx("main", { className: "flex-1", children: _jsx("div", { className: "py-8 px-4 sm:px-6 lg:px-8", children: children }) })] })] }));
    function SidebarContent() {
        return (_jsxs("div", { className: "flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200", children: [_jsx("div", { className: "flex items-center flex-shrink-0 px-4", children: _jsx("h1", { className: "text-xl font-bold text-[color:var(--color-primary)]", children: "CarrierLLM" }) }), _jsxs("div", { className: "mt-5 flex-1 flex flex-col", children: [_jsx("nav", { className: "flex-1 px-2 space-y-1", children: navigation.map((item) => (_jsxs(NavLink, { to: item.href, className: navLinkClass(item.href), children: [iconMap[item.icon], _jsx("span", { className: "ml-3", children: item.name })] }, item.name))) }), _jsxs("div", { className: "px-2 pb-4", children: [_jsx("div", { className: "border-t border-gray-200 pt-4 space-y-1", children: userNavigation.map((item) => (_jsxs(NavLink, { to: item.href, className: navLinkClass(item.href), children: [iconMap[item.icon], _jsx("span", { className: "ml-3", children: item.name })] }, item.name))) }), _jsx("div", { className: "mt-4 px-2 py-3 bg-gray-50 rounded-md", children: _jsxs("div", { className: "flex items-center", children: [_jsx("img", { className: "h-8 w-8 rounded-full", src: user?.imageUrl || '/default-avatar.png', alt: "" }), _jsxs("div", { className: "ml-3 min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: user?.fullName || user?.emailAddresses[0]?.emailAddress }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: user?.emailAddresses[0]?.emailAddress })] })] }) })] })] })] }));
    }
};
