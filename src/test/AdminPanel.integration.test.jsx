import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AdminPanel from '../pages/AdminPanel'
import { renderWithProviders } from './test-utils'

vi.mock('../services/api.firebase', () => ({
  default: {
    getUsers: vi.fn(async () => [{ id: 'u1', name: 'Alice', email: 'a@x.com' }]),
    createTask: vi.fn(async (t) => ({ id: 't1', ...t })),
    getActivity: vi.fn(async () => []),
  onTasksChanged: vi.fn((a,b) => { const cb = typeof a === 'function' ? a : b; if (typeof cb === 'function') cb([]); return () => {} })
  }
}))

describe('AdminPanel (integration)', () => {
  it('validates create task form and creates a task', async () => {
    renderWithProviders(<AdminPanel />, { user: { id: 'admin', name: 'Admin', role: 'admin' } })

    // Create Task button should be disabled until required fields are filled
    const createBtn = screen.getByText('Create Task')
    expect(createBtn).toBeDisabled()

  // fill minimal form: title
  fireEvent.change(screen.getByPlaceholderText('Enter task title'), { target: { value: 'New Task' } })

  // wait for users to be loaded and the assignee option to appear
  await waitFor(() => expect(screen.getByRole('option', { name: /Alice \(a@x.com\)/i })).toBeInTheDocument())

  const aliceOption = screen.getByRole('option', { name: /Alice \(a@x.com\)/i })
  const select = aliceOption.closest('select')
  expect(select).toBeTruthy()
  // select the assignee by changing the select's value to the option's value
  fireEvent.change(select, { target: { value: aliceOption.value } })

  // Now button should be enabled
  await waitFor(() => expect(createBtn).not.toBeDisabled())
  fireEvent.click(createBtn)

    await waitFor(() => expect(screen.getByText(/Task created/i)).toBeInTheDocument())
  })
})
