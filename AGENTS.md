<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture notes

- Public Supabase connection settings (VITE_SUPABASE_PROJECT_ID / VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) are baked into `vite.config.ts` via `define`, because publish builds run without the gitignored `.env` and the deployed browser bundle otherwise crashes with "Missing Supabase environment variables". These three values are public (project id, URL, publishable key) — never bake a secret there; update the literals if the project is ever re-connected to a different backend.
- GitHub Pages deploys a redirect to the canonical Lovable-hosted app because the full application requires server functions that static Pages cannot run; keep one Pages workflow to avoid competing deployments.
