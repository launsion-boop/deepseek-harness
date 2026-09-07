import { useEffect, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { PushController, PushState } from './push.ts'
import css from './PushPrompt.module.css'

export interface PushPromptInjected { push: PushController }

/** Full composed props: the root overlay runtime share, locale, and controller. */
export type PushPromptProps = PropsRuntime<'shell.overlay'> & PropsLocale<'mobile'> & PushPromptInjected

/** Explicit user-gesture entry for the browser notification permission prompt. */
export function PushPrompt({ push, t }: PushPromptProps) {
  const [state, setState] = useState<PushState>(() => push.snapshot())
  useEffect(() => push.subscribe(() => { setState(push.snapshot()) }), [push])
  // iOS only permits Web Push from a Home Screen web app. Do not turn that
  // platform constraint into persistent chrome for people who prefer using
  // the site in Safari; the install guidance has its own, dismissible banner.
  if (state.subscribed || !state.installed || typeof document === 'undefined') return null
  let content: ReactElement
  if (!state.available) content = <output className={css.notice}>{t('push.unsupported')}</output>
  // Server-side Web Push is not configured: there is nothing to connect to,
  // so the prompt stays silent instead of a permanent "connecting" notice.
  else if (!state.enabled) return null
  else if (state.permission === 'denied') content = <output className={css.notice}>{t('push.denied')}</output>
  else content = <button type="button" className={css.button} onClick={() => { void push.enable() }}>
    {state.permission === 'granted' ? t('push.enableExisting') : t('push.enable')}
  </button>
  // The shell overlay intentionally sits beneath some workspace chrome; a
  // portal puts this iOS-only action above the composer and its safe-area bar.
  return createPortal(content, document.body)
}
