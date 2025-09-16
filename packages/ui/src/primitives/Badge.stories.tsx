import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  args: {
    children: '87% Fit'
  }
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Success: Story = {
  args: {
    variant: 'success'
  }
};

export const Warning: Story = {
  args: {
    variant: 'warning'
  }
};

export const Danger: Story = {
  args: {
    variant: 'danger'
  }
};
