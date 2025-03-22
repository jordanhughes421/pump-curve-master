import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brandColor1: 'var(--brandColor1)',
        brandColor2: 'var(--brandColor2)',
        brandColor3: 'var(--brandColor3)',
        brandColor4: 'var(--brandColor4)',
        brandColor5: 'var(--brandColor5)',
      },
    },
  },
  plugins: [],
};
export default config;
