import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@carrierllm/ui';
const defaultCoreIntake = () => ({
    age: 35,
    state: '',
    height: 70,
    weight: 180,
    nicotine: {
        lastUse: 'never'
    },
    marijuana: {
        lastUse: 'never'
    },
    drivingAndRisk: {},
    coverageTarget: {
        amount: 500000,
        type: 'iul'
    }
});
export const OrionIntakeForm = ({ onSubmit, isSubmitting }) => {
    const [core, setCore] = useState(defaultCoreIntake);
    const [errors, setErrors] = useState({});
    const updateCore = (field, value) => {
        setCore(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    };
    const updateNestedField = (parentField, childField, value) => {
        setCore(prev => {
            const currentParent = prev[parentField];
            return {
                ...prev,
                [parentField]: {
                    ...(currentParent && typeof currentParent === 'object' ? currentParent : {}),
                    [childField]: value
                }
            };
        });
    };
    const validateCore = () => {
        const newErrors = {};
        if (!core.state)
            newErrors.state = 'State is required';
        if (core.age < 18 || core.age > 85)
            newErrors.age = 'Age must be between 18-85';
        if (core.height < 48 || core.height > 90)
            newErrors.height = 'Height must be between 48-90 inches';
        if (core.weight < 70 || core.weight > 400)
            newErrors.weight = 'Weight must be between 70-400 lbs';
        if (core.coverageTarget.amount < 50000)
            newErrors.coverage = 'Minimum coverage is $50,000';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const checkTier2Triggers = () => {
        return (core.diabetes?.hasCondition ||
            core.cardiac?.hasHistory ||
            core.cancer?.hasHistory ||
            core.nicotine.lastUse !== 'never' ||
            core.marijuana.lastUse !== 'never' ||
            core.drivingAndRisk.duiHistory ||
            (core.drivingAndRisk.riskActivities && core.drivingAndRisk.riskActivities.length > 0) ||
            core.coverageTarget.amount > 1000000);
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateCore())
            return;
        const tier2Triggered = checkTier2Triggers();
        const intake = {
            core,
            validated: true,
            tier2Triggered
        };
        await onSubmit(intake);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Orion Intake - 8 Essential Questions" }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Client's age" }), _jsx("input", { type: "number", min: 18, max: 85, value: core.age, onChange: (e) => updateCore('age', Number(e.target.value)), className: "rounded-base border border-gray-300 px-3 py-2" }), errors.age && _jsx("span", { className: "text-xs text-red-600", children: errors.age })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "State of residence" }), _jsx("input", { type: "text", value: core.state, onChange: (e) => updateCore('state', e.target.value.toUpperCase()), className: "rounded-base border border-gray-300 px-3 py-2", placeholder: "e.g., CA", maxLength: 2 }), errors.state && _jsx("span", { className: "text-xs text-red-600", children: errors.state })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Height (inches)" }), _jsx("input", { type: "number", min: 48, max: 90, value: core.height, onChange: (e) => updateCore('height', Number(e.target.value)), className: "rounded-base border border-gray-300 px-3 py-2" }), errors.height && _jsx("span", { className: "text-xs text-red-600", children: errors.height })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Weight (pounds)" }), _jsx("input", { type: "number", min: 70, max: 400, value: core.weight, onChange: (e) => updateCore('weight', Number(e.target.value)), className: "rounded-base border border-gray-300 px-3 py-2" }), errors.weight && _jsx("span", { className: "text-xs text-red-600", children: errors.weight })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Any nicotine use in the last 24 months?" }), _jsxs("select", { value: core.nicotine.lastUse, onChange: (e) => updateNestedField('nicotine', 'lastUse', e.target.value), className: "rounded-base border border-gray-300 px-3 py-2", children: [_jsx("option", { value: "never", children: "Never" }), _jsx("option", { value: "past24Months", children: "Quit within 24 months" }), _jsx("option", { value: "current", children: "Current user" })] })] }), core.nicotine.lastUse !== 'never' && (_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Type of nicotine product" }), _jsxs("select", { value: core.nicotine.type || '', onChange: (e) => updateNestedField('nicotine', 'type', e.target.value), className: "rounded-base border border-gray-300 px-3 py-2", children: [_jsx("option", { value: "", children: "Select type" }), _jsx("option", { value: "cigarettes", children: "Cigarettes" }), _jsx("option", { value: "vape", children: "Vape/E-cigarettes" }), _jsx("option", { value: "cigars", children: "Cigars" }), _jsx("option", { value: "chew", children: "Chewing tobacco" }), _jsx("option", { value: "nrt", children: "Nicotine replacement therapy" })] })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Any marijuana use?" }), _jsxs("select", { value: core.marijuana.lastUse, onChange: (e) => updateNestedField('marijuana', 'lastUse', e.target.value), className: "rounded-base border border-gray-300 px-3 py-2", children: [_jsx("option", { value: "never", children: "Never" }), _jsx("option", { value: "past12Months", children: "Used within 12 months" }), _jsx("option", { value: "current", children: "Current user" })] })] }), core.marijuana.lastUse !== 'never' && (_jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Type" }), _jsxs("select", { value: core.marijuana.type || '', onChange: (e) => updateNestedField('marijuana', 'type', e.target.value), className: "rounded-base border border-gray-300 px-3 py-2", children: [_jsx("option", { value: "", children: "Select type" }), _jsx("option", { value: "smoke", children: "Smoking" }), _jsx("option", { value: "vape", children: "Vaping" }), _jsx("option", { value: "edible", children: "Edibles" })] })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx("input", { type: "checkbox", checked: core.marijuana.medical || false, onChange: (e) => updateNestedField('marijuana', 'medical', e.target.checked), className: "rounded" }), _jsx("span", { children: "Medical prescription" })] })] }))] }), _jsx("div", { className: "space-y-3", children: _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx("input", { type: "checkbox", checked: core.cardiac?.hasHistory || false, onChange: (e) => updateCore('cardiac', {
                                        hasHistory: e.target.checked,
                                        ...(e.target.checked ? {} : {})
                                    }), className: "rounded" }), _jsx("span", { children: "Any cardiac history (heart attack, stents, angina, heart failure)?" })] }) }), _jsx("div", { className: "space-y-3", children: _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx("input", { type: "checkbox", checked: core.diabetes?.hasCondition || false, onChange: (e) => updateCore('diabetes', {
                                        hasCondition: e.target.checked,
                                        ...(e.target.checked ? {} : {})
                                    }), className: "rounded" }), _jsx("span", { children: "Any diabetes (Type 1 or 2)?" })] }) }), _jsx("div", { className: "space-y-3", children: _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx("input", { type: "checkbox", checked: core.cancer?.hasHistory || false, onChange: (e) => updateCore('cancer', {
                                        hasHistory: e.target.checked,
                                        ...(e.target.checked ? {} : {})
                                    }), className: "rounded" }), _jsx("span", { children: "Any cancer history?" })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx("input", { type: "checkbox", checked: core.drivingAndRisk.duiHistory || false, onChange: (e) => updateNestedField('drivingAndRisk', 'duiHistory', e.target.checked), className: "rounded" }), _jsx("span", { children: "Any DUIs?" })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "High-risk activities (aviation, scuba, racing, climbing)" }), _jsx("textarea", { value: core.drivingAndRisk.details || '', onChange: (e) => updateNestedField('drivingAndRisk', 'details', e.target.value), className: "rounded-base border border-gray-300 px-3 py-2 min-h-[80px]", placeholder: "Describe any high-risk activities..." })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Desired coverage amount" }), _jsx("input", { type: "number", min: 50000, step: 25000, value: core.coverageTarget.amount, onChange: (e) => updateNestedField('coverageTarget', 'amount', Number(e.target.value)), className: "rounded-base border border-gray-300 px-3 py-2" }), errors.coverage && _jsx("span", { className: "text-xs text-red-600", children: errors.coverage })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Coverage type" }), _jsxs("select", { value: core.coverageTarget.type, onChange: (e) => updateNestedField('coverageTarget', 'type', e.target.value), className: "rounded-base border border-gray-300 px-3 py-2", children: [_jsx("option", { value: "iul", children: "Indexed Universal Life (IUL)" }), _jsx("option", { value: "term", children: "Term Life" }), _jsx("option", { value: "annuity", children: "Annuity" })] })] })] })] })] }), checkTier2Triggers() && (_jsxs("div", { className: "rounded-base border border-amber-200 bg-amber-50 p-4", children: [_jsx("h3", { className: "font-medium text-amber-800", children: "Additional questions required" }), _jsx("p", { className: "text-sm text-amber-700", children: "Based on your answers, we'll need some additional details to provide accurate recommendations. This will be collected in the next step." })] })), _jsx(Button, { type: "submit", disabled: isSubmitting, className: "w-full", children: isSubmitting ? 'Processing...' : 'Get carrier recommendations' })] }));
};
