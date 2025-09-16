import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  args: {
    title: 'Underwriting update',
    description: 'Carrier updated BMI thresholds for accelerated underwriting.'
  }
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: <p className="text-sm text-[color:var(--color-gray-500)]">Upload the revised PDF to keep the knowledge base fresh.</p>,
    footer: <Button variant="secondary">Upload doc</Button>
  }
};
