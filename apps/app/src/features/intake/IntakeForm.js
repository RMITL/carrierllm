import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@carrierllm/ui';
import { defaultIntakeValues, intakeSchema, toIntakeAnswers } from './schema';
const nicotineOptions = [
    { value: 'never', label: 'Never' },
    { value: 'past24Months', label: 'Quit within 24 months' },
    { value: 'current', label: 'Current user' }
];
const coverageTypeOptions = [
    { value: 'health', label: 'Health' },
    { value: 'life', label: 'Life' }
];
export const IntakeForm = ({ onSubmit, isSubmitting }) => {
    const [values, setValues] = useState(defaultIntakeValues);
    const [errors, setErrors] = useState({});
    const updateField = (key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        const parsed = intakeSchema.safeParse(values);
        if (!parsed.success) {
            const flattenedErrors = parsed.error.flatten().fieldErrors;
            const formErrors = {};
            // Convert Zod error format to our error format
            Object.entries(flattenedErrors).forEach(([key, value]) => {
                if (value && value.length > 0) {
                    formErrors[key] = value[0];
                }
            });
            setErrors(formErrors);
            return;
        }
        await onSubmit(toIntakeAnswers(parsed.data));
    };
    return (_jsxs("form", { className: "flex flex-col gap-6", onSubmit: handleSubmit, children: [_jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Date of birth" }), _jsx("input", { type: "date", value: values.dob, onChange: (e) => updateField('dob', e.target.value), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2" }), errors.dob ? _jsx("span", { className: "text-xs text-[color:var(--color-red)]", children: errors.dob }) : null] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "State or province" }), _jsx("input", { type: "text", value: values.state, onChange: (e) => updateField('state', e.target.value), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2", placeholder: "e.g., CA" }), errors.state ? _jsx("span", { className: "text-xs text-[color:var(--color-red)]", children: errors.state }) : null] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Coverage start date" }), _jsx("input", { type: "date", value: values.coverageStart, onChange: (e) => updateField('coverageStart', e.target.value), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2" }), errors.coverageStart ? (_jsx("span", { className: "text-xs text-[color:var(--color-red)]", children: errors.coverageStart })) : null] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Replacing existing coverage?" }), _jsxs("select", { value: values.replacingCoverage ? 'yes' : 'no', onChange: (e) => updateField('replacingCoverage', e.target.value === 'yes'), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2", children: [_jsx("option", { value: "no", children: "No" }), _jsx("option", { value: "yes", children: "Yes" })] })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Nicotine use (last 24 months)" }), _jsx("select", { value: values.nicotineUse, onChange: (e) => updateField('nicotineUse', e.target.value), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2", children: nicotineOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium md:col-span-2", children: [_jsx("span", { children: "Hospitalizations or major conditions (last 2 years)" }), _jsx("textarea", { value: values.majorConditions, onChange: (e) => updateField('majorConditions', e.target.value), className: "min-h-[96px] rounded-base border border-[color:var(--color-gray-100)] px-3 py-2", placeholder: "Optional but helpful context" })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium md:col-span-2", children: [_jsx("span", { children: "Current prescriptions and indications" }), _jsx("textarea", { value: values.prescriptions, onChange: (e) => updateField('prescriptions', e.target.value), className: "min-h-[96px] rounded-base border border-[color:var(--color-gray-100)] px-3 py-2" })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Height (inches)" }), _jsx("input", { type: "number", min: 48, max: 90, value: values.height, onChange: (e) => updateField('height', Number(e.target.value)), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2" })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Weight (lbs)" }), _jsx("input", { type: "number", min: 70, max: 400, value: values.weight, onChange: (e) => updateField('weight', Number(e.target.value)), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2" })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium md:col-span-2", children: [_jsx("span", { children: "DUIs, felonies, or high-risk activities" }), _jsx("textarea", { value: values.riskActivities, onChange: (e) => updateField('riskActivities', e.target.value), className: "min-h-[72px] rounded-base border border-[color:var(--color-gray-100)] px-3 py-2" })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Coverage type" }), _jsx("select", { value: values.coverageType, onChange: (e) => updateField('coverageType', e.target.value), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2", children: coverageTypeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Household income / annual income" }), _jsx("input", { type: "number", min: 0, value: values.householdIncome ?? '', onChange: (e) => updateField('householdIncome', e.target.value ? Number(e.target.value) : undefined), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2", placeholder: "Optional" })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium", children: [_jsx("span", { children: "Occupation" }), _jsx("input", { type: "text", value: values.occupation ?? '', onChange: (e) => updateField('occupation', e.target.value), className: "rounded-base border border-[color:var(--color-gray-100)] px-3 py-2", placeholder: "Optional" })] })] }), _jsx(Button, { type: "submit", disabled: isSubmitting, className: "self-start", children: isSubmitting ? 'Evaluating...' : 'Get carrier recommendations' })] }));
};
