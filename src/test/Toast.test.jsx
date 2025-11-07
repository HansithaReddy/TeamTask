import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import Toast from '../components/Toast'
import { renderWithProviders } from './test-utils'

describe('Toast', () => {
  afterEach(() => vi.useRealTimers())

  it('renders message and auto-closes after timeout', () => {
    const onClose = vi.fn()
    vi.useFakeTimers()

    renderWithProviders(<Toast show={true} message="Hi" onClose={onClose} />)
    expect(screen.getByText('Hi')).toBeInTheDocument()

    vi.advanceTimersByTime(3100)
    expect(onClose).toHaveBeenCalled()
  })
})
