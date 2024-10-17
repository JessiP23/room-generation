/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        float: 'float 3s ease-in-out infinite',
        'room-rotate': 'roomRotate 20s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        roomRotate: {
          '0%, 100%': { transform: 'rotateY(-20deg) rotateX(10deg)' },
          '50%': { transform: 'rotateY(20deg) rotateX(-10deg)' },
        },
      },
    },
  },
  plugins: [],
};
