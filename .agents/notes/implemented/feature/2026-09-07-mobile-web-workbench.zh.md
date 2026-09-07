# Agent Note: 移动 Web 工作台与 revision 安全的 PWA

Status: implemented

[English](2026-09-07-mobile-web-workbench.md) | 中文

## Problem

三栏 Web 外壳在手机宽度下仍保持挂载，但仅有栏位让步无法提供抽屉导航、iOS 安全区放置、主屏幕安装或完成通知。缓存启动文档的 service worker 还可能保留前一 Host 进程的 Client 插件 URL；这些 URL 含进程 revision，并会在重启后按设计返回 404。

## Decision

`@deepseek-ai/dsh-client-ui-mobile` 是带有 Host 与 Client 编译面的附加 Web 插件。Client 面观察组装后的 AppFrame，为其栏位标注稳定的移动角色属性，并在宽度小于 640 px 时应用仅限手机的布局。它通过既有 slot 贡献侧栏控件、抽屉遮罩、安装引导和推送提示。桌面与平板布局仍由 `ui-layout` 持有。

Host 面注入 PWA 元数据和首屏骨架，提供 manifest 并复用 Web 应用的 favicon，同时注册可选 Web Push 路由。完整 VAPID 配置可用时，成功的持久 `turn/end` 事件触发通知。浏览器或 VAPID 能力缺失只会停用安装或推送行为。

service worker 持有安装激活、通知投递和通知点击路由。它不注册 `fetch` handler。激活会删除名称以 `dsh-ui-mobile-shell-` 开头的所有缓存，包括早期应用外壳实现写入的缓存。因此当前 Host 始终是启动文档、API 响应、Client 插件 revision 及其缓存响应头的唯一权威。

公网 relay authority 属于部署配置。relay 启动时传入 `--trusted-host`；本包和 Web 组合包不硬编码部署域名。

## Alternatives considered

**保留 network-first 启动文档回退。** 缓存的启动文档可以引用当前 Host 必须拒绝的进程 revision。reload 启发式处理仍会留下版本偏差窗口，而移除 fetch 接管可直接使用 Host 的既有 revision 和缓存规则。

**在 service worker 中缓存插件 bundle。** Client Modules 已通过带 revision 的 URL 发布不可变响应策略。第二个缓存所有者会重复策略，也无法让旧启动图在重启后变得有效。

**为手机展示修改 AppFrame。** 移动行为属于部署特定功能，并保持可通过一个插件配置项移除。稳定观察属性与 slot 贡献保留标准布局包的所有权。

## Consequences

手机用户获得抽屉导航、安全区输入区、安装引导和可选完成推送，同时不会使用陈旧启动回退。手机必须能访问 Host 才能加载或重新加载会话；本决策不声称支持离线会话。每当外壳结构变化时，DOM 观察层和浏览器能力分支都需要定向组件、路由、service-worker 和组装 Web 测试。
