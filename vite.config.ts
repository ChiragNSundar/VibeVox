// The TanStack Start Vite preset configures the following:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro,
//     VITE_* env injection, @ path alias, React/TanStack dedupe,
//     and server entry configuration.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
