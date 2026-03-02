import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'url';
// import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

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
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || '';
          
          // Chỉ xử lý các request không phải file (không có dấu chấm) và không phải API
          if (url.includes('.') || url.startsWith('/api') || url.startsWith('/@') || url.startsWith('/src') || url.startsWith('/node_modules')) {
            return next();
          }

          let targetHtml = '';
          if (url.startsWith('/point')) {
            targetHtml = 'point.html';
          } else if (url.startsWith('/chat')) {
            targetHtml = 'chat.html';
          } else if (url.startsWith('/login')) {
            targetHtml = 'login.html';
          } else {
            // Tất cả các route khác (/, /users, /work-tables, v.v.)
            targetHtml = 'dashboard.html';
          }

          if (targetHtml) {
            try {
              const htmlPath = path.resolve(__dirname, targetHtml);
              if (fs.existsSync(htmlPath)) {
                let html = fs.readFileSync(htmlPath, 'utf-8');
                // Quan trọng: Sử dụng transformIndexHtml để Vite chèn các script/style cần thiết cho dev mode
                html = await server.transformIndexHtml(url, html);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(html);
                return;
              }
            } catch (e) {
              console.error('Error serving HTML:', e);
            }
          }
          
          next();
        });
      }
    },
    react(), tailwindcss()
  ],

  define: { global: "window" },
  server: {
    port: 5174,
    allowedHosts: ['localhost', 'archbox.pw','dashboard.archbox.pw','admake.vn','quanly.admake.vn'],
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

