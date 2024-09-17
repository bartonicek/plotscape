// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "file:///home/adam/Documents/2024/programming/packages/plotscape/node_modules/vite/dist/node/index.js";
import dts from "file:///home/adam/Documents/2024/programming/packages/plotscape/node_modules/vite-plugin-dts/dist/index.mjs";
import { libInjectCss } from "file:///home/adam/Documents/2024/programming/packages/plotscape/node_modules/vite-plugin-lib-inject-css/dist/index.js";
var __vite_injected_original_dirname = "/home/adam/Documents/2024/programming/packages/plotscape";
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "lib/main.ts"),
      formats: ["es", "iife"],
      name: "plotscape",
      fileName: "main"
    }
  },
  plugins: [
    libInjectCss(),
    dts({
      include: ["lib"],
      rollupTypes: true
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9hZGFtL0RvY3VtZW50cy8yMDI0L3Byb2dyYW1taW5nL3BhY2thZ2VzL3Bsb3RzY2FwZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvYWRhbS9Eb2N1bWVudHMvMjAyNC9wcm9ncmFtbWluZy9wYWNrYWdlcy9wbG90c2NhcGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvYWRhbS9Eb2N1bWVudHMvMjAyNC9wcm9ncmFtbWluZy9wYWNrYWdlcy9wbG90c2NhcGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgZHRzIGZyb20gXCJ2aXRlLXBsdWdpbi1kdHNcIjtcbmltcG9ydCB7IGxpYkluamVjdENzcyB9IGZyb20gXCJ2aXRlLXBsdWdpbi1saWItaW5qZWN0LWNzc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCBcImxpYi9tYWluLnRzXCIpLFxuICAgICAgZm9ybWF0czogW1wiZXNcIiwgXCJpaWZlXCJdLFxuICAgICAgbmFtZTogXCJwbG90c2NhcGVcIixcbiAgICAgIGZpbGVOYW1lOiBcIm1haW5cIixcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgbGliSW5qZWN0Q3NzKCksXG4gICAgZHRzKHtcbiAgICAgIGluY2x1ZGU6IFtcImxpYlwiXSxcbiAgICAgIHJvbGx1cFR5cGVzOiB0cnVlLFxuICAgIH0pLFxuICBdLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBWLFNBQVMsZUFBZTtBQUNsWCxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFDaEIsU0FBUyxvQkFBb0I7QUFIN0IsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLGFBQWE7QUFBQSxNQUN2QyxTQUFTLENBQUMsTUFBTSxNQUFNO0FBQUEsTUFDdEIsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxhQUFhO0FBQUEsSUFDYixJQUFJO0FBQUEsTUFDRixTQUFTLENBQUMsS0FBSztBQUFBLE1BQ2YsYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBLEVBQ0g7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
