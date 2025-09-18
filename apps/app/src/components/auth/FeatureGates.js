import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Protect, useAuth } from '@clerk/clerk-react';
import { Card, Button } from '@carrierllm/ui';
import { useNavigate } from 'react-router-dom';
/**
 * Gate content by plan using Clerk's native Protect component
 */
export const PlanGate = ({ children, plan, fallback }) => {
    const navigate = useNavigate();
    const defaultFallback = (_jsx(Card, { className: "max-w-md mx-auto my-8", children: _jsxs("div", { className: "p-6 text-center", children: [_jsx("svg", { className: "w-16 h-16 mx-auto mb-4 text-yellow-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Upgrade Required" }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["This feature requires the ", plan, " plan or higher."] }), _jsx(Button, { variant: "primary", onClick: () => navigate('/pricing'), children: "View Plans" })] }) }));
    return (_jsx(Protect, { plan: plan, fallback: fallback || defaultFallback, children: children }));
};
/**
 * Gate content by feature using Clerk's native Protect component
 */
export const FeatureGate = ({ children, feature, fallback }) => {
    const defaultFallback = (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg", children: _jsxs("div", { className: "text-center p-4", children: [_jsx("svg", { className: "w-8 h-8 mx-auto mb-2 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }), _jsx("p", { className: "text-sm font-medium text-gray-700 mb-1", children: "Premium Feature" }), _jsx("p", { className: "text-xs text-gray-500", children: "Upgrade to unlock" })] }) }), _jsx("div", { className: "opacity-50 pointer-events-none", children: children })] }));
    return (_jsx(Protect, { feature: feature, fallback: fallback || defaultFallback, children: children }));
};
/**
 * Hook to check feature/plan access programmatically
 */
export const useFeatureAccess = () => {
    const { has } = useAuth();
    const checkPlan = (plan) => {
        return has?.({ plan }) || false;
    };
    const checkFeature = (feature) => {
        return has?.({ feature }) || false;
    };
    const getPlanLimits = () => {
        // Check plans from highest to lowest tier
        if (has?.({ plan: 'enterprise' })) {
            return { recommendations: -1, teamMembers: 5 }; // unlimited recommendations, 5 seats included
        }
        if (has?.({ plan: 'individual' })) {
            return { recommendations: 100, teamMembers: 1 }; // Higher limit for $50/month
        }
        if (has?.({ plan: 'free_org' })) {
            return { recommendations: 10, teamMembers: 2 };
        }
        // Default to free_user
        return { recommendations: 5, teamMembers: 1 };
    };
    const getPricing = () => {
        return {
            individual: 50,
            enterprise: 150,
            extra_team_seat: 30,
            free_user: 0,
            free_org: 0
        };
    };
    return {
        checkPlan,
        checkFeature,
        getPlanLimits,
        getPricing
    };
};
