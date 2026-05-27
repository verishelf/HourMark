/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        card: "#0A0A0A",
        border: "#1A1A1A",
        primary: "#FFFFFF",
        secondary: "#A1A1AA",
        muted: "#71717A",
      },
      fontFamily: {
        sans: ["System"],
        display: ["System"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        luxury: "12px",
        "luxury-lg": "16px",
      },
    },
  },
  plugins: [],
};
