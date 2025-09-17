import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { DashboardPage } from './routes/DashboardPage';
import { IntakePage } from './routes/IntakePage';
import { ChatPage } from './routes/ChatPage';
import { ResultsPage } from './routes/ResultsPage';
import { ProfilePage } from './routes/ProfilePage';
import { BillingPage } from './routes/BillingPage';
import { AnalyticsPage } from './routes/AnalyticsPage';
const App = () => {
    return (_jsxs("div", { className: "min-h-screen bg-[color:var(--color-gray-50)]", children: [_jsx(SignedOut, { children: _jsx(AuthLayout, {}) }), _jsx(SignedIn, { children: _jsx(DashboardLayout, { children: _jsx(Suspense, { fallback: _jsx(LoadingSpinner, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/intake", element: _jsx(IntakePage, {}) }), _jsx(Route, { path: "/chat", element: _jsx(ChatPage, {}) }), _jsx(Route, { path: "/results/:id", element: _jsx(ResultsPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "/billing", element: _jsx(BillingPage, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(AnalyticsPage, {}) })] }) }) }) })] }));
};
export default App;
