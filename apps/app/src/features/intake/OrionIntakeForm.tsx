import { useState } from 'react';
import { Button } from '@carrierllm/ui';
import type { OrionIntake, OrionCoreIntake } from '../../types';

export interface OrionIntakeFormProps {
  onSubmit: (intake: OrionIntake) => Promise<void> | void;
  isSubmitting?: boolean;
}

const defaultCoreIntake = (): OrionCoreIntake => ({
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

export const OrionIntakeForm = ({ onSubmit, isSubmitting }: OrionIntakeFormProps) => {
  const [core, setCore] = useState<OrionCoreIntake>(defaultCoreIntake);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateCore = (field: keyof OrionCoreIntake, value: any) => {
    setCore(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const updateNestedField = (
    parentField: keyof OrionCoreIntake,
    childField: string,
    value: any
  ) => {
    setCore(prev => {
      const currentParent = prev[parentField] as any;
      return {
        ...prev,
        [parentField]: {
          ...(currentParent && typeof currentParent === 'object' ? currentParent : {}),
          [childField]: value
        }
      };
    });
  };

  const validateCore = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!core.state) newErrors.state = 'State is required';
    if (core.age < 18 || core.age > 85) newErrors.age = 'Age must be between 18-85';
    if (core.height < 48 || core.height > 90) newErrors.height = 'Height must be between 48-90 inches';
    if (core.weight < 70 || core.weight > 400) newErrors.weight = 'Weight must be between 70-400 lbs';
    if (core.coverageTarget.amount < 50000) newErrors.coverage = 'Minimum coverage is $50,000';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkTier2Triggers = (): boolean => {
    return (
      core.diabetes?.hasCondition ||
      core.cardiac?.hasHistory ||
      core.cancer?.hasHistory ||
      core.nicotine.lastUse !== 'never' ||
      core.marijuana.lastUse !== 'never' ||
      core.drivingAndRisk.duiHistory ||
      (core.drivingAndRisk.riskActivities && core.drivingAndRisk.riskActivities.length > 0) ||
      core.coverageTarget.amount > 1000000
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateCore()) return;

    const tier2Triggered = checkTier2Triggers();

    const intake: OrionIntake = {
      core,
      validated: true,
      tier2Triggered
    };

    await onSubmit(intake);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Orion Intake - 8 Essential Questions
        </h2>

        {/* Question 1: Age & State */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            <span>Client's age</span>
            <input
              type="number"
              min={18}
              max={85}
              value={core.age}
              onChange={(e) => updateCore('age', Number(e.target.value))}
              className="rounded-base border border-gray-300 px-3 py-2"
            />
            {errors.age && <span className="text-xs text-red-600">{errors.age}</span>}
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            <span>State of residence</span>
            <input
              type="text"
              value={core.state}
              onChange={(e) => updateCore('state', e.target.value.toUpperCase())}
              className="rounded-base border border-gray-300 px-3 py-2"
              placeholder="e.g., CA"
              maxLength={2}
            />
            {errors.state && <span className="text-xs text-red-600">{errors.state}</span>}
          </label>
        </div>

        {/* Question 2: Height & Weight */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            <span>Height (inches)</span>
            <input
              type="number"
              min={48}
              max={90}
              value={core.height}
              onChange={(e) => updateCore('height', Number(e.target.value))}
              className="rounded-base border border-gray-300 px-3 py-2"
            />
            {errors.height && <span className="text-xs text-red-600">{errors.height}</span>}
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            <span>Weight (pounds)</span>
            <input
              type="number"
              min={70}
              max={400}
              value={core.weight}
              onChange={(e) => updateCore('weight', Number(e.target.value))}
              className="rounded-base border border-gray-300 px-3 py-2"
            />
            {errors.weight && <span className="text-xs text-red-600">{errors.weight}</span>}
          </label>
        </div>

        {/* Question 3: Nicotine Use */}
        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm font-medium">
            <span>Any nicotine use in the last 24 months?</span>
            <select
              value={core.nicotine.lastUse}
              onChange={(e) => updateNestedField('nicotine', 'lastUse', e.target.value)}
              className="rounded-base border border-gray-300 px-3 py-2"
            >
              <option value="never">Never</option>
              <option value="past24Months">Quit within 24 months</option>
              <option value="current">Current user</option>
            </select>
          </label>

          {core.nicotine.lastUse !== 'never' && (
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Type of nicotine product</span>
              <select
                value={core.nicotine.type || ''}
                onChange={(e) => updateNestedField('nicotine', 'type', e.target.value)}
                className="rounded-base border border-gray-300 px-3 py-2"
              >
                <option value="">Select type</option>
                <option value="cigarettes">Cigarettes</option>
                <option value="vape">Vape/E-cigarettes</option>
                <option value="cigars">Cigars</option>
                <option value="chew">Chewing tobacco</option>
                <option value="nrt">Nicotine replacement therapy</option>
              </select>
            </label>
          )}
        </div>

        {/* Question 4: Marijuana Use */}
        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm font-medium">
            <span>Any marijuana use?</span>
            <select
              value={core.marijuana.lastUse}
              onChange={(e) => updateNestedField('marijuana', 'lastUse', e.target.value)}
              className="rounded-base border border-gray-300 px-3 py-2"
            >
              <option value="never">Never</option>
              <option value="past12Months">Used within 12 months</option>
              <option value="current">Current user</option>
            </select>
          </label>

          {core.marijuana.lastUse !== 'never' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Type</span>
                <select
                  value={core.marijuana.type || ''}
                  onChange={(e) => updateNestedField('marijuana', 'type', e.target.value)}
                  className="rounded-base border border-gray-300 px-3 py-2"
                >
                  <option value="">Select type</option>
                  <option value="smoke">Smoking</option>
                  <option value="vape">Vaping</option>
                  <option value="edible">Edibles</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={core.marijuana.medical || false}
                  onChange={(e) => updateNestedField('marijuana', 'medical', e.target.checked)}
                  className="rounded"
                />
                <span>Medical prescription</span>
              </label>
            </div>
          )}
        </div>

        {/* Question 5: Cardiac History */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={core.cardiac?.hasHistory || false}
              onChange={(e) => updateCore('cardiac', {
                hasHistory: e.target.checked,
                ...(e.target.checked ? {} : {})
              })}
              className="rounded"
            />
            <span>Any cardiac history (heart attack, stents, angina, heart failure)?</span>
          </label>
        </div>

        {/* Question 6: Diabetes */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={core.diabetes?.hasCondition || false}
              onChange={(e) => updateCore('diabetes', {
                hasCondition: e.target.checked,
                ...(e.target.checked ? {} : {})
              })}
              className="rounded"
            />
            <span>Any diabetes (Type 1 or 2)?</span>
          </label>
        </div>

        {/* Question 7: Cancer History */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={core.cancer?.hasHistory || false}
              onChange={(e) => updateCore('cancer', {
                hasHistory: e.target.checked,
                ...(e.target.checked ? {} : {})
              })}
              className="rounded"
            />
            <span>Any cancer history?</span>
          </label>
        </div>

        {/* Question 8: DUIs and Risk Activities + Coverage */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={core.drivingAndRisk.duiHistory || false}
              onChange={(e) => updateNestedField('drivingAndRisk', 'duiHistory', e.target.checked)}
              className="rounded"
            />
            <span>Any DUIs?</span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            <span>High-risk activities (aviation, scuba, racing, climbing)</span>
            <textarea
              value={core.drivingAndRisk.details || ''}
              onChange={(e) => updateNestedField('drivingAndRisk', 'details', e.target.value)}
              className="rounded-base border border-gray-300 px-3 py-2 min-h-[80px]"
              placeholder="Describe any high-risk activities..."
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Desired coverage amount</span>
              <input
                type="number"
                min={50000}
                step={25000}
                value={core.coverageTarget.amount}
                onChange={(e) => updateNestedField('coverageTarget', 'amount', Number(e.target.value))}
                className="rounded-base border border-gray-300 px-3 py-2"
              />
              {errors.coverage && <span className="text-xs text-red-600">{errors.coverage}</span>}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Coverage type</span>
              <select
                value={core.coverageTarget.type}
                onChange={(e) => updateNestedField('coverageTarget', 'type', e.target.value)}
                className="rounded-base border border-gray-300 px-3 py-2"
              >
                <option value="iul">Indexed Universal Life (IUL)</option>
                <option value="term">Term Life</option>
                <option value="annuity">Annuity</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {checkTier2Triggers() && (
        <div className="rounded-base border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-medium text-amber-800">Additional questions required</h3>
          <p className="text-sm text-amber-700">
            Based on your answers, we'll need some additional details to provide accurate recommendations.
            This will be collected in the next step.
          </p>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Processing...' : 'Get carrier recommendations'}
      </Button>
    </form>
  );
};