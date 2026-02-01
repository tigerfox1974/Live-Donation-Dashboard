import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Security headers for production
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    headers: securityHeaders,
  },
  
  // Preview server configuration (production preview)
  preview: {
    headers: securityHeaders,
  },
  
  // Build configuration
  build: {
    // Generate source maps only in development
    sourcemap: process.env.NODE_ENV !== 'production',
    
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    
    // Rollup options
    rollupOptions: {
      output: {
        // Chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  
  // Environment variable prefix
  envPrefix: 'VITE_',
})
