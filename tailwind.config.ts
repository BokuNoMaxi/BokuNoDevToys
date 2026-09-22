import type { Config } from 'tailwindcss';

export default {
	theme: {
		colors: {
			slate: {
				50: '#f8f9fb',
				100: '#f1f3f8',
				200: '#d9dfe8',
				300: '#c1cad8',
				400: '#8b96b0',
				500: '#555c7a',
				600: '#3d4254',
				700: '#2a2d3e',
				800: '#1a1c2e',
				900: '#0f101c',
				950: '#020617'
			},
			violet: {
				50: '#faf5ff',
				100: '#f3e8ff',
				200: '#e9d5ff',
				300: '#d8b4fe',
				400: '#c084fc',
				500: '#a855f7',
				600: '#8b5cf6',
				700: '#7e22ce',
				800: '#6b21a8',
				900: '#581c87'
			},
			amber: {
				50: '#fffbeb',
				100: '#fef3c7',
				200: '#fde68a',
				300: '#fcd34d',
				400: '#fbbf24',
				500: '#f59e0b',
				600: '#d97706',
				700: '#b45309',
				800: '#92400e',
				900: '#78350f'
			},
			white: '#ffffff',
			transparent: 'transparent',
			red: {
				50: '#fef2f2',
				100: '#fee2e2',
				200: '#fecaca',
				300: '#fca5a5',
				400: '#f87171',
				500: '#ef4444',
				600: '#dc2626',
				700: '#b91c1c',
				800: '#991b1b',
				900: '#7f1d1d'
			},
			emerald: {
				50: '#f0fdf4',
				100: '#dcfce7',
				200: '#bbf7d0',
				300: '#86efac',
				400: '#4ade80',
				500: '#22c55e',
				600: '#16a34a',
				700: '#15803d',
				800: '#166534',
				900: '#145231'
			},
			sky: {
				50: '#f0f9ff',
				100: '#e0f2fe',
				200: '#bae6fd',
				300: '#7dd3fc',
				400: '#38bdf8',
				500: '#0ea5e9',
				600: '#0284c7',
				700: '#0369a1',
				800: '#075985',
				900: '#0c4a6e'
			}
		},
		fontFamily: {
			sans: [
				'Inter',
				'system-ui',
				'-apple-system',
				'BlinkMacSystemFont',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'"Noto Sans"',
				'sans-serif'
			]
		}
	}
} satisfies Config;
