import type { Meta, StoryObj } from '@storybook/react';
import { UsageMeter } from '../blocks/UsageMeter';

const meta: Meta<typeof UsageMeter> = {
  title: 'Blocks/UsageMeter',
  component: UsageMeter,
  args: {
    value: 60,
    label: 'Recommendations used'
  }
};

export default meta;

type Story = StoryObj<typeof UsageMeter>;

export const Default: Story = {};

export const NearLimit: Story = {
  args: {
    value: 88
  }
};

export const OverLimit: Story = {
  args: {
    value: 110,
    max: 100
  }
};
