import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-text)',
        brandColor1: 'var(--brandColor1)',
        brandColor2: 'var(--brandColor2)',
        brandColor3: 'var(--brandColor3)',
        brandColor4: 'var(--brandColor4)',
        brandColor5: 'var(--brandColor5)',
      },
      minHeight: {
        'screen': '100vh',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
};

export default config;
