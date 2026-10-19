// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableMobileEnterSend, markMobileComposerSendAction } from '../src/client/mobile-enter-send.ts'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe('mobile keyboard send action', () => {
  it('marks only the conversation editor as a send action', () => {
    const composer = document.createElement('div')
    composer.setAttribute('contenteditable', 'true')
    composer.setAttribute('role', 'textbox')
    composer.dataset.composerInput = ''
    const other = document.createElement('div')
    markMobileComposerSendAction(composer)
    markMobileComposerSendAction(other)
    expect(composer.enterKeyHint).toBe('send')
    expect(other.getAttribute('enterkeyhint')).toBeNull()
  })

  it('marks existing and newly mounted composer editors on phones', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const existing = document.createElement('div')
    existing.setAttribute('contenteditable', 'true')
    existing.setAttribute('role', 'textbox')
    existing.dataset.composerInput = ''
    document.body.append(existing)
    const stop = enableMobileEnterSend()
    expect(existing.enterKeyHint).toBe('send')
    const mounted = document.createElement('div')
    mounted.setAttribute('contenteditable', 'true')
    mounted.setAttribute('role', 'textbox')
    mounted.dataset.composerInput = ''
    mounted.setAttribute('contenteditable', 'false')
    const wrapper = document.createElement('section')
    wrapper.append(mounted)
    document.body.append(wrapper)
    await Promise.resolve()
    expect(mounted.getAttribute('enterkeyhint')).toBeNull()
    mounted.setAttribute('contenteditable', 'true')
    await Promise.resolve()
    expect(mounted.enterKeyHint).toBe('send')
    stop()
    mounted.removeAttribute('enterkeyhint')
    mounted.setAttribute('contenteditable', 'false')
    mounted.setAttribute('contenteditable', 'true')
    await Promise.resolve()
    expect(mounted.getAttribute('enterkeyhint')).toBeNull()
  })

  it('does nothing outside phone tier', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    const composer = document.createElement('div')
    composer.setAttribute('contenteditable', 'true')
    composer.setAttribute('role', 'textbox')
    composer.dataset.composerInput = ''
    document.body.append(composer)
    enableMobileEnterSend()
    expect(composer.getAttribute('enterkeyhint')).toBeNull()
  })
})
