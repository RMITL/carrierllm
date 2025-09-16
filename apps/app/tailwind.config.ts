import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-700': 'var(--color-primary-700)',
        gray: {
          100: 'var(--color-gray-100)',
          500: 'var(--color-gray-500)',
          900: 'var(--color-gray-900)'
        },
        success: 'var(--color-green)',
        warning: 'var(--color-amber)',
        danger: 'var(--color-red)'
      },
      fontFamily: {
        sans: ["'Inter'", 'sans-serif']
      },
      boxShadow: {
        card: 'var(--shadow-card)'
      },
      borderRadius: {
        base: 'var(--border-radius-base)'
      }
    }
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        body: {
          backgroundColor: '#ffffff'
        }
      });
    })
  ]
};

export default config;
