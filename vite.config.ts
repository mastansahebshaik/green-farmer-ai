// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Publish builds compile without the gitignored .env, so the public Supabase
// connection settings are baked in here. These three values are public by
// design (project id, project URL, publishable key) — never add a secret here.
const PUBLIC_SUPABASE_DEFINE = {
  "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
    "tdphtpqgmhfznoqgqhlj",
  ),
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
    "https://tdphtpqgmhfznoqgqhlj.supabase.co",
  ),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
    "sb_publishable_gzxocCiTujDgEpa6zQXTug_qEx8M4pO",
  ),
};

export default defineConfig({
  vite: {
    define: PUBLIC_SUPABASE_DEFINE,
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
