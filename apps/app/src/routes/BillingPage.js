import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Badge, UsageMeter } from '@carrierllm/ui';
import { getUserUsage } from '../lib/api';
const plans = [
    {
        name: 'Individual',
        price: 29,
        recommendations: 50,
        features: [
            'Up to 50 recommendations per month',
            'Basic carrier database access',
            'Email support',
            'Standard processing time'
        ]
    },
    {
        name: 'Team',
        price: 99,
        recommendations: 200,
        popular: true,
        features: [
            'Up to 200 recommendations per month',
            'Full carrier database access',
            'Priority support',
            'Faster processing',
            'Team collaboration tools',
            'Advanced analytics'
        ]
    },
    {
        name: 'Enterprise',
        price: 299,
        recommendations: 1000,
        features: [
            'Up to 1,000 recommendations per month',
            'Complete carrier database',
            'Dedicated support',
            'Fastest processing',
            'Custom integrations',
            'White-label options',
            'SLA guarantees'
        ]
    }
];
export const BillingPage = () => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const { data: usage, isLoading } = useQuery({
        queryKey: ['user-usage'],
        queryFn: getUserUsage
    });
    const usagePercentage = usage ? (usage.recommendationsUsed / usage.recommendationsLimit) * 100 : 0;
    const handleUpgrade = (planName) => {
        setSelectedPlan(planName);
        // In a real app, this would integrate with Stripe
        alert(`Upgrade to ${planName} plan initiated. This would integrate with Stripe.`);
    };
    const handleDowngrade = () => {
        alert('Downgrade initiated. Changes will take effect at the next billing cycle.');
    };
    const handleCancelSubscription = () => {
        if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
            alert('Subscription cancelled. Access will continue until the end of your billing period.');
        }
    };
    return (_jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Billing & Usage" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage your subscription and monitor your usage." })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Current Plan" }), isLoading ? (_jsxs("div", { className: "animate-pulse space-y-3", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-1/2" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-1/3" })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-xl font-semibold text-gray-900", children: [usage?.plan, " Plan"] }), _jsx("p", { className: "text-sm text-gray-500", children: "Subscription plan" })] }), _jsx(Badge, { variant: usage?.status === 'active' ? 'success' : 'warning', children: usage?.status })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Subscription Status" }), _jsx("p", { className: "font-medium text-gray-900", children: usage?.status || 'N/A' })] }), _jsxs("div", { className: "pt-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Recommendations Used" }), _jsxs("span", { className: "text-sm text-gray-500", children: [usage?.recommendationsUsed, " / ", usage?.recommendationsLimit] })] }), _jsx(UsageMeter, { value: usagePercentage, label: "Monthly usage" }), usagePercentage > 80 && (_jsx("p", { className: "text-sm text-orange-600 mt-2", children: "You're approaching your monthly limit. Consider upgrading to avoid interruptions." }))] })] }))] }), _jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Payment Method" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsxs("svg", { className: "w-8 h-8 text-blue-600", fill: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }), _jsx("path", { d: "M4 8h16v2H4V8z", fill: "white" })] }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 4242" }), _jsx("p", { className: "text-sm text-gray-500", children: "Expires 12/25" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { variant: "secondary", size: "sm", className: "w-full", children: "Update Payment Method" }), _jsx(Button, { variant: "secondary", size: "sm", className: "w-full", children: "Download Invoice" })] })] })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-6", children: "Available Plans" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: plans.map((plan) => (_jsxs(Card, { className: `relative ${plan.popular ? 'border-2 border-[color:var(--color-primary)]' : ''}`, children: [plan.popular && (_jsx("div", { className: "absolute -top-3 left-1/2 transform -translate-x-1/2", children: _jsx(Badge, { variant: "success", children: "Most Popular" }) })), _jsxs("div", { className: "text-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: plan.name }), _jsxs("div", { className: "mt-2", children: [_jsxs("span", { className: "text-3xl font-bold text-gray-900", children: ["$", plan.price] }), _jsx("span", { className: "text-gray-500", children: "/month" })] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [plan.recommendations, " recommendations included"] })] }), _jsx("ul", { className: "space-y-2 mb-6", children: plan.features.map((feature, index) => (_jsxs("li", { className: "flex items-start", children: [_jsx("svg", { className: "w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), _jsx("span", { className: "text-sm text-gray-600", children: feature })] }, index))) }), _jsx(Button, { onClick: () => handleUpgrade(plan.name), variant: usage?.plan === plan.name ? 'secondary' : 'primary', className: "w-full", disabled: usage?.plan === plan.name, children: usage?.plan === plan.name ? 'Current Plan' : 'Upgrade' })] }, plan.name))) })] }), _jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Billing History" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Description" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Amount" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Invoice" })] }) }), _jsxs("tbody", { className: "bg-white divide-y divide-gray-200", children: [_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: "Dec 15, 2024" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: "Team Plan - Monthly" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: "$99.00" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx(Badge, { variant: "success", children: "Paid" }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: _jsx(Button, { variant: "secondary", size: "sm", children: "Download" }) })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: "Nov 15, 2024" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: "Team Plan - Monthly" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: "$99.00" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx(Badge, { variant: "success", children: "Paid" }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: _jsx(Button, { variant: "secondary", size: "sm", children: "Download" }) })] })] })] }) })] }), _jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-medium text-red-600 mb-4", children: "Danger Zone" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between py-3 border-b border-gray-200", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Downgrade Plan" }), _jsx("p", { className: "text-sm text-gray-500", children: "Switch to a lower-tier plan" })] }), _jsx(Button, { variant: "destructive", size: "sm", onClick: handleDowngrade, children: "Downgrade" })] }), _jsxs("div", { className: "flex items-center justify-between py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Cancel Subscription" }), _jsx("p", { className: "text-sm text-gray-500", children: "Permanently cancel your subscription" })] }), _jsx(Button, { variant: "destructive", size: "sm", onClick: handleCancelSubscription, children: "Cancel Subscription" })] })] })] })] }));
};
