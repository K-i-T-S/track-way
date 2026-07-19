import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        accent: '#00E5D4',
        muted: '#A0A0A0',
        foreground: '#FFFFFF',
      },
    },
  },
  plugins: [],
}

export default config
