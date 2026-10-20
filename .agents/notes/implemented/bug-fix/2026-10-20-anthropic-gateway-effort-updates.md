# Agent Note: Anthropic gateway effort-update compatibility

Status: implemented

English | [中文](2026-10-20-anthropic-gateway-effort-updates.zh.md)

## Problem

Some Anthropic-compatible gateways reject empty-content system messages carrying only `output_config.effort`. Exact-model catalog metadata can enable these native effort updates even when a deployment changes the endpoint. Ordinary empty system-prompt filtering does not remove these serializer-generated control messages.

## Decision

`llm-pi-ai` exposes `compat.supportsMidConvoEffort` for Anthropic routes and model entries. A deployment that rejects effort-only messages sets it to `false`; pi-ai then sends the current effort in request-level `output_config`. Omission retains catalog behavior. The override changes neither stored history nor selectable reasoning levels, and leaves system-prompt and tool-history update capabilities intact.

## Alternatives considered

**Remove every empty system message after serialization.** Effort carriers express protocol controls, so deleting them without moving the current effort silently changes the request.

**Disable all in-history capabilities.** This also changes prompt admission and tool-history updates, beyond the incompatible effort-message format.

## Consequences

Gateways can retain their supported conversation updates without accepting native effort carriers. Historical effort switches are not sent to these endpoints; the current request effort applies instead. Serializer regression tests cover preserved prompt/tool updates, request-level effort, and unchanged native behavior when no override is present.
