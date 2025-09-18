import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, Banner } from '@carrierllm/ui';
export const AnalyticsPageSimple = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetch('http://127.0.0.1:8787/api/analytics/summary', {
            headers: {
                'X-User-Id': 'test-user'
            }
        })
            .then(res => {
            if (!res.ok)
                throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
            .then(data => {
            console.log('Analytics data received:', data);
            setData(data);
            setLoading(false);
        })
            .catch(err => {
            console.error('Analytics fetch error:', err);
            setError(err.message);
            setLoading(false);
        });
    }, []);
    if (loading) {
        return (_jsx("div", { className: "space-y-6 p-6", children: _jsx("h1", { className: "text-2xl font-bold", children: "Loading Analytics..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "space-y-6 p-6", children: _jsx(Banner, { variant: "error", title: "Analytics Error", description: `Failed to load analytics: ${error}` }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Analytics Dashboard" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Simple analytics display for debugging" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { className: "p-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Total Intakes" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: data?.stats?.totalIntakes || 0 })] }), _jsxs(Card, { className: "p-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Avg Fit Score" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [data?.stats?.averageFitScore || 0, "%"] })] }), _jsxs(Card, { className: "p-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Placement Rate" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [data?.stats?.placementRate || 0, "%"] })] }), _jsxs(Card, { className: "p-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Remaining" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: data?.stats?.remainingRecommendations || 0 })] })] }), data?.topCarriers && data.topCarriers.length > 0 && (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Top Performing Carriers" }), _jsx("div", { className: "space-y-2", children: data.topCarriers.map((carrier, index) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b last:border-0", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs("span", { className: "text-sm font-medium text-gray-500 w-6", children: [index + 1, "."] }), _jsx("span", { className: "ml-2 text-sm font-medium text-gray-900", children: carrier.name })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm text-gray-600", children: [carrier.successRate, "% success"] }), _jsxs("span", { className: "text-xs text-gray-500", children: ["(", carrier.count, " placements)"] })] })] }, carrier.id))) })] })), _jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Debug Info" }), _jsx("pre", { className: "text-xs bg-gray-100 p-2 rounded overflow-auto", children: JSON.stringify(data, null, 2) })] })] }));
};
