import type { Meta, StoryObj } from '@storybook/react';
import { Banner } from './Banner';

const meta: Meta<typeof Banner> = {
  title: 'Primitives/Banner',
  component: Banner,
  args: {
    title: 'Processing application',
    description: 'We are cross-checking the underwriting guidelines for edge cases.'
  }
};

export default meta;

type Story = StoryObj<typeof Banner>;

export const Info: Story = {
  args: {
    variant: 'info'
  }
};

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

export const Error: Story = {
  args: {
    variant: 'error'
  }
};
