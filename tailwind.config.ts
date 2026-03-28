import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./reminder/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne:   ["var(--font-syne)", "sans-serif"],
        dm:     ["var(--font-dm-sans)", "sans-serif"],
      },
      colors: {
        brand: {
          bg:     "#0d0f14",
          bg2:    "#13161e",
          sidebar:"#0a0c10",
          card:   "#181c26",
          border: "#232840",
          border2:"#2d3352",
          blue:   "#4f8ef7",
          cyan:   "#22d3ee",
          orange: "#fb923c",
          green:  "#34d399",
          red:    "#f87171",
          yellow: "#fbbf24",
          purple: "#a78bfa",
                    text:   "#e8eaf2",
          text2:  "#a1a8c6",
          text3:  "#8890aa",
          text4:  "#565e7a",
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(79, 142, 247, 0.3)',
        'glow-lg': '0 0 40px rgba(79, 142, 247, 0.4)',
        'glow-xl': '0 0 60px rgba(79, 142, 247, 0.5)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(79, 142, 247, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(79, 142, 247, 0.6)' },
        }
      },
    },
  },
  plugins: [],
};

export default config;