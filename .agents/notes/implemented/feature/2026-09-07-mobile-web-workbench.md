# Agent Note: Mobile Web workbench and revision-safe PWA

Status: implemented

English | [中文](2026-09-07-mobile-web-workbench.zh.md)

## Problem

The three-column Web shell remains mounted on phone-width viewports, but column concession alone does not provide drawer navigation, iOS safe-area placement, Home Screen installation, or completion notifications. A service worker that caches the boot document can also retain Client plugin URLs from an earlier Host process; those URLs contain process revisions and correctly return 404 after restart.

## Decision

`@deepseek-ai/dsh-client-ui-mobile` is an additive Web plugin with Host and Client compiler faces. The Client face observes the assembled AppFrame, stamps stable mobile role attributes on its columns, and applies phone-only layout below 640 px. It contributes sidebar controls, the drawer scrim, installation guidance, and the push prompt through existing slots. Desktop and tablet layout remains owned by `ui-layout`.

The Host face injects PWA metadata and a first-paint skeleton, serves the manifest while reusing the Web application's favicon, and registers optional Web Push routes. Successful durable `turn/end` events trigger notifications when the complete VAPID configuration is available. Missing browser or VAPID capability disables only installation or push behavior.

The service worker owns install activation, notification delivery, and notification-click routing. It registers no `fetch` handler. Activation deletes every cache whose name starts with `dsh-ui-mobile-shell-`, including caches written by the earlier app-shell implementation. The current Host therefore remains the only authority for boot documents, API responses, Client plugin revisions, and their caching headers.

The public relay authority is deployment configuration. A relay launch passes `--trusted-host`; the package and Web bundle do not hardcode a deployment domain.

## Alternatives considered

**Keep a network-first boot-document fallback.** A cached boot document can reference a process revision that the current Host must reject. Reload heuristics still leave a version-skew window, while removing fetch interception uses the Host's existing revision and caching rules directly.

**Cache plugin bundles in the service worker.** Client Modules already publishes revisioned URLs with immutable response policy. A second cache owner duplicates policy and cannot make an old boot graph valid after restart.

**Modify AppFrame for phone presentation.** The mobile behavior is deployment-specific and remains removable as one plugin row. Stable observed attributes and slot contributions preserve the standard layout package's ownership.

## Consequences

Phone users receive drawer navigation, a safe-area composer, install guidance, and optional completion push without stale-boot fallback. A phone must reach the Host to load or reload a Session; offline Session use is not claimed. The DOM observation layer and browser capability branches require focused component, route, service-worker, and assembled Web tests whenever the shell structure changes.
