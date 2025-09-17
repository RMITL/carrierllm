import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@carrierllm/ui';
import { OrionIntakeForm } from '../features/intake/OrionIntakeForm';
import { submitOrionIntake } from '../lib/api';
export const IntakePage = () => {
    const navigate = useNavigate();
    const { mutateAsync, isPending, isError, error } = useMutation({
        mutationFn: submitOrionIntake,
        onSuccess: (data) => {
            navigate(`/results/${data.recommendationId}`, { state: data });
        }
    });
    const handleSubmit = async (intake) => {
        await mutateAsync(intake);
    };
    return (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsxs("header", { className: "flex flex-col gap-2", children: [_jsx("h1", { className: "text-2xl font-semibold text-[color:var(--color-gray-900)]", children: "Intake: 8 carrier knockout questions" }), _jsx("p", { className: "text-sm text-[color:var(--color-gray-500)]", children: "Capture the minimum viable underwriting data to generate a carrier fit score with citations." })] }), isError ? (_jsx(Banner, { variant: "error", title: "Recommendation service error", description: `Failed to process intake: ${error?.message || 'Unknown error'}. Please try again.` })) : null, _jsx(OrionIntakeForm, { onSubmit: handleSubmit, isSubmitting: isPending })] }));
};
