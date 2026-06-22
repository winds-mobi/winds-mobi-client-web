# Troubleshooting

## Dev server returns 504 for most requests (OrbStack / devcontainer)

**Symptom:** the app's `orb.local` domain (e.g.
`https://ui.winds-mobi-client-web.orb.local/`) returns `504` for most requests —
typically right after `pnpm install` added or changed a dependency. A handful of
already-cached assets (e.g. `/@vite/client`) may still return `200`; most others
hang until they time out.

**What's actually happening:** this devcontainer setup runs two independent dev
servers against the same source tree:

- the one you start yourself on the host (`pnpm start`), and
- a long-running one inside a Docker container (`winds-mobi-client-web-ui-1`)
  that the `orb.local` domain proxies to.

The container bind-mounts the repo (`/app`), but **`node_modules` is a separate
Docker volume**, independent from the host's `node_modules`. So a dependency
change (`pnpm add`/`pnpm remove`) updates `package.json`/`pnpm-lock.yaml` (seen by
both, since those are real files in the bind mount) but does **not** automatically
reinstall the container's own `node_modules` volume.

Our `start` script always passes `vite --force`, which throws away any cached
dependency-optimization state and does a full re-scan on every boot. Combined
with a `node_modules` volume that's now out of sync with the lockfile (or just
needs the new package physically installed), that forced re-scan can crash
mid-way — taking the dependency optimizer down with it. Since nearly every route
imports something from the broken optimization batch, almost every request then
hangs waiting on a result that never arrives, and the OrbStack proxy in front of
it eventually returns `504`.

One specific instance we hit and fixed for good (see below): the forced re-scan
crawls the _entire_ `@frontile/collections` package because we import `Listbox`
from it, even though we never use its `Table` component. `Table`'s precompiled
templates aren't prebundle-clean (esbuild can't resolve a `@frontile/theme/src/
tw.json` import, and two of its helpers — `get`, `or` — aren't in scope under
strict mode), so the optimizer throws and the whole dependency batch fails.

### Fix

1. **Reinstall the container's own `node_modules`** so it matches the current
   lockfile (the volume doesn't auto-sync with the host):

   ```sh
   docker exec <container-name> sh -c "cd /app && pnpm install"
   ```

   If that reports "already up to date" but the problem persists, the volume's
   `node_modules` may be subtly stale — force a clean reinstall:

   ```sh
   docker exec <container-name> sh -c "cd /app && rm -rf node_modules/.vite node_modules/.cache && pnpm install --force"
   ```

2. **Restart the container properly** (don't `pkill` the dev process directly —
   its parent `pnpm start` is the container's foreground process, so killing the
   `vite` child stops the whole container):

   ```sh
   docker restart <container-name>
   ```

3. **Watch the boot logs** for the actual underlying error (the 504 itself tells
   you nothing about _why_):

   ```sh
   docker logs -f <container-name>
   ```

   Vite logs everything to stdout — there's no separate persisted log file to
   look for. Look for lines like `[vite] (client) error while updating
dependencies:` followed by an `[ERROR]` block; that's the real failure. The
   server can print `VITE vX ready in ...ms` and still be broken if the _forced
   re-optimization_ step fails after that — the HTTP server comes up, but most
   client requests then hang waiting on a dependency batch that never finished.

4. **If the underlying error names a package/component you don't actually use**
   (as with `@frontile/collections`'s `Table`), add it to `optimizeDeps.exclude`
   in [vite.config.mjs](vite.config.mjs) instead of trying to fix the dependency
   itself. Excluding defers that module's resolution to per-request time instead
   of the bulk pre-scan, so a part of the package you never import is never
   compiled at all, and it stops being able to take down the whole batch.

### Quick checklist next time this happens

- [ ] `docker ps` — is the container actually up?
- [ ] `docker logs --tail 80 <container-name>` — find the real `[ERROR]`, not
      just the 504.
- [ ] `docker exec <container-name> sh -c "cd /app && pnpm install"` — sync its
      `node_modules` volume with the lockfile.
- [ ] `docker exec <container-name> sh -c "rm -rf /app/node_modules/.vite"` —
      clear the stale/broken optimize-deps cache.
- [ ] `docker restart <container-name>` — restart cleanly (not `pkill`).
- [ ] If a specific unused package/component is named in the error, exclude it
      in `vite.config.mjs`'s `optimizeDeps.exclude` rather than fighting it.
