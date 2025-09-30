import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    {
      name: 'jsx-in-js',
      async transform(code, id) {
        if (id.endsWith('.js')) {
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          });
        }
      },
    },
    
    
    
    react(), tailwindcss()],

  define: { global: "window" },
  server: {
    allowedHosts: ['localhost', 'archbox.pw','dashboard.archbox.pw'],
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    dedupe: ['@emotion/react']
  }
});

