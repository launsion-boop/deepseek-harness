---
description: "Mobile Web shell with phone drawers, touch-first composition, PWA installation, iOS safe-area handling, and optional completion push without caching Session boot documents or plugin revisions."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-mobile

English | [中文](README.zh.md)

## Summary

This package makes the Web shell usable as an installed or browser-hosted phone application. It turns the desktop columns into off-canvas drawers below 640 px, keeps the composer above iOS safe areas, adds install guidance, and can deliver successful-turn push notifications when VAPID is configured. Its service worker owns push lifecycle only: page, API, and plugin requests always use the current Host revision and cache policy.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the package after the Web layout, Session adapter, Conversation shell, renderer, and locale services; the fork's `dsh-web-app` bundle already includes this row.

### When to choose it

Choose this package when the same Web deployment must support phone-width navigation, Home Screen installation, or completion notifications. Omit it for a desktop-only deployment; the standard Web shell continues to provide its own narrow-column concession behavior.

### Minimal configuration

```yaml
- id: ui-mobile
  name: '@deepseek-ai/dsh-client-ui-mobile'
```

The plugin has no Cordis config fields. Web Push stays disabled unless all three `DSH_WEB_PUSH_VAPID_SUBJECT`, `DSH_WEB_PUSH_VAPID_PUBLIC_KEY`, and `DSH_WEB_PUSH_VAPID_PRIVATE_KEY` values are present, or `DSH_WEB_PUSH_VAPID_PATH` names a valid persisted key document.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Host entry injects PWA metadata and the first-paint skeleton into the served document, serves the manifest, service worker, and push subscription endpoints, reuses the Web application's favicon, and sends completion notifications from durable `turn/end` events. The Client entry observes the assembled AppFrame, marks its column roles with stable data attributes, installs the phone-only stylesheet and gestures, and contributes menu, scrim, install, and notification controls through existing slots. The service worker calls `skipWaiting()`, claims clients, handles push events, and deletes every legacy `dsh-ui-mobile-shell-*` cache; it deliberately has no `fetch` handler because Client plugin URLs contain a process revision and an old boot document cannot safely address a restarted Host.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Web Client architecture](../../../docs/subsystems/web-client.md) — Host-to-Client data flow and reconnection ownership.
- [Web Client Slots](../../../docs/subsystems/slots.md) — the composition locations used by mobile controls.
- [Connection](../connection/README.md) — trusted authorities, browser authentication, and continuous recovery.
- [Web application bundle](../../bundle/web-app/README.md) — the shipped Web roster and `--trusted-host` deployment flag.

-----

<a id="model-experience"></a>
## Model Experience

None, as this package changes browser layout, installation, and notifications without adding model request content.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Installation and push depend on browser capabilities.** iOS Web Push requires a Home Screen installation, and unsupported or denied notification APIs leave the ordinary Web session usable without notifications.
- **Offline Session use is not provided.** The service worker does not cache the boot document or plugin bundles; a phone without a working path to the Host shows the normal connection recovery state after the page itself loads.
- **Push copy uses the deployment language.** Completion notification text is emitted in Chinese by the Host and does not follow a browser tab's locale.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The mobile layout and service-worker revision decision is recorded in the [mobile Web workbench Agent Note](../../../.agents/notes/implemented/feature/2026-09-07-mobile-web-workbench.md).

</details>

**Runtime invariant:** No companion is published. The package observes AppFrame-owned attributes and contributes through slots; its focused DOM, service-worker, route, and lifecycle tests own those relations directly.
