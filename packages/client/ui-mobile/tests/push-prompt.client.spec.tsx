// @vitest-environment jsdom
/**
 * ui-mobile browser half: PushPrompt stays inert unless an installed web app
 * has a configured delivery route, then exposes only the explicit user action.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PushPrompt, type PushPromptProps } from '../src/client/PushPrompt.tsx'
import type { PushState } from '../src/client/push.ts'
import { zh } from '../src/client/locales.ts'

const ready: PushState = {
  available: true,
  enabled: true,
  permission: 'default',
  subscribed: false,
  installed: true,
}

function props(state: PushState, enable = vi.fn(async () => {})): PushPromptProps {
  return {
    push: {
      snapshot: () => state,
      subscribe: () => () => {},
      enable,
    },
    t: ((key: keyof typeof zh) => zh[key]) as PushPromptProps['t'],
    useSessions: vi.fn(),
    useWorkspaces: vi.fn(),
  } as PushPromptProps
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PushPrompt', () => {
  it('does not offer Web Push before the app is installed', () => {
    render(<PushPrompt {...props({ ...ready, installed: false })} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('stays idle when the Host reports that Web Push is not configured', () => {
    render(<PushPrompt {...props({ ...ready, enabled: false })} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('enables notifications only from an explicit user action', () => {
    const enable = vi.fn(async () => {})
    render(<PushPrompt {...props(ready, enable)} />)
    fireEvent.click(screen.getByRole('button', { name: zh['push.enable'] }))
    expect(enable).toHaveBeenCalledTimes(1)
  })
})
