/**
 * Mobile keyboard action hint for the resident conversation editor. The
 * host already treats ordinary Enter as submit; this plugin patch changes the
 * iOS/Android keyboard affordance from a newline to "Send" without taking
 * over the host's IME, queue, or duplicate-send safeguards.
 */
import { MOBILE_QUERY } from './frame.ts'

const COMPOSER_INPUT = '[data-composer-input][contenteditable="true"][role="textbox"]'

/**
 * Mark a composer editor so virtual keyboards advertise the send action.
 * @param node - possible composer node to inspect and mark.
 */
export function markMobileComposerSendAction(node: Node): void {
  if (!(node instanceof HTMLElement) || !node.matches(COMPOSER_INPUT)) return
  node.setAttribute('enterkeyhint', 'send')
  node.enterKeyHint = 'send'
}

/**
 * Install the phone-only keyboard-action presenter.
 * @returns disposer for the DOM observer, or a no-op outside phone viewports.
 */
export function enableMobileEnterSend(): () => void {
  if (typeof window.matchMedia !== 'function' || !window.matchMedia(MOBILE_QUERY).matches) return () => {}
  for (const editor of document.querySelectorAll<HTMLElement>(COMPOSER_INPUT)) {
    markMobileComposerSendAction(editor)
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') markMobileComposerSendAction(record.target)
      for (const node of record.addedNodes) {
        markMobileComposerSendAction(node)
        if (node instanceof Element) {
          for (const editor of node.querySelectorAll<HTMLElement>(COMPOSER_INPUT)) {
            markMobileComposerSendAction(editor)
          }
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['contenteditable', 'data-composer-input', 'role'] })
  return () => { observer.disconnect() }
}
