import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 3000,
        open: true,
        proxy: {
            "/api": {
                target: process.env.VITE_PROXY_TARGET || "http://192.168.29.202:5000",
                changeOrigin: true,
            },
            "/admin": {
                target: process.env.VITE_PROXY_TARGET || "http://192.168.29.202:5000",
                changeOrigin: true,
            },
            "/uploads": {
                target: process.env.VITE_PROXY_TARGET || "http://192.168.29.202:5000",
                changeOrigin: true,
            },
        },
    }
})
