/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Grid Break: off-white ground, warm near-black ink, one red.
          bg:        { DEFAULT: '#EFEFED',  dark: '#0A0A0A'  },
          surface:   { DEFAULT: '#E4E4E2',  dark: '#141412'  },
          text:      { DEFAULT: '#16150F',  dark: '#F5F4F0'  },
          muted:     { DEFAULT: '#5F5F5D',  dark: '#93918A'  },
          secondary: { DEFAULT: '#3B3B39',  dark: '#B4B2A9'  },
          accent:    { DEFAULT: '#C41E1E',  dark: '#E5332F'  },
          border:    { DEFAULT: '#C7C7C5',  dark: '#2E2E2B'  },
          strong:    { DEFAULT: '#16150F',  dark: '#F5F4F0'  },
          // the black slab the page ends on, in both themes
          slab:      { DEFAULT: '#0A0A0A',  dark: '#000000'  },
          good:      { DEFAULT: '#15803d',  dark: '#22c55e'  },
        },
      },
      fontFamily: {
        display: ['Switzer', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        body:    ['Switzer', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // Grid Break sets headings tight and heavy; the ramp is the design's.
        'display-sm': ['clamp(30px, 4.4vw, 44px)', { lineHeight: '0.86', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(44px, 7.6vw, 82px)', { lineHeight: '0.86', letterSpacing: '-0.035em' }],
        'display-xl': ['clamp(52px, 9vw, 104px)',  { lineHeight: '0.86', letterSpacing: '-0.035em' }],
        'ov':         ['10px', { lineHeight: '1', letterSpacing: '0.2em' }],
      },
      letterSpacing: {
        tightest: '-0.035em',
      },
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
