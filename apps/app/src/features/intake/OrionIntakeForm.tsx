import { useState } from 'react';
import { Button } from '@carrierllm/ui';
import type { OrionIntake, OrionCoreIntake } from '../../types';

export interface OrionIntakeFormProps {
  onSubmit: (intake: OrionIntake) => Promise<void> | void;
  isSubmitting?: boolean;
  disabled?: boolean;
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

export const OrionIntakeForm = ({ onSubmit, isSubmitting, disabled }: OrionIntakeFormProps) => {
  const [core, setCore] = useState<OrionCoreIntake>(defaultCoreIntake);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTier2, setShowTier2] = useState(false);
  const [tier2Data, setTier2Data] = useState<any>({});

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
    console.log('OrionIntakeForm: Form submitted');

    if (!validateCore()) {
      console.log('OrionIntakeForm: Validation failed');
      return;
    }

    const tier2Triggered = checkTier2Triggers();
    console.log('OrionIntakeForm: Tier2 triggered:', tier2Triggered, 'showTier2:', showTier2);

    // If tier 2 is triggered but we haven't shown tier 2 questions yet, show them
    if (tier2Triggered && !showTier2) {
      console.log('OrionIntakeForm: Showing tier 2 questions');
      setShowTier2(true);
      return;
    }

    const intake: OrionIntake = {
      core,
      tier2: showTier2 ? tier2Data : undefined,
      validated: true,
      tier2Triggered
    };

    console.log('OrionIntakeForm: Calling onSubmit with intake:', intake);
    await onSubmit(intake);
    console.log('OrionIntakeForm: onSubmit completed');
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

      {checkTier2Triggers() && !showTier2 && (
        <div className="rounded-base border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-medium text-amber-800">Additional questions required</h3>
          <p className="text-sm text-amber-700">
            Based on your answers, we'll need some additional details to provide accurate recommendations.
            Click "Get carrier recommendations" to continue with additional questions.
          </p>
        </div>
      )}

      {/* Tier 2 Questions */}
      {showTier2 && (
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Additional Information Required</h3>
          <p className="text-sm text-gray-600">
            Based on your initial answers, we need some additional details to provide the most accurate recommendations.
          </p>

          {/* Cardiac Details */}
          {core.cardiac?.hasHistory && (
            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Please describe the cardiac condition(s)</span>
                <textarea
                  value={tier2Data.cardiacDetails || ''}
                  onChange={(e) => setTier2Data(prev => ({ ...prev, cardiacDetails: e.target.value }))}
                  className="rounded-base border border-gray-300 px-3 py-2 min-h-[80px]"
                  placeholder="e.g., Heart attack in 2020, stent placement, current medications..."
                />
              </label>
            </div>
          )}

          {/* Diabetes Details */}
          {core.diabetes?.hasCondition && (
            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Diabetes type and management</span>
                <select
                  value={tier2Data.diabetesType || ''}
                  onChange={(e) => setTier2Data(prev => ({ ...prev, diabetesType: e.target.value }))}
                  className="rounded-base border border-gray-300 px-3 py-2"
                >
                  <option value="">Select diabetes type</option>
                  <option value="type1">Type 1 Diabetes</option>
                  <option value="type2">Type 2 Diabetes</option>
                  <option value="gestational">Gestational Diabetes</option>
                  <option value="prediabetes">Prediabetes</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Most recent A1C level (if known)</span>
                <input
                  type="number"
                  step="0.1"
                  min="4"
                  max="15"
                  value={tier2Data.a1c || ''}
                  onChange={(e) => setTier2Data(prev => ({ ...prev, a1c: Number(e.target.value) }))}
                  className="rounded-base border border-gray-300 px-3 py-2"
                  placeholder="e.g., 6.5"
                />
              </label>
            </div>
          )}

          {/* Cancer Details */}
          {core.cancer?.hasHistory && (
            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Cancer type and treatment details</span>
                <textarea
                  value={tier2Data.cancerDetails || ''}
                  onChange={(e) => setTier2Data(prev => ({ ...prev, cancerDetails: e.target.value }))}
                  className="rounded-base border border-gray-300 px-3 py-2 min-h-[80px]"
                  placeholder="e.g., Breast cancer, diagnosed 2019, completed treatment 2020, currently in remission..."
                />
              </label>
            </div>
          )}

          {/* DUI Details */}
          {core.drivingAndRisk.duiHistory && (
            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Number of DUI convictions</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={tier2Data.duiCount || ''}
                  onChange={(e) => setTier2Data(prev => ({ ...prev, duiCount: Number(e.target.value) }))}
                  className="rounded-base border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Date of most recent DUI (approximate)</span>
                <input
                  type="date"
                  value={tier2Data.lastDuiDate || ''}
                  onChange={(e) => setTier2Data(prev => ({ ...prev, lastDuiDate: e.target.value }))}
                  className="rounded-base border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          )}

          {/* High Coverage Amount Details */}
          {core.coverageTarget.amount > 1000000 && (
            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Purpose of high coverage amount</span>
                <select
                  value={tier2Data.coveragePurpose || ''}
                  onChange={(e) => setTier2Data(prev => ({ ...prev, coveragePurpose: e.target.value }))}
                  className="rounded-base border border-gray-300 px-3 py-2"
                >
                  <option value="">Select primary purpose</option>
                  <option value="estate_planning">Estate Planning</option>
                  <option value="business_protection">Business Protection</option>
                  <option value="wealth_transfer">Wealth Transfer</option>
                  <option value="debt_protection">Debt Protection</option>
                  <option value="income_replacement">Income Replacement</option>
                </select>
              </label>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTier2(false)}
            >
              Back to Basic Questions
            </Button>
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isSubmitting || disabled} 
        className="w-full"
        onClick={() => console.log('Button clicked, isSubmitting:', isSubmitting, 'disabled:', disabled)}
      >
        {isSubmitting ? 'Processing...' : 'Get carrier recommendations'}
      </Button>
    </form>
  );
};