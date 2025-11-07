import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PriorityBarChart, CompletionPie } from '../components/ChartAnalytics'
import { renderWithProviders } from './test-utils'

describe('ChartAnalytics', () => {
  it('renders a Recharts responsive container for PriorityBarChart', () => {
    const tasks = [
      { id: '1', priority: 'low' },
      { id: '2', priority: 'medium' },
      { id: '3', priority: 'high' }
    ]
    renderWithProviders(<PriorityBarChart tasks={tasks} />)
    // Recharts uses a wrapper div with this class; assert it rendered to avoid relying on SVG internals in jsdom
    expect(document.querySelector('.recharts-responsive-container')).toBeTruthy()
  })

  it('renders a Recharts responsive container for CompletionPie', () => {
    const tasks = [
      { id: '1', status: 'Done' },
      { id: '2', status: 'To Do' }
    ]
    renderWithProviders(<CompletionPie tasks={tasks} />)
    expect(document.querySelector('.recharts-responsive-container')).toBeTruthy()
  })
})
