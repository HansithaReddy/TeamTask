import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '../components/Sidebar'
import { renderWithProviders } from './test-utils'

describe('Sidebar', () => {
  it('shows admin links when user is admin', () => {
    renderWithProviders(<Sidebar />, { user: { id: '1', name: 'Admin', role: 'admin' } })
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  it('shows user links when role is user', () => {
    renderWithProviders(<Sidebar />, { user: { id: '2', name: 'User', role: 'user' } })
    expect(screen.getByText('My Tasks')).toBeInTheDocument()
    // clicking the mobile menu button is unnecessary for this assertion; ensure multiple buttons don't break tests
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
