import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        muted: '#777272',
        brand: '#bf2026',
        surface: '#fffafa',
      },
      boxShadow: { soft: '0 12px 36px rgba(24, 12, 12, .07)' },
    },
  },
  plugins: [],
};

export default config;
