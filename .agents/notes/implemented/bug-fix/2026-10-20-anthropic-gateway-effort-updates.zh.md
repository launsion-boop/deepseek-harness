# Agent Note: Anthropic gateway effort-update compatibility

Status: implemented

[English](2026-10-20-anthropic-gateway-effort-updates.md) | 中文

## Problem

部分 Anthropic 兼容网关拒绝只携带 `output_config.effort`、内容为空的 system 消息。即便部署更改了端点，确切模型的目录元数据仍可能启用这些原生推理强度更新。普通空 system 提示词过滤不会移除这些由序列化器生成的控制消息。

## Decision

`llm-pi-ai` 为 Anthropic 路由和模型条目开放 `compat.supportsMidConvoEffort`。拒绝此类消息的部署将其设为 `false`，pi-ai 随后通过请求级 `output_config` 发送当前推理强度。省略时保留目录行为。此覆盖不改变已存储历史或可选推理档位，并保留系统提示词和工具历史更新能力。

## Alternatives considered

**序列化后移除所有空 system 消息。** 推理强度消息表达协议控制信息，直接删除而不迁移当前强度会静默改变请求。

**禁用全部 in-history 能力。** 这还会改变提示词准入和工具历史更新，超出了不兼容的推理强度消息格式。

## Consequences

网关可以保留已支持的会话更新，而不必接受原生推理强度控制消息。这些端点不会收到历史推理强度切换，改为应用当前请求强度。序列化回归测试覆盖提示词与工具更新保留、请求级推理强度，以及未覆盖时保持原生行为。
