import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export function renderWithProviders(ui, { route = '/', user = { id: '1', name: 'Test User', role: 'user' } } = {}) {
  return render(
    <AuthContext.Provider value={{ user, theme: 'light', setTheme: () => {} }}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  )
}

export default renderWithProviders
