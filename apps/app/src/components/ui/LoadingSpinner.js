import { jsx as _jsx } from "react/jsx-runtime";
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    return (_jsx("div", { className: `flex items-center justify-center p-8 ${className}`, children: _jsx("div", { className: `${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-[color:var(--color-primary)]`, role: "status", "aria-label": "Loading", children: _jsx("span", { className: "sr-only", children: "Loading..." }) }) }));
};
