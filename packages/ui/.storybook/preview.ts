import type { Preview } from '@storybook/react';
import '@carrierllm/theme/css';
import '../src/styles/storybook.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FFFFFF' },
        { name: 'subtle', value: '#F5F7FA' }
      ]
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    }
  }
};

export default preview;
