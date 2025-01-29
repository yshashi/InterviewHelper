/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'angular-primary': '#EF4444',
        'angular-secondary': '#EC4899',
        'angular-tertiary': '#8B5CF6',
        'angular-dark': '#000000',
        'angular-dark-lighter': '#1a1a1a',
        'angular-text-light': '#ffffff',
        'angular-text-dark': '#e1e1e1',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'mobile-h1': ['1.75rem', '2.25rem'],
        'mobile-h2': ['1.5rem', '2rem'],
        'mobile-base': ['1rem', '1.5rem'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #EF4444, #EC4899, #8B5CF6)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
