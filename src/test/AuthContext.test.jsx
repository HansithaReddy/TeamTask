import React, { useContext } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, AuthContext } from '../context/AuthContext'

vi.mock('../services/api.firebase', () => ({
  default: {
    login: vi.fn(async (email, password) => ({ user: { id: 'u1', name: 'Alice', role: 'user' } })),
    logout: vi.fn(async () => {}),
    register: vi.fn(async (p) => ({ id: 'u2', ...p })),
    // For tests we simulate an authenticated fb user with uid 'pre'
    // and provide a users list which includes that profile so the
    // AuthContext effect can resolve it to a profile.
    onAuthStateChanged: vi.fn((cb) => { cb({ uid: 'pre' }); return () => {} }),
    getUsers: vi.fn(async () => [
      { id: 'pre', name: 'Saved' },
      { id: 'u1', name: 'Alice', email: 'a@x.com' }
    ])
  }
}))

function Consumer() {
  const { user, login, logout, theme, setTheme } = useContext(AuthContext)
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'null'}</div>
      <div data-testid="theme">{theme}</div>
      <button onClick={() => setTheme('dark')}>set-dark</button>
      <button onClick={() => login('a', 'b')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads initial user from localStorage and toggles theme', async () => {
    localStorage.setItem('tm_auth', JSON.stringify({ id: 'pre', name: 'Saved' }))
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('user').textContent).toBe('Saved')
    // toggle theme and ensure documentElement class changes
    fireEvent.click(screen.getByText('set-dark'))
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('login sets user via api.login', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    const btn = screen.getByText('login')
    fireEvent.click(btn)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Alice'))
  })
})
