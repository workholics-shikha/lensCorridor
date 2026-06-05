/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: 'hsl(var(--bg))',
                surface: 'hsl(var(--surface))',
                ink: 'hsl(var(--ink))',
                muted: 'hsl(var(--muted))',
                line: 'hsl(var(--line))',
                accent: 'hsl(var(--accent))',
                'accent-soft': 'hsl(var(--accent-soft))',
                warning: 'hsl(var(--warning))',
            },
            borderRadius: {
                lg: '28px',
                md: '18px',
            },
            boxShadow: {
                custom: '0 24px 70px rgba(53, 52, 45, 0.16)',
            },
            fontFamily: {
                fraunces: ['Fraunces', 'serif'],
            },
        },
    },
    plugins: [],
}
