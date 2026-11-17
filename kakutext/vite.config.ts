import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router-dom)/,
            },
            {
              name: 'tiptap-editor',
              test: /node_modules[\\/](@tiptap|prosemirror|tiptap-markdown)/,
            },
            {
              name: 'supabase',
              test: /node_modules[\\/]@supabase/,
            },
            {
              name: 'ui-motion',
              test: /node_modules[\\/](framer-motion|lucide-react)/,
            },
          ],
        },
      },
    },
  },
});