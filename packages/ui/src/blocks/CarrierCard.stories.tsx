import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { CarrierCard } from '../blocks/CarrierCard';

const meta: Meta<typeof CarrierCard> = {
  title: 'Blocks/CarrierCard',
  component: CarrierCard,
  args: {
    carrierName: 'Acme Life',
    program: 'Accelerated UW',
    fitPct: 87,
    reasons: ['Stable coverage history', 'BMI <= 33'],
    onViewSource: fn(),
    onApply: fn()
  }
};

export default meta;

type Story = StoryObj<typeof CarrierCard>;

export const StrongFit: Story = {};

export const MediumFit: Story = {
  args: {
    carrierName: 'Maple Assurance',
    program: 'Standard Advantage',
    fitPct: 65,
    reasons: ['Nicotine-free for 24 months', 'Income matches bracket']
  }
};

export const LowFit: Story = {
  args: {
    carrierName: 'Sentinel Mutual',
    program: 'Premier Health',
    fitPct: 42,
    reasons: ['Recent hospitalization requires review']
  }
};
