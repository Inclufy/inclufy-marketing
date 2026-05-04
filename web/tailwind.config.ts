import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF3ED',
          100: '#FFE4D4',
          200: '#FFC4A8',
          300: '#FF9B70',
          400: '#FF6B35',  /* Inclufy Marketing primary */
          500: '#F04E12',
          600: '#E13508',
          700: '#BA2709',
          800: '#94210F',
          900: '#781E10',
        },
        /* Inclufy Ecosystem Brandbook */
        'inclufy-primary': '#1A237E',
        'inclufy-green': '#4CAF50',
        'inclufy-blue': '#2196F3',
        'inclufy-orange': '#FF6B35',
        'inclufy-purple': '#9C27B0',
        'inclufy-operations': '#E65100',
        'inclufy-hub': '#37474F',
        'inclufy-teal': '#00897B',
        'inclufy-navy': '#1E2761',
      },
    },
  },
  plugins: [],
};

export default config;
