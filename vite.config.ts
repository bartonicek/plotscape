import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      formats: ["iife"],
      name: "plotscape",
      fileName: "main",
    },
  },
  plugins: [
    libInjectCss(),
    dts({
      include: ["lib"],
      rollupTypes: true,
    }),
  ],
});
