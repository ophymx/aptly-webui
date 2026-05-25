import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'hsl(var(--bg))',
          elev: 'hsl(var(--bg-elev))',
          'elev-2': 'hsl(var(--bg-elev-2))',
        },
        paper: {
          DEFAULT: 'hsl(var(--fg))',
          muted: 'hsl(var(--fg-muted))',
          subtle: 'hsl(var(--fg-subtle))',
        },
        rule: {
          DEFAULT: 'hsl(var(--border))',
          strong: 'hsl(var(--border-strong))',
        },
        amber: {
          DEFAULT: 'hsl(var(--accent))',
          soft: 'hsl(var(--accent-soft))',
        },
        ok: 'hsl(var(--ok))',
        warn: 'hsl(var(--warn))',
        err: 'hsl(var(--err))',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', ...defaultTheme.fontFamily.sans],
        mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
        display: ['Newsreader', 'Georgia', 'serif'],
      },
      letterSpacing: {
        kicker: '0.18em',
      },
      fontSize: {
        kicker: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em' }],
      },
      boxShadow: {
        edge: 'inset 0 -1px 0 hsl(var(--border))',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 220ms ease-out both',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
