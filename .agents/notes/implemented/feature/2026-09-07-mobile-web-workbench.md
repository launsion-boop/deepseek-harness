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

## Local fork upstream adaptation map

This section is the maintained marker for the `leilangsheng/deepseek-harness` fork. Rewrite this snapshot after every upstream subscription; do not append a second migration log.

- **Upstream baseline:** `deepseek-ai/deepseek-harness@b0a7d2ce3b4c19d7452e364b2d7acbfa87e707ed`.
- **Adaptation merge:** `c1557f091752a59fdfcc89471023da241827191f`; rollback tag `dsh-local-pre-upstream-20260907` retains the previous fork tip.
- **Fork-owned product surfaces:** `packages/client/ui-mobile/**`, its `dsh-web-app` bundle row, phone assembly tests, and the addressed-subagent read-only model badge in `packages/client/ui-model-selection/**`.
- **Upstream-owned reliability surfaces:** synchronous submission echo and durable replacement, request idempotency, reconnect/backoff, history repair, and durable inbox recovery. Do not restore the fork's superseded implementations when upstream changes these contracts.
- **Required invariants:** phone layout applies only below 640 px; installed iOS uses safe-area placement; the service worker has no `fetch` handler and removes legacy `dsh-ui-mobile-shell-*` caches; addressed subagents expose model identity without enabling model selection; deployment authorities remain outside the product bundle.

The first semantic-conflict pass for the next subscription is the sorted intersection of upstream-touched and fork-touched paths from the recorded baseline:

```sh
git fetch origin master fork master --tags
base=b0a7d2ce3b4c19d7452e364b2d7acbfa87e707ed
git diff --name-only "$base"..origin/master | sort > /tmp/dsh-upstream-paths
git diff --name-only "$base"..fork/master | sort > /tmp/dsh-fork-paths
comm -12 /tmp/dsh-upstream-paths /tmp/dsh-fork-paths
```

Always inspect these semantic hotspots even when Git reports no textual conflict: Client Modules boot-document and revision policy; browser token/cookie authentication; Session Controller submission and reconnect projections; `packages/bundle/web-app/cordis.patch.yml`; `packages/client/ui-mobile/**`; `packages/client/ui-model-selection/**`; Client slot catalogs; assembled Web tests; generated catalogs, translation manifests, and notices.

The relay remains an external deployment boundary. The source-built DSH service keeps the existing `DSH_HOME`; `ai.deepseek.dsh` launches the selected checkout with `--trusted-host` and leaves the default-browser handoff enabled, because `--no-open` would strand a restarted local browser without the new token-to-cookie exchange; `com.agenthub.dsh-relay` owns the reverse tunnel; `com.agenthub.dsh-token-sync` transfers the current launch token to the relay over SSH; and the relay auth service exchanges that token for the official DSH browser cookie on the server side. The private Web profile package manifest must keep a non-empty version and its hook dependency must link to the selected checkout; otherwise the default plugin-package inventory can fail with `REQUEST_EXTENSION` before model dispatch. Never copy token values, cookies, passwords, or session data into this repository. If upstream changes browser authentication or request extensions, validate these boundaries before exposing the new build.

Before updating this marker, rerun focused mobile/model tests, build, typecheck, lint, constraints, hygiene, documentation sync, GUI tests, assembled Web replay, a copied-`DSH_HOME` restart test, and public phone-width login/load/send/refresh/reconnect QA. Record `NOT_RUN` or `UNKNOWN` instead of treating an unavailable public or device check as a pass.

## Alternatives considered

**Keep a network-first boot-document fallback.** A cached boot document can reference a process revision that the current Host must reject. Reload heuristics still leave a version-skew window, while removing fetch interception uses the Host's existing revision and caching rules directly.

**Cache plugin bundles in the service worker.** Client Modules already publishes revisioned URLs with immutable response policy. A second cache owner duplicates policy and cannot make an old boot graph valid after restart.

**Modify AppFrame for phone presentation.** The mobile behavior is deployment-specific and remains removable as one plugin row. Stable observed attributes and slot contributions preserve the standard layout package's ownership.

## Consequences

Phone users receive drawer navigation, a safe-area composer, install guidance, and optional completion push without stale-boot fallback. A phone must reach the Host to load or reload a Session; offline Session use is not claimed. The DOM observation layer and browser capability branches require focused component, route, service-worker, and assembled Web tests whenever the shell structure changes.
