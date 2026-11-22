import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36abfa',
          500: '#0c8ee9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074c84',
          900: '#0c406e',
        },
        purpleBrand: {
          50: '#fbf5ff',
          100: '#f3e7ff',
          200: '#e9d3ff',
          300: '#d6b0ff',
          400: '#bc7dff',
          500: '#a148f9',
          600: '#8c25e8',
          700: '#7919cb',
          800: '#6517a6',
          900: '#531685',
        }
      },
      fontFamily: {
        sans: ['var(--font-kanit)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
