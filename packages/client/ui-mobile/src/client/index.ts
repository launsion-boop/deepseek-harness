/**
 * Mobile plugin, browser half: the responsive shell surface.
 *
 * One effect owns the DOM side — the MobileFrameController stamps stable data
 * attributes on the assembled AppFrame (whose column classes are CSS-module
 * hashed and unreachable cross-plugin) and mirrors drawer + viewport state;
 * the mobile.module.css sheet (side-effect import) restructures the frame
 * into a single column with off-canvas drawers below 640px. The phone-tier
 * surface is split across three registrations: the sidebar toggle in the
 * session header's left strip (`conversation.session.header.left`), the
 * drawer scrim and the PWA install banner in the frame's `shell.overlay`
 * list slot. A second effect owns the install controller's window listeners.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the layout plugin's Context merge (ctx.layout) and the
// ui-layout SlotMap declaration (shell.overlay) into this compilation unit.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { MobileFrameController } from './frame.ts'
import { EdgeSwipeController } from './edge-swipe.ts'
import { InstallController } from './install.ts'
import { InstallBanner, type InstallBannerInjected } from './InstallBanner.tsx'
import { HeaderMenuButton, type HeaderMenuButtonInjected } from './HeaderMenuButton.tsx'
import { NewSessionMenuButton, type NewSessionMenuButtonInjected } from './NewSessionMenuButton.tsx'
import { DrawerScrim, type DrawerScrimInjected } from './DrawerScrim.tsx'
import { registerServiceWorker } from './sw.ts'
import { suppressCommandPanelScriptFocus } from './command-focus.ts'
import { enableMobileEnterSend } from './mobile-enter-send.ts'
import { lockMobilePageZoom } from './page-zoom-lock.ts'
import { PushController } from './push.ts'
import { PushPrompt, type PushPromptInjected } from './PushPrompt.tsx'
import { en, zh, type MobileKey } from './locales.ts'
import './mobile.module.css'

export type { HeaderMenuButtonInjected } from './HeaderMenuButton.tsx'
export type { NewSessionMenuButtonInjected } from './NewSessionMenuButton.tsx'
export type { DrawerScrimInjected } from './DrawerScrim.tsx'
export type { MobileNavState } from './frame.ts'
export type { InstallBannerInjected } from './InstallBanner.tsx'
export type { InstallState } from './install.ts'
export type { PushPromptInjected } from './PushPrompt.tsx'
export type { MobileKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Mobile shell controls and install/push prompts. */
    mobile: MobileKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'mobile'

/** Required services: the layout panel actions and the slot registry. */
export const inject = ['layout', 'locale', 'slots', 'sessions']

/**
 * Client plugin body: register the app-shell service worker, start the frame
 * and install controllers, then register the header menu toggle, the drawer
 * scrim, and the install banner once their slots are declared.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-mobile: dictionaries')
  const t = ctx.locale.bind(NS)
  registerServiceWorker()
  const controller = new MobileFrameController()
  const edgeSwipe = new EdgeSwipeController(controller, () => { ctx.layout.toggleSidebar() })
  const install = new InstallController()
  const push = new PushController((sessionId) => { ctx.sessions.open(sessionId as SessionId) })
  ctx.effect(() => {
    controller.start()
    edgeSwipe.start()
    install.start()
    void push.start()
    return () => {
      controller.stop()
      edgeSwipe.stop()
      install.stop()
      push.stop()
    }
  }, 'ui-mobile: frame stabilization + install controller')

  // Command-panel keyboard guard: phone tier only, so it never disturbs the
  // desktop combobox behavior; see command-focus.ts.
  ctx.effect(() => suppressCommandPanelScriptFocus(), 'ui-mobile: command panel keyboard guard')
  ctx.effect(() => enableMobileEnterSend(), 'ui-mobile: keyboard send action')
  ctx.effect(() => lockMobilePageZoom(), 'ui-mobile: page zoom lock')

  // Shared inject face for the two drawer-control surfaces (header toggle and
  // the tap-outside scrim): the same frame snapshot + the sidebar toggle.
  const drawerControls = () => ({
    toggleSidebar: () => { ctx.layout.toggleSidebar() },
    subscribe: (listener: () => void) => controller.subscribe(listener),
    snapshot: () => controller.snapshot(),
  })

  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'mobile-menu',
    order: -10,
    label: t('menu.aria'),
    locale: NS,
    inject: (): HeaderMenuButtonInjected => drawerControls(),
  }, HeaderMenuButton))

  ctx.slots.inject('shell.overlay', () => {
    const registerScrim = ctx.slots.register({
      name: 'shell.overlay',
      id: 'mobile-scrim',
      order: 110,
      label: t('slot.scrim'),
      locale: NS,
      inject: (): DrawerScrimInjected => drawerControls(),
    }, DrawerScrim)
    const registerNewSessionMenu = ctx.slots.register({
      name: 'shell.overlay', id: 'mobile-new-session-menu', order: 89, label: t('slot.newSessionMenu'), locale: NS,
      inject: (): NewSessionMenuButtonInjected => drawerControls(),
    }, NewSessionMenuButton)
    const registerBanner = ctx.slots.register({
      name: 'shell.overlay',
      id: 'mobile-install',
      order: 90,
      label: t('slot.install'),
      locale: NS,
      inject: (): InstallBannerInjected => ({
        snapshot: () => install.snapshot(),
        subscribe: listener => install.subscribe(listener),
        install: () => install.install(),
        dismissInstallPromotion: () => { install.dismissInstallPromotion() },
      }),
    }, InstallBanner)
    const registerPushPrompt = ctx.slots.register({
      name: 'shell.overlay', id: 'mobile-push-prompt', order: 91, label: t('slot.push'), locale: NS,
      inject: (): PushPromptInjected => ({ push }),
    }, PushPrompt)
    return () => {
      registerScrim()
      registerNewSessionMenu()
      registerBanner()
      registerPushPrompt()
    }
  })
}
