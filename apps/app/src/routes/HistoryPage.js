import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from '@carrierllm/ui';
import { getUserHistory } from '../lib/api';
export const HistoryPage = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterType, setFilterType] = useState('all');
    const { data: history = [], isLoading, error } = useQuery({
        queryKey: ['user-history', user?.id],
        queryFn: getUserHistory,
        enabled: !!user?.id,
        staleTime: 30000
    });
    const sortedAndFilteredHistory = history
        .filter(item => filterType === 'all' || item.type === filterType)
        .sort((a, b) => {
        let aValue;
        let bValue;
        switch (sortBy) {
            case 'date':
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
                break;
            case 'type':
                aValue = a.type;
                bValue = b.type;
                break;
            case 'status':
                aValue = a.status || 'unknown';
                bValue = b.status || 'unknown';
                break;
            default:
                return 0;
        }
        if (aValue < bValue)
            return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue)
            return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getStatusBadge = (status) => {
        const statusClass = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            error: 'bg-red-100 text-red-800',
            unknown: 'bg-gray-100 text-gray-800'
        };
        return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass[status] || statusClass.unknown}`, children: status || 'Unknown' }));
    };
    const getTypeIcon = (type) => {
        if (type === 'intake') {
            return (_jsx("svg", { className: "w-5 h-5 text-blue-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }));
        }
        return (_jsx("svg", { className: "w-5 h-5 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }));
    };
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };
    const handleViewDetails = (item) => {
        if (item.type === 'recommendation' && item.recommendationId) {
            navigate(`/results/${item.recommendationId}`);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "max-w-6xl mx-auto", children: _jsx(Card, { children: _jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--color-primary)] mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading history..." })] }) }) }));
    }
    if (error) {
        return (_jsx("div", { className: "max-w-6xl mx-auto", children: _jsx(Card, { children: _jsxs("div", { className: "p-8 text-center", children: [_jsx("svg", { className: "w-12 h-12 text-red-500 mx-auto mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Unable to load history" }), _jsx("p", { className: "text-gray-600 mb-4", children: "There was an error loading your intake and recommendation history." }), _jsx(Button, { onClick: () => window.location.reload(), children: "Try again" })] }) }) }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "History" }), _jsx("p", { className: "text-gray-600", children: "View and manage your previous intakes and recommendations" })] }), _jsxs(Card, { className: "mb-6", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Type:" }), _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent", children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "intake", children: "Intakes" }), _jsx("option", { value: "recommendation", children: "Recommendations" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Sort:" }), _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => handleSort('date'), className: sortBy === 'date' ? 'bg-[color:var(--color-primary)] text-white' : '', children: ["Date ", sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')] }), _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => handleSort('type'), className: sortBy === 'type' ? 'bg-[color:var(--color-primary)] text-white' : '', children: ["Type ", sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')] }), _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => handleSort('status'), className: sortBy === 'status' ? 'bg-[color:var(--color-primary)] text-white' : '', children: ["Status ", sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')] })] })] }) }), _jsx("div", { className: "p-4 bg-gray-50", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["Showing ", sortedAndFilteredHistory.length, " of ", history.length, " items"] }) })] }), sortedAndFilteredHistory.length === 0 ? (_jsx(Card, { children: _jsxs("div", { className: "p-8 text-center", children: [_jsx("svg", { className: "w-12 h-12 text-gray-400 mx-auto mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No history found" }), _jsx("p", { className: "text-gray-600 mb-4", children: filterType === 'all'
                                ? "You haven't created any intakes or recommendations yet."
                                : `No ${filterType}s found.` }), _jsx(Button, { onClick: () => navigate('/intake'), children: "Create Your First Intake" })] }) })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-hidden", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Summary" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: sortedAndFilteredHistory.map((item) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [getTypeIcon(item.type), _jsx("span", { className: "ml-2 text-sm font-medium text-gray-900 capitalize", children: item.type })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(item.createdAt) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: getStatusBadge(item.status) }), _jsxs("td", { className: "px-6 py-4 text-sm text-gray-900", children: [item.type === 'recommendation' && item.summary && (_jsxs("div", { children: [_jsxs("div", { className: "text-sm font-medium", children: [item.summary.eligibleCarriers, " carriers evaluated"] }), item.summary.averageFit && (_jsxs("div", { className: "text-xs text-gray-500", children: ["Avg fit: ", item.summary.averageFit, "%"] }))] })), item.type === 'intake' && (_jsx("div", { className: "text-sm text-gray-600", children: "Client intake form" }))] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [item.type === 'recommendation' && (_jsx(Button, { size: "sm", onClick: () => handleViewDetails(item), className: "mr-2", children: "View Results" })), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => {
                                                        // Optional: Add export/download functionality
                                                        console.log('Export item:', item);
                                                    }, children: "Export" })] })] }, item.id))) })] }) }) }))] }));
};
