/** Simplified Chinese mobile-shell copy. */
export const zh = {
  'menu.aria': '菜单',
  'drawer.close': '关闭面板',
  'install.region': '安装应用',
  'install.title': '安装到主屏幕',
  'install.description': '安装后可开启任务完成通知',
  'install.action': '安装',
  'install.dismiss': '关闭提示',
  'install.iosRegion': '添加到主屏幕',
  'install.iosTitle': '添加到主屏幕',
  'install.iosDescription': '点分享按钮 → 添加后可开启任务完成通知',
  'push.unsupported': '当前 iOS Web App 不支持通知',
  'push.denied': '通知已被系统关闭，请在设置中允许',
  'push.enable': '开启任务完成通知',
  'push.enableExisting': '启用任务完成通知',
  'slot.scrim': '抽屉遮罩',
  'slot.newSessionMenu': '新会话菜单',
  'slot.install': 'PWA 安装引导',
  'slot.push': '开启完成通知',
} satisfies Record<string, string>

/** Locale keys owned by the mobile Web shell plugin. */
export type MobileKey = keyof typeof zh

/** English mobile-shell copy. */
export const en = {
  'menu.aria': 'Menu',
  'drawer.close': 'Close panel',
  'install.region': 'Install app',
  'install.title': 'Install on Home Screen',
  'install.description': 'Install to enable task completion notifications',
  'install.action': 'Install',
  'install.dismiss': 'Dismiss',
  'install.iosRegion': 'Add to Home Screen',
  'install.iosTitle': 'Add to Home Screen',
  'install.iosDescription': 'Tap Share, then add the app to enable task completion notifications',
  'push.unsupported': 'This iOS Web App does not support notifications',
  'push.denied': 'Notifications are disabled in system settings',
  'push.enable': 'Turn on completion notifications',
  'push.enableExisting': 'Enable completion notifications',
  'slot.scrim': 'Drawer scrim',
  'slot.newSessionMenu': 'New session menu',
  'slot.install': 'PWA install prompt',
  'slot.push': 'Completion notifications',
} satisfies Record<MobileKey, string>
