import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@carrierllm/ui';
import { OrionIntakeForm } from '../features/intake/OrionIntakeForm';
import { submitOrionIntake } from '../lib/api';
import type { OrionIntake } from '../types';

export const IntakePage = () => {
  const navigate = useNavigate();
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: submitOrionIntake,
    onSuccess: (data) => {
      navigate(`/results/${data.recommendationId}`, { state: data });
    }
  });

  const handleSubmit = async (intake: OrionIntake) => {
    await mutateAsync(intake);
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
          variant="error"
          title="Recommendation service error"
          description={`Failed to process intake: ${error?.message || 'Unknown error'}. Please try again.`}
        />
      ) : null}
      <OrionIntakeForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
};
