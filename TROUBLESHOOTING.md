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

## A single request 504s with header `504 Outdated Request` (everything else loads fine)

**Symptom:** the page itself loads (`/` returns `200`), but one specific
`/node_modules/.vite/deps/...` request 504s. Checking the response headers
(`curl -i`) shows `HTTP/1.1 504 Outdated Request` — not a generic timeout.

**What's actually happening:** this is Vite's own deliberate cache-invalidation
signal, not a crash. Editing `vite.config.mjs` (or `package.json`/the lockfile)
makes Vite restart the dev server and re-run its dependency optimizer, which
gets a new internal "batch" identity. Any browser tab that's had Vite's HMR
client connected since _before_ the restart may still be holding module URLs
from the previous batch; Vite answers those specific stale requests with `504
Outdated Request` to force a reload, rather than serving a mismatched module.

Confirm it's this, not the crash scenario above, by checking:

- the response header is literally `504 Outdated Request` (the crash scenario
  is a plain `504` with no such reason, since OrbStack's proxy is what's
  timing out there, not Vite itself), and
- `docker logs --tail 80 <container-name>` shows a clean recent restart/
  re-optimize with no `[ERROR]`, and the requested file actually exists under
  `node_modules/.vite/deps/` in the container.

### Fix

Just **hard-refresh the browser tab** (or close and reopen it). The dev
server is healthy; the tab is the only thing out of date. Vite's HMR client
normally does this reload automatically, but a tab that's been idle a long
time, or whose websocket dropped, can miss the signal.

## The dev server shows a blank white page after running `pnpm test:ember`

**Symptom:** `pnpm start`'s page goes completely blank — not an error overlay,
just an empty `<body>`. Viewing source shows the
`winds-mobi-client-web/config/environment` meta tag decodes to
`"environment":"test"`, `"APP":{"rootElement":"#ember-testing","autoboot":false}`
— for a normal route like `/` or `/map`, not `/tests`.

**What's actually happening:** `@embroider/vite`'s `contentFor()` Vite plugin
(`node_modules/.pnpm/@embroider+vite@*/node_modules/@embroider/vite/dist/src/
content-for.js`) injects that meta tag by reading
`node_modules/.embroider/content-for.json` fresh **from disk on every single
HTML request** — it is not cached in memory, and it is not namespaced by which
Vite process is asking. That JSON file is keyed by path (`/index.html`,
`/tests/index.html`) and lives under the project root, shared by every Vite
process that runs against this working directory.

`pnpm test:ember` runs `vite build --mode test`. Run it with `docker compose
exec ui` — i.e. **inside the same running container as the persistent `pnpm
start` dev server** — and that test build regenerates `content-for.json`,
overwriting the `/index.html` entry with the test build's environment
(`autoboot: false`, `rootElement: "#ember-testing"`) instead of the dev
server's own. The live dev server then reads that same corrupted entry for
every subsequent request to `/`, `/map`, etc., until its own process restarts
and regenerates the file for dev mode again. Since `autoboot` is now `false`
and nothing ever calls `visit()` outside a test harness, the app never boots
and the page stays blank — indefinitely, surviving hard refreshes and even new
tabs, because the corruption is server-side, not a stale client cache.

Confirm it's this (not a client-side caching issue) by checking directly from
inside the container, bypassing the browser entirely:

```sh
docker compose exec ui sh -c "curl -s http://localhost:4200/ | grep -o 'environment%22%3A%22[a-z]*'"
```

If this prints `environment%22%3A%22test` for the plain `/` route, the shared
cache is corrupted.

### Fix

Restart the container so its dev server process regenerates
`content-for.json` for its own (development) mode:

```sh
docker restart <container-name>
```

Then re-check the command above — it should print `environment%22%3A%22
development`.

### Prevention — this is the systemic fix

**Never run `pnpm test:ember` (or anything invoking `vite build`) via `docker
compose exec ui` while `pnpm start` is live in that same container** — the two
share the same `node_modules/.embroider/content-for.json` and will keep
re-corrupting each other's entry for as long as both exist. In this
devcontainer setup, `pnpm start` is _always_ running (it's the container's
`CMD`), so this hazard is live every time `pnpm test:ember` is invoked here,
not just occasionally.

- Prefer `pnpm test:ember:dev` for iterating (it runs against the already-live
  dev server via testem's proxy — no separate `vite build`, nothing gets
  overwritten).
- If `test:ember:dev`'s headless Chromium fails to connect and you fall back
  to `pnpm test:ember` (as [CLAUDE.md](CLAUDE.md) suggests), treat the dev
  server as contaminated the moment that command finishes — **restart the
  container immediately afterward**, before relying on `pnpm start` again for
  manual browsing or a screenshot.
