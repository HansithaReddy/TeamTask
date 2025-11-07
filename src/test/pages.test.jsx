import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Dashboard from '../pages/Dashboard'
import Activity from '../pages/Activity'
import Analytics from '../pages/Analytics'
import Users from '../pages/Users'
import UserTasks from '../pages/UserTasks'
import AdminPanel from '../pages/AdminPanel'
import { renderWithProviders } from './test-utils'

vi.mock('../services/api.firebase', () => ({
  default: {
    getUsers: vi.fn(async () => []),
  onTasksChanged: vi.fn((a,b) => { const cb = typeof a === 'function' ? a : b; if (typeof cb === 'function') cb([]); return () => {} }),
    getActivity: vi.fn(async () => []),
    getTasks: vi.fn(async () => []),
    createUser: vi.fn(async (payload) => ({ id: 'u1', ...payload })),
    deleteUser: vi.fn(async (id) => true),
    deleteTask: vi.fn(async (id) => true),
    updateTask: vi.fn(async (id, patch) => ({ id, ...patch })),
    createTask: vi.fn(async (t) => ({ id: 't1', ...t }))
  }
}))

describe('Pages (shallow smoke tests)', () => {
  it('renders Dashboard heading', async () => {
    renderWithProviders(<Dashboard />)
    const matches = screen.getAllByText(/Tasks/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders Activity heading', () => {
    renderWithProviders(<Activity />)
    const matches = screen.getAllByText(/Activity Log/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders Analytics heading', () => {
    renderWithProviders(<Analytics />)
    const matches = screen.getAllByText(/Analytics/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders Users heading', () => {
    renderWithProviders(<Users />)
    const matches = screen.getAllByText(/Users/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders UserTasks heading', () => {
    renderWithProviders(<UserTasks />)
    const matches = screen.getAllByText(/My Tasks/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders AdminPanel heading', () => {
    renderWithProviders(<AdminPanel />, { user: { id: '1', name: 'Admin', role: 'admin' } })
    const matches = screen.getAllByText(/Admin Panel/i)
    expect(matches.length).toBeGreaterThan(0)
  })
})
