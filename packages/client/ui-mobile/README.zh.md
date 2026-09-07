---
description: "面向移动端的 Web 外壳，提供手机抽屉、触控优先输入、PWA 安装、iOS 安全区和可选完成推送，同时不缓存会话启动文档或插件 revision。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-mobile

[English](README.md) | 中文

## 概述

本包把 Web 外壳变成可安装或直接在浏览器中使用的手机应用。它在宽度小于 640 px 时把桌面栏位变成屏外抽屉，让输入区避开 iOS 安全区，提供安装引导，并在配置 VAPID 后发送成功轮次的推送通知。其 service worker 只负责推送生命周期：页面、API 与插件请求始终遵循当前 Host 的 revision 和缓存策略。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步了解](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发说明](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 Web 布局、会话适配器、对话外壳、渲染器和语言服务之后挂载本包；此 fork 的 `dsh-web-app` 组合包已包含该配置项。

### 何时选择

当同一 Web 部署需要支持手机宽度导航、主屏幕安装或完成通知时选择本包。仅面向桌面部署时可省略；标准 Web 外壳仍提供自身的窄栏让步行为。

### 最小配置

```yaml
- id: ui-mobile
  name: '@deepseek-ai/dsh-client-ui-mobile'
```

本插件没有 Cordis 配置字段。只有同时提供 `DSH_WEB_PUSH_VAPID_SUBJECT`、`DSH_WEB_PUSH_VAPID_PUBLIC_KEY` 和 `DSH_WEB_PUSH_VAPID_PRIVATE_KEY` 三个值，或让 `DSH_WEB_PUSH_VAPID_PATH` 指向有效的持久化密钥文档时，Web Push 才会启用。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

Host 配置项把 PWA 元数据和首屏骨架注入已服务的文档，提供 manifest、service worker 与推送订阅端点，复用 Web 应用的 favicon，并从持久 `turn/end` 事件发送完成通知。Client 配置项观察组装后的 AppFrame，用稳定数据属性标注栏位角色，安装仅限手机的样式与手势，并通过既有 slot 贡献菜单、遮罩、安装和通知控件。service worker 调用 `skipWaiting()`、接管客户端、处理推送事件，并删除所有旧 `dsh-ui-mobile-shell-*` 缓存；它特意不注册 `fetch` handler，因为 Client 插件 URL 含进程 revision，旧启动文档无法安全访问已重启的 Host。

</details>

-----

<a id="further-exploration"></a>
## 进一步了解

- [Web Client 架构](../../../docs/subsystems/web-client.zh.md) — Host 到 Client 的数据流与重连归属。
- [Web Client Slots](../../../docs/subsystems/slots.zh.md) — 移动控件使用的组合位置。
- [连接](../connection/README.zh.md) — 受信 authority、浏览器认证与持续恢复。
- [Web 应用组合包](../../bundle/web-app/README.zh.md) — 已发布的 Web 清单与 `--trusted-host` 部署 flag。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本包只改变浏览器布局、安装和通知，不会向模型请求增加内容。

#### KV Cache 影响

无；本包不会组装或发送模型提供方请求。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- **安装与推送依赖浏览器能力。** iOS Web Push 要求从主屏幕安装；通知 API 不受支持或被拒绝时，普通 Web 会话仍可使用，但没有通知。
- **不提供离线会话。** service worker 不缓存启动文档或插件 bundle；手机没有通往 Host 的可用路径时，页面本身加载后会显示正常的连接恢复状态。
- **推送文案使用部署语言。** 完成通知文本由 Host 以中文发出，不跟随浏览器标签页的语言设置。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

移动布局与 service-worker revision 决策记录在[移动 Web 工作台 Agent Note](../../../.agents/notes/implemented/feature/2026-09-07-mobile-web-workbench.zh.md)中。

</details>

**运行时不变式：** 不发布 companion。本包观察 AppFrame 持有的属性并通过 slot 贡献内容；相关关系由定向 DOM、service-worker、路由和生命周期测试直接覆盖。
