import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TaskDialog from '../components/TaskDialog'
import { renderWithProviders } from './test-utils'

vi.mock('../services/api.firebase', () => ({
  default: {
    addComment: vi.fn(async (taskId, c) => ({ id: 'c1', ...c })),
  }
}))

describe('TaskDialog', () => {
  it('shows task info and allows assignee to add comment', async () => {
    const task = {
      id: 't1',
      title: 'Sample Task',
      status: 'To Do',
      priority: 'medium',
      assignee: '1',
      assignedBy: 'Admin',
      comments: []
    }

    const onClose = vi.fn()
    const onUpdate = vi.fn()
    const onComment = vi.fn()

    renderWithProviders(
      <TaskDialog task={task} onClose={onClose} onUpdate={onUpdate} onComment={onComment} />,
      { user: { id: '1', name: 'Test User', role: 'user' } }
    )

    expect(screen.getByText('Sample Task')).toBeInTheDocument()
    expect(screen.getByText('Assigned by: Admin')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Add a comment...')
    fireEvent.change(input, { target: { value: 'Hello comment' } })
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(onComment).toHaveBeenCalled()
    })
  })
})
