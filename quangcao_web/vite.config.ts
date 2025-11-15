import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'url';
// import react from '@vitejs/plugin-react';
import path from 'path';

// import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    {
      name: 'rewrite-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/dashboard')) {
            req.url = '/dashboard.html'; // rewrite về file entry chính của dashboard
          } else if (req.url?.startsWith('/point')) {
            req.url = '/point.html'; // rewrite về file entry chính của dashboard
          } else if (req.url?.startsWith('/chat')) {
            req.url = '/chat.html'; // rewrite về file entry chính của dashboard
          } else if (req.url?.startsWith('/login')) {
            req.url = '/login.html'; // rewrite về file entry chính của dashboard
          }else if (req.url === '/' || req.url === '') {
            req.url = '/dashboard.html';
          }
          next();
        });
      }
    },
    react(), tailwindcss()
  ],

  define: { global: "window" },
  server: {
    allowedHosts: ['localhost', 'archbox.pw','dashboard.archbox.pw','quanly.admake.vn'],
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },

    middlewareMode: false,
    
  },
  build: {
    rollupOptions: {
      input: {
        // dashboard: fileURLToPath(new URL('./src/dashboard/main.tsx', import.meta.url)),
        // login: fileURLToPath(new URL('./src/login/main.tsx', import.meta.url)),
        // chat: fileURLToPath(new URL('./src/groupchat/main.tsx', import.meta.url)),
        // point: fileURLToPath(new URL('./src/point/main.tsx', import.meta.url)),
        dashboard: path.resolve(__dirname, 'dashboard.html'),
        chat: path.resolve(__dirname, 'chat.html'),
        point: path.resolve(__dirname, 'point.html'),
        login: path.resolve(__dirname, 'login.html'),
      }
    },
    outDir: 'dist',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    dedupe: ['@emotion/react'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },

  
});

