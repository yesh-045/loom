/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Config } from "tailwindcss";

const svgToDataUri = require("mini-svg-data-uri");
const tailwindAnimate = require("tailwindcss-animate");
 
// const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");
 

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
		fontFamily: {
			sans: [
				'var(--font-geist-sans)',
				'var(--font-inter)',
				'var(--font-dm-sans)',
				'system-ui',
				'-apple-system',
				'Segoe UI',
				'Roboto',
				'Helvetica',
				'Arial',
				'sans-serif',
			],
			heading: [
				'var(--font-space-grotesk)',
				'var(--font-dm-sans)',
				'var(--font-inter)',
				'system-ui',
				'sans-serif',
			],
			brand: [
				'var(--font-outfit)',
				'var(--font-space-grotesk)',
				'system-ui',
				'sans-serif',
			],
			mono: [
				'var(--font-geist-mono)',
				'ui-monospace',
				'SFMono-Regular',
				'Menlo',
				'Monaco',
				'Consolas',
				'monospace',
			],
		},
  		colors: {
			// Use raw CSS color variables (can be hex/rgb/hsl)
			background: 'var(--background)',
			foreground: 'var(--foreground)',
  			card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
  			},
  			popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
  			},
  			primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
  			},
  			muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
  			},
  			accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
  			},
  			destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)'
  			},
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
  			chart: {
					'1': 'var(--chart-1)',
					'2': 'var(--chart-2)',
					'3': 'var(--chart-3)',
					'4': 'var(--chart-4)',
					'5': 'var(--chart-5)'
  			}
				,
				// Custom brand palette
				taupe: {
					DEFAULT: '#463f3a',
					100: '#0e0d0c',
					200: '#1c1917',
					300: '#2a2623',
					400: '#38322e',
					500: '#463f3a',
					600: '#6f645d',
					700: '#978b82',
					800: '#b9b1ac',
					900: '#dcd8d5',
				},
				battleship_gray: {
					DEFAULT: '#8a817c',
					100: '#1c1a18',
					200: '#373331',
					300: '#534d49',
					400: '#6e6662',
					500: '#8a817c',
					600: '#a19995',
					700: '#b9b3b0',
					800: '#d0ccca',
					900: '#e8e6e5',
				},
				silver: {
					DEFAULT: '#bcb8b1',
					100: '#282622',
					200: '#4f4b44',
					300: '#777165',
					400: '#9c958a',
					500: '#bcb8b1',
					600: '#cac7c1',
					700: '#d8d5d1',
					800: '#e5e3e0',
					900: '#f2f1f0',
				},
				isabelline: {
					DEFAULT: '#f4f3ee',
					100: '#3b3726',
					200: '#756e4d',
					300: '#a8a17a',
					400: '#cfcab5',
					500: '#f4f3ee',
					600: '#f7f6f3',
					700: '#f9f8f6',
					800: '#fbfbf9',
					900: '#fdfdfc',
				},
				melon: {
					DEFAULT: '#743825',
					100: '#3a1c13',
					200: '#743825',
					300: '#ad5438',
					400: '#cd7d65',
					500: '#e0afa0',
					600: '#e6beb2',
					700: '#eccec5',
					800: '#f3dfd8',
					900: '#f9efec',
				},
  		},
  		borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
		tailwindAnimate,
		function ({ matchUtilities, theme }: any) {
      matchUtilities(
        {
          "bg-grid": (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-grid-small": (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-dot": (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme("backgroundColor")), type: "color" }
      );
    },
	],
};
export default config;
