# TODO — Login (Google/Facebook SSO) + Favourites

Recreate the old winds.mobi login and favourite-stations feature in this client.
Branch: `feature/login-favourites`.

## Background — how the existing backend actually works (research findings)

The station API (`https://winds.mobi/api/2.3`, Swagger at
[winds.mobi/api/2.3/doc](https://winds.mobi/api/2.3/doc), source
[winds-mobi-api](https://github.com/winds-mobi/winds-mobi-api)) has **no** user endpoints.
Auth and profiles live in [winds-mobi-admin](https://github.com/winds-mobi/winds-mobi-admin)
(Django + DRF), served under `https://winds.mobi/user/`:

| Endpoint                                | Method        | Purpose                                                                      |
| --------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| `/user/google/oauth2callback/`          | GET           | No `code` param → redirects to Google consent; with `code` → completes OAuth |
| `/user/facebook/oauth2callback/`        | GET           | Same, for Facebook (Graph API v12.0)                                         |
| `/user/login/`                          | POST          | `{ott}` (or `{username,password}`) → `{token}` (JWT)                         |
| `/user/profile/`                        | GET           | Profile: `favorites[]`, `picture`, `display-name`, `_id`, `user-info`        |
| `/user/profile/`                        | DELETE        | Delete account                                                               |
| `/user/profile/favorites/<station_id>/` | POST / DELETE | Add / remove a favourite (204, empty body)                                   |

The login flow (from `winds_mobi_user/views.py`, `google_views.py`, `oauth2_callback.html`):

1. Old client links (full-page navigation) to `/user/google/oauth2callback/`.
2. Django redirects to the provider; provider redirects back with `?code=`.
3. Django exchanges the code, upserts `User` + `SocialAuth`, generates a random **one-time
   token (OTT)** stored in Redis with a **30 s TTL** (single-use via `GETDEL`).
4. Django renders a tiny HTML page that `fetch`-POSTs `{ott}` to `/user/login/`, receives
   `{token}`, writes it to `localStorage.token` **on the winds.mobi origin**, and
   `location.replace`s to a **hardcoded** `redirect_url: "/stations/list"` (the old client).
5. The token is an **HS256 JWT, 30-day expiry**, payload `{username, exp}`. Authenticated
   endpoints read it from the `Authorization` header as any two-part value — the scheme word
   is ignored, so `Authorization: JWT <token>` works.

Facts that make a pure-SPA integration easy:

- `CORS_ORIGIN_ALLOW_ALL = True` in winds-mobi-admin — we can call `/user/*` from any origin
  (including `localhost:4200` in dev), no cookies involved.
- DRF `APIView`s are CSRF-exempt — the cross-origin `POST /user/login/` just works.
- `GET /stations/` supports an `ids` array param (repeat format) — perfect for fetching the
  favourite stations in one request. Max limit 500.

**The one blocker:** the OTT→JWT exchange and the final redirect currently happen on the
winds.mobi origin with a hardcoded old-client redirect. A different-origin SPA can never see
that token. This needs a small winds-mobi-admin change (Phase 0). Everything else is
client-only.

---

## Phase 0 — winds-mobi-admin PR (prerequisite, needs upstream coordination)

Add an opt-in `next` redirect to the OAuth callback views, keeping the legacy behaviour as
the fallback so the old client is untouched:

- [ ] Accept `?next=<absolute client URL>` on the initial (no-`code`) request to
      `GoogleOauth2Callback` / `FacebookOauth2Callback`.
- [ ] Validate `next` against an origin allowlist from an env var (e.g.
      `CLIENT_REDIRECT_ORIGINS=https://winds.mobi,http://localhost:4200`) — never open-redirect.
- [ ] Round-trip `next` through the OAuth `state` param, signed with `django.core.signing`
      (`signing.dumps({"next": ...})` / `loads(..., max_age=600)`), which doubles as CSRF
      protection for the callback. (Both `google_auth_oauthlib.Flow.authorization_url` and
      `requests_oauthlib.OAuth2Session.authorization_url` accept a custom `state`.)
- [ ] On callback: if a valid `next` is present, respond
      `HttpResponseRedirect(f"{next}?ott={ott}")` instead of rendering
      `oauth2_callback.html`; otherwise keep the existing template flow. The 30 s OTT TTL
      comfortably covers one redirect hop.
- [ ] While this PR is pending: develop Phases 2–5 using a real JWT copied from the old
      client (log in at winds.mobi, copy `localStorage.token`) injected into the session —
      only the callback route (Phase 1) needs the backend change end-to-end.

## Phase 1 — session infrastructure (ember-simple-auth)

Use **ember-simple-auth 8.x** (v2 addon, `ember-source >=6.0` peer, Embroider/Vite-friendly,
ships test helpers) rather than hand-rolling: it gives session restore on boot, cross-tab
sync via storage events, invalidation handling, and `test-support` for free.

- [ ] `pnpm add -D ember-simple-auth` (verify it lands in the Vite build cleanly; if it
      fights the build, fall back to a small hand-rolled `session` service — tracked token +
      localStorage — but try ESA first).
- [ ] `app/authenticators/winds-mobi.ts` — custom authenticator: - `authenticate(ott)`: POST `https://winds.mobi/user/login/` with `{ott}`
      (`Content-Type: application/json`), resolve `{token}`; decode the JWT payload
      (plain `atob` on the middle segment, no crypto needed) and keep `exp`/`username` in
      the session data. - `restore(data)`: resolve iff `data.token` exists and `exp` is in the future. - Note: this is the one deliberate exception to "no `fetch()` in app code" — a one-off
      token exchange is auth plumbing, not resource data, and keeping it inside the
      authenticator keeps Warp Drive out of the auth lifecycle.
- [ ] `app/utils/auth-token.ts` — tiny module-scope holder (`getAuthToken()` /
      `setAuthToken()`); the authenticator (and application-route session events) mirror the
      current token into it. This exists because Warp Drive handlers are registered at module
      scope in [app/services/store.ts](app/services/store.ts) with no owner/service access.
- [ ] [app/routes/application.ts](app/routes/application.ts): `await this.session.setup()`
      in `beforeModel` (required by ESA ≥5), seed `setAuthToken` from the restored session.
- [ ] Service registry typing for `session` if ESA's own types don't provide it.
- [ ] New route `auth-callback` (path `/auth/callback`, add to
      [app/router.ts](app/router.ts)): reads the `ott` query param, `await
    session.authenticate('authenticator:winds-mobi', ott)`, then `replaceWith('map')`.
      Failure state (expired/used OTT — it's single-use, 30 s): show a short error with a
      "try signing in again" link. Template `app/templates/auth-callback.gts`.
- [ ] Login initiation = plain full-page links (no popup):
      `https://winds.mobi/user/{google|facebook}/oauth2callback/?next=${location.origin}/auth/callback`.
- [ ] Logout: `session.invalidate()` (client-side only — the JWT is just discarded; there is
      no server-side revocation).
- [ ] Nice-to-have: stash the current route in `sessionStorage` before navigating away and
      return there after `auth-callback` instead of always landing on `map`.

## Phase 2 — profile data through Warp Drive (builders → handler → schema)

- [ ] `app/handlers/auth.ts` — request handler placed **first** in the `handlers` array in
      [app/services/store.ts](app/services/store.ts): if `request.url` targets
      `https://winds.mobi/user/`, pass the request on with
      `Authorization: JWT ${getAuthToken()}` added to headers; otherwise pass through
      untouched. On a 401 from a user endpoint, surface an error the UI maps to
      `session.invalidate()` (expired 30-day JWT).
- [ ] `app/builders/profile.ts`: - `fetchProfile()` — GET `https://winds.mobi/user/profile/` (absolute URL; this host
      is _not_ the `setBuildURLConfig` api/2.3 base), `op: 'findRecord'`-style request for
      the single `profile` resource. - `addFavorite(stationId)` / `removeFavorite(stationId)` — POST / DELETE
      `https://winds.mobi/user/profile/favorites/${stationId}/`. 204 empty body → the
      cache can't self-update; callers refetch the profile after a successful mutation
      (cheap, always consistent).
- [ ] `app/handlers/profile.ts` — reshape the raw payload into JSON:API:
      `{type: 'profile', id: <_id>, attributes: {displayName ← 'display-name', picture,
    favorites}}`. Follow the station handler's rule: omit absent attributes entirely.
      We don't need `user-info` — skip it.
- [ ] [app/services/store.ts](app/services/store.ts): add `ProfileSchema`
      (`displayName`, `picture`, `favorites: string[]`) + exported `Profile` type; register
      schema and both new handlers.
- [ ] Decide where the profile request lives: the navbar auth menu and the favourites route
      both need it. Per conventions, no new service for UI state — fetch via
      `store.request(fetchProfile())` in each consumer; Warp Drive's cache dedupes the
      identity, and mutations refetch. (If cache-policy TTL gets in the way, use
      `cacheOptions` on the builder rather than a service.)

## Phase 3 — UI

- [ ] **Navbar auth menu** (extend [app/components/navbar/](app/components/navbar/), reuse
      the existing menu/Frontile dropdown patterns): - Signed out: "Sign in" entry opening Google / Facebook options (brand-appropriate
      buttons or simple labelled items; ember-phosphor-icons has Google/Facebook logos). - Signed in: avatar from `picture` + `displayName`; menu items → Favourites route,
      Sign out.
- [ ] **Favourites route** — `this.route('favorites')` in router +
      `app/templates/favorites.gts`, modelled on
      [app/templates/nearby.gts](app/templates/nearby.gts) (same section cards, compact/card
      toggle can be shared or skipped initially, `commitResolvedStations` +
      `registerLoadingProbe` for refresh integration): - Derive the station request from the profile's `favorites` ids: new
      `favoritesQuery(ids)` in [app/builders/station.ts](app/builders/station.ts) —
      `query('station', { ids, keys: defaultStationQueryKeys, limit: ids.length })`
      (`arrayFormat: 'repeat'` already the builder default). - The API does not guarantee `ids` order — sort results client-side to the profile's
      favourites order. - States: signed-out prompt (sign-in CTA), empty favourites explainer, loading, error —
      mirror nearby's state handling. - Auto-refresh via `mapRefresh` ticks like nearby.
- [ ] **Star toggle** on the station detail header
      ([app/components/station/header.gts](app/components/station/header.gts)); rendered only
      when authenticated. Filled/outlined `PhStar` reflecting membership in
      `profile.favorites`; press → `addFavorite`/`removeFavorite` builder request
      (ember-concurrency task, `drop`), then profile refetch. Optionally also on
      nearby/favourite cards later — start with the detail panel only.
- [ ] i18n: all new strings in [translations/en-us.yaml](translations/en-us.yaml)
      (`auth.*`, `favorites.*`).

## Phase 4 — tests

- [ ] Extend the fake-store pattern in [tests/acceptance/](tests/acceptance/) to answer
      `https://winds.mobi/user/profile/` and `/user/login/` by `url`, with a typed `Profile`
      fixture.
- [ ] Auth callback acceptance: visiting `/auth/callback?ott=...` exchanges and lands on the
      map (happy path) + error state on a rejected OTT.
- [ ] Navbar: signed-out vs signed-in rendering (use
      `ember-simple-auth/test-support` `authenticateSession` /
      `invalidateSession`).
- [ ] Favourites route: fixture profile with a few ids → renders those station cards in
      profile order; empty and signed-out states.
- [ ] Star toggle: add/remove issues the right request and updates the star.

## Phase 5 — wrap-up

- [ ] `CHANGELOG.md`: user-facing entry (sign in with Google/Facebook, favourite stations
      view, star toggle).
- [ ] Final verification: `pnpm lint` + relevant `pnpm test:ember:dev` filters.

## Risks / open questions

- **Backend coordination**: Phase 0 needs a winds-mobi-admin PR + deploy. Everything except
  the live callback hop can proceed with a copied JWT meanwhile.
- **Facebook**: the backend pins Graph API **v12.0**, long past Meta's sunset window —
  verify Facebook login still works on the _old_ site before investing in the FB button; if
  broken, ship Google-only and hide FB behind the same menu until the backend is updated.
- **Old-client compatibility**: the Phase 0 change must keep the template fallback intact.
- **Token lifetime**: 30-day JWT, no refresh mechanism — on expiry the profile request 401s;
  we invalidate the session and the user signs in again. Acceptable.
- **Account deletion** (`DELETE /user/profile/`) exists upstream — out of scope here; note
  for a future settings item.
- **Map integration** (highlighting favourite stations on the map layer) — deliberate
  follow-up, not part of this feature.
