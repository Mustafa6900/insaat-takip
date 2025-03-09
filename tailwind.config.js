/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        pulse: {
          '0%, 20%': { transform: 'scale(1)' },
          '60%': { transform: 'scale(1.1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translate(10px)' },
          '75%': { transform: 'translate(-10px)' },
        },
        fadeInDown: {
          from: {
            opacity: 0,
            transform: 'translateY(-20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        fadeInUp: {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        pulse: 'pulse 3s ease-in-out infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        fadeInDown: 'fadeInDown 1.5s ease-out forwards',
        fadeInUp: 'fadeInUp 1.5s ease-out forwards',
      },
      screens: {
        'sm': '340px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};
