/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minecraft-inspired dark stone, bedrock, and emerald tones (no game assets copied)
        mc: {
          bg: "#0c0f10",
          card: "#161b1e",
          cardHover: "#1d2327",
          border: "#283137",
          borderBright: "#3d4b54",
          emerald: "#10b981",
          emeraldDark: "#047857",
          emeraldMuted: "rgba(16, 185, 129, 0.15)",
          gold: "#f59e0b",
          redstone: "#ef4444",
          textMuted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};

