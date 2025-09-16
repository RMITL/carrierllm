import { useState } from 'react';
import { Button } from '@carrierllm/ui';
import type { IntakeAnswers } from '../../types';
import {
  defaultIntakeValues,
  intakeSchema,
  type IntakeFormValues,
  toIntakeAnswers
} from './schema';

export interface IntakeFormProps {
  onSubmit: (answers: IntakeAnswers) => Promise<void> | void;
  isSubmitting?: boolean;
}

type Errors = Partial<Record<keyof IntakeFormValues, string>>;

const nicotineOptions = [
  { value: 'never', label: 'Never' },
  { value: 'past24Months', label: 'Quit within 24 months' },
  { value: 'current', label: 'Current user' }
];

const coverageTypeOptions = [
  { value: 'health', label: 'Health' },
  { value: 'life', label: 'Life' }
];

export const IntakeForm = ({ onSubmit, isSubmitting }: IntakeFormProps) => {
  const [values, setValues] = useState<IntakeFormValues>(defaultIntakeValues);
  const [errors, setErrors] = useState<Errors>({});

  const updateField = (key: keyof IntakeFormValues, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = intakeSchema.safeParse(values);

    if (!parsed.success) {
      const formErrors: Errors = parsed.error.flatten().fieldErrors;
      setErrors(formErrors);
      return;
    }

    await onSubmit(toIntakeAnswers(parsed.data));
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Date of birth</span>
          <input
            type="date"
            value={values.dob}
            onChange={(e) => updateField('dob', e.target.value)}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          />
          {errors.dob ? <span className="text-xs text-[color:var(--color-red)]">{errors.dob}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>State or province</span>
          <input
            type="text"
            value={values.state}
            onChange={(e) => updateField('state', e.target.value)}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
            placeholder="e.g., CA"
          />
          {errors.state ? <span className="text-xs text-[color:var(--color-red)]">{errors.state}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Coverage start date</span>
          <input
            type="date"
            value={values.coverageStart}
            onChange={(e) => updateField('coverageStart', e.target.value)}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          />
          {errors.coverageStart ? (
            <span className="text-xs text-[color:var(--color-red)]">{errors.coverageStart}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Replacing existing coverage?</span>
          <select
            value={values.replacingCoverage ? 'yes' : 'no'}
            onChange={(e) => updateField('replacingCoverage', e.target.value === 'yes')}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Nicotine use (last 24 months)</span>
          <select
            value={values.nicotineUse}
            onChange={(e) => updateField('nicotineUse', e.target.value as IntakeFormValues['nicotineUse'])}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          >
            {nicotineOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          <span>Hospitalizations or major conditions (last 2 years)</span>
          <textarea
            value={values.majorConditions}
            onChange={(e) => updateField('majorConditions', e.target.value)}
            className="min-h-[96px] rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
            placeholder="Optional but helpful context"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          <span>Current prescriptions and indications</span>
          <textarea
            value={values.prescriptions}
            onChange={(e) => updateField('prescriptions', e.target.value)}
            className="min-h-[96px] rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Height (inches)</span>
          <input
            type="number"
            min={48}
            max={90}
            value={values.height}
            onChange={(e) => updateField('height', Number(e.target.value))}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Weight (lbs)</span>
          <input
            type="number"
            min={70}
            max={400}
            value={values.weight}
            onChange={(e) => updateField('weight', Number(e.target.value))}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          <span>DUIs, felonies, or high-risk activities</span>
          <textarea
            value={values.riskActivities}
            onChange={(e) => updateField('riskActivities', e.target.value)}
            className="min-h-[72px] rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Coverage type</span>
          <select
            value={values.coverageType}
            onChange={(e) => updateField('coverageType', e.target.value as IntakeFormValues['coverageType'])}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
          >
            {coverageTypeOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Household income / annual income</span>
          <input
            type="number"
            min={0}
            value={values.householdIncome ?? ''}
            onChange={(e) => updateField('householdIncome', e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Occupation</span>
          <input
            type="text"
            value={values.occupation ?? ''}
            onChange={(e) => updateField('occupation', e.target.value)}
            className="rounded-base border border-[color:var(--color-gray-100)] px-3 py-2"
            placeholder="Optional"
          />
        </label>
      </div>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Evaluating...' : 'Get carrier recommendations'}
      </Button>
    </form>
  );
};
