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

## 本地 fork 的 upstream 适配地图

本节是 `leilangsheng/deepseek-harness` fork 的持续维护标记。每次订阅 upstream 后重写这份快照，不追加第二份迁移流水账。

- **Upstream 基线：** `deepseek-ai/deepseek-harness@b0a7d2ce3b4c19d7452e364b2d7acbfa87e707ed`。
- **适配 merge：** `c1557f091752a59fdfcc89471023da241827191f`；回滚标签 `dsh-local-pre-upstream-20260907` 保留升级前的 fork tip。
- **Fork 持有的产品表层：** `packages/client/ui-mobile/**`、它在 `dsh-web-app` 中的组合项、手机组装测试，以及 `packages/client/ui-model-selection/**` 中 addressed subagent 的只读模型座位。
- **Upstream 持有的可靠性表层：** 发送同步回显及其持久替换、请求幂等、重连与退避、历史补洞、持久 inbox 恢复。upstream 改动这些契约时，不恢复 fork 中已被替代的旧实现。
- **必须保持的不变量：** 手机布局只在 640 px 以下生效；已安装 iOS 使用安全区放置；service worker 不注册 `fetch` handler，并删除旧 `dsh-ui-mobile-shell-*` 缓存；addressed subagent 显示模型身份但不启用模型选择；部署 authority 始终留在产品 bundle 之外。

下一次订阅的第一轮语义冲突检查，是从已记录基线出发，将 upstream 与 fork 各自触碰的路径排序后求交集：

```sh
git fetch origin master fork master --tags
base=b0a7d2ce3b4c19d7452e364b2d7acbfa87e707ed
git diff --name-only "$base"..origin/master | sort > /tmp/dsh-upstream-paths
git diff --name-only "$base"..fork/master | sort > /tmp/dsh-fork-paths
comm -12 /tmp/dsh-upstream-paths /tmp/dsh-fork-paths
```

即使 Git 没有报告文本冲突，也必须检查这些语义热点：Client Modules 的启动文档与 revision 策略；浏览器 token/cookie 认证；Session Controller 的发送与重连投影；`packages/bundle/web-app/cordis.patch.yml`；`packages/client/ui-mobile/**`；`packages/client/ui-model-selection/**`；Client slot 目录；组装 Web 测试；生成目录、翻译 manifest 与 notices。

relay 始终是仓库外的部署边界。源码构建的 DSH 服务保留既有 `DSH_HOME`；`ai.deepseek.dsh` 使用 `--trusted-host` 启动选定 checkout；`com.agenthub.dsh-relay` 持有反向隧道；`com.agenthub.dsh-token-sync` 通过 SSH 把当前 launch token 传给 relay；relay 认证服务在服务器内部把该 token 兑换成官方 DSH 浏览器 cookie。私有 Web profile 的 package manifest 必须保留非空版本，hook 依赖也必须链接到所选 checkout；否则默认插件包清单会在模型发出请求前以 `REQUEST_EXTENSION` 失败。绝不能把 token 值、cookie、密码或会话数据复制进本仓库。upstream 若改变浏览器认证或请求扩展，必须先验证这些边界，才能暴露新构建。

更新本标记前，重新运行定向移动端/模型测试、build、typecheck、lint、constraints、hygiene、文档同步、GUI 测试、组装 Web replay、复制 `DSH_HOME` 的重启测试，以及公网手机宽度的登录/加载/发送/刷新/重连 QA。无法执行的公网或设备检查应记录为 `NOT_RUN` 或 `UNKNOWN`，不能视为通过。

## Alternatives considered

**保留 network-first 启动文档回退。** 缓存的启动文档可以引用当前 Host 必须拒绝的进程 revision。reload 启发式处理仍会留下版本偏差窗口，而移除 fetch 接管可直接使用 Host 的既有 revision 和缓存规则。

**在 service worker 中缓存插件 bundle。** Client Modules 已通过带 revision 的 URL 发布不可变响应策略。第二个缓存所有者会重复策略，也无法让旧启动图在重启后变得有效。

**为手机展示修改 AppFrame。** 移动行为属于部署特定功能，并保持可通过一个插件配置项移除。稳定观察属性与 slot 贡献保留标准布局包的所有权。

## Consequences

手机用户获得抽屉导航、安全区输入区、安装引导和可选完成推送，同时不会使用陈旧启动回退。手机必须能访问 Host 才能加载或重新加载会话；本决策不声称支持离线会话。每当外壳结构变化时，DOM 观察层和浏览器能力分支都需要定向组件、路由、service-worker 和组装 Web 测试。
