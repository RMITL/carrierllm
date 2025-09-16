import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@carrierllm/ui';
import { IntakeForm } from '../features/intake/IntakeForm';
import { submitIntake } from '../lib/api';
import { buildMockRecommendation } from '../lib/mock';
import type { IntakeAnswers } from '../types';

export const IntakePage = () => {
  const navigate = useNavigate();
  const { mutateAsync, isPending, isError } = useMutation({
    mutationFn: submitIntake,
    onSuccess: (data) => {
      navigate(`/results/${data.submissionId}`, { state: data });
    },
    onError: () => {
      const fallback = buildMockRecommendation();
      navigate(`/results/${fallback.submissionId}`, { state: fallback });
    }
  });

  const handleSubmit = async (answers: IntakeAnswers) => {
    await mutateAsync(answers);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[color:var(--color-gray-900)]">
          Intake: 8 carrier knockout questions
        </h1>
        <p className="text-sm text-[color:var(--color-gray-500)]">
          Capture the minimum viable underwriting data to generate a carrier fit score with citations.
        </p>
      </header>
      {isError ? (
        <Banner
          variant="warning"
          title="Live recommendation service unavailable"
          description="We generated mock carrier recommendations so you can keep testing the workflow."
        />
      ) : null}
      <IntakeForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
};
