import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TaskCardSimple from '../components/TaskCardSimple'
import { renderWithProviders } from './test-utils'

describe('TaskCardSimple', () => {
  it('renders title, priority and assigned by and handles click', () => {
    const task = { id: 't1', title: 'Do thing', priority: 'high', status: 'To Do', due: new Date().toISOString(), assignedBy: 'Admin' }
    const onClick = vi.fn()
    renderWithProviders(<TaskCardSimple task={task} onClick={onClick} />)
    expect(screen.getByText('Do thing')).toBeInTheDocument()
    expect(screen.getByText(/Assigned by:/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Do thing'))
    expect(onClick).toHaveBeenCalled()
  })
})
