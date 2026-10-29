/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand
        violet: { DEFAULT: '#7C3AED', light: '#A78BFA', deep: '#5B21B6' },
        cyan: { DEFAULT: '#22D3EE', light: '#67E8F9', deep: '#0891B2' },

        // Midnight background layers
        midnight: {
          deep: '#060816',
          main: '#0A1020',
          surface: '#10182B',
          card: '#141E33',
          elevated: '#1B2942',
          input: '#0D1526'
        },

        // Text
        text: {
          primary: '#F7F8FC',
          normal: '#D7DCEA',
          secondary: '#9AA6BF',
          muted: '#68738A',
          disabled: '#4B556B'
        },

        // Roles
        student: { DEFAULT: '#14B8A6', light: '#5EEAD4', dark: '#0F766E' },
        faculty: { DEFAULT: '#7C3AED', light: '#A78BFA', dark: '#5B21B6' },
        admin: { DEFAULT: '#E07A3F', light: '#F4A261', dark: '#B4532A' },

        // Ranks
        rank1: { DEFAULT: '#E8C66A', highlight: '#FFF1B8', dark: '#B68A2B' },
        rank2: { DEFAULT: '#BFC9D9', highlight: '#F1F5F9', dark: '#8894A7' },
        rank3: { DEFAULT: '#C9826B', highlight: '#EAB6A5', dark: '#93523F' },

        // Domains
        domain: {
          cp: '#22D3EE',
          sports: '#F97360',
          cultural: '#D946EF',
          academics: '#5EEAD4',
          technical: '#818CF8'
        },

        // Status
        status: {
          success: '#2DD4BF',
          warning: '#F6C453',
          error: '#F05D5E',
          info: '#38BDF8'
        }
      },
      fontFamily: {
        display: ['"Clash Display"', '"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 45%, #22D3EE 100%)',
        'student-gradient': 'linear-gradient(135deg, #0F766E, #14B8A6, #5EEAD4)',
        'faculty-gradient': 'linear-gradient(135deg, #5B21B6, #7C3AED, #A78BFA)',
        'admin-gradient': 'linear-gradient(135deg, #B4532A, #E07A3F, #F4A261)'
      },
      boxShadow: {
        glass: '0 8px 32px rgba(6,8,22,0.45)',
        'glow-violet': '0 0 24px rgba(124,58,237,0.35)',
        'glow-cyan': '0 0 24px rgba(34,211,238,0.30)',
        'glow-teal': '0 0 24px rgba(20,184,166,0.30)',
        'glow-copper': '0 0 24px rgba(224,122,63,0.30)'
      },
      borderColor: {
        standard: 'rgba(255,255,255,0.07)',
        glass: 'rgba(255,255,255,0.12)',
        hover: 'rgba(255,255,255,0.18)',
        'violet-active': 'rgba(167,139,250,0.65)'
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-glow': { '0%,100%': { opacity: 0.5 }, '50%': { opacity: 1 } },
        'grain-shift': { '0%': { transform: 'translate(0,0)' }, '100%': { transform: 'translate(-4%,-4%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite'
      }
    }
  },
  plugins: []
};
