import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { global: "window" },
  server: {
    allowedHosts: ['localhost', 'archbox.pw','dashboard.archbox.pw'],
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },
  },
});

