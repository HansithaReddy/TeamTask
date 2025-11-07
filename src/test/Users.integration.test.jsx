import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Users from '../pages/Users'
import { renderWithProviders } from './test-utils'

vi.mock('../services/api.firebase', () => ({
  default: {
    getUsers: vi.fn(async () => []),
    createUser: vi.fn(async (payload) => ({ id: 'u1', ...payload })),
    deleteUser: vi.fn(async (id) => true)
  }
}))

describe('Users page (integration)', () => {
  beforeEach(() => { localStorage.clear() })

  it('validates form and creates a user showing toast', async () => {
    renderWithProviders(<Users />, { user: { id: '1', name: 'Admin', role: 'admin' } })

    // open add user
    fireEvent.click(screen.getByText('Add User'))
    // click create without filling -> shows validation error
    fireEvent.click(screen.getByText('Create User'))
    expect(screen.getByText(/Please provide name and email/i)).toBeInTheDocument()

    // fill form
    fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Bob' } })
    fireEvent.change(screen.getByPlaceholderText('Enter email'), { target: { value: 'bob@example.com' } })
    fireEvent.click(screen.getByText('Create User'))

    await waitFor(() => expect(screen.getByText(/User Bob created successfully/i)).toBeInTheDocument())
  })
})
